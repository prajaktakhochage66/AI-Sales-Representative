"""
routers/quotations.py — Quotation request API endpoints.
"""

from datetime import datetime, timezone
import logging
from typing import List

from beanie import PydanticObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Response

from app.auth import get_current_user, require_role
from app.models import ActivityLog, FollowUp, QuotationRequest, User, normalize_quotation_status
from app.schemas import QuotationCreate, QuotationResponse
from app.quotation_documents import (
    QuotationEmailDeliveryError,
    email_approved_quotation,
    prepare_quotation_for_approval,
)

router = APIRouter(prefix="/api/quotations", tags=["Quotations"])
logger = logging.getLogger(__name__)


def calculate_estimate(data: QuotationCreate) -> float:
    total = 0.0
    for field in ("viscosity_cp", "flow_rate_ml_min", "droplet_size_um", "frequency_khz"):
        value = getattr(data, field, None)
        if value is not None:
            total += float(value)
    return round(total * 10, 2)


@router.get("/pending-count", summary="Get pending quotations count")
async def pending_count(current_user: User = Depends(get_current_user)):
    query = {"status": {"$regex": "^Pending$", "$options": "i"}}
    if current_user.role != "ADMIN":
        query["user_id"] = str(current_user.id)
    return {"count": await QuotationRequest.find(query).count()}


async def quotation_responses_with_followups(quotations: List[QuotationRequest]) -> List[dict]:
    quotation_ids = [str(quotation.id) for quotation in quotations]
    followups = await FollowUp.find(
        {"quotation_id": {"$in": quotation_ids}}
    ).sort("-created_at").to_list() if quotation_ids else []
    followups_by_quotation: dict[str, list[FollowUp]] = {}
    for followup in followups:
        followups_by_quotation.setdefault(followup.quotation_id, []).append(followup)

    responses = []
    for quotation in quotations:
        response = QuotationResponse.model_validate(quotation).model_dump()
        response["follow_ups"] = followups_by_quotation.get(str(quotation.id), [])
        responses.append(response)
    return responses


@router.post("/", response_model=QuotationResponse, status_code=201, summary="Submit a quotation request")
async def create_quotation(data: QuotationCreate, user: User = Depends(get_current_user)):
    quotation = QuotationRequest(**data.model_dump())
    quotation.user_id = str(user.id)
    quotation.estimated_price = calculate_estimate(data)
    await quotation.insert()
    await ActivityLog(
        user_id=str(user.id),
        username=user.username,
        role=user.role,
        action="SUBMIT_QUOTATION",
        details=f"Quotation #{quotation.id} submitted",
    ).insert()
    return quotation


@router.get("/", response_model=List[QuotationResponse], summary="List quotation requests")
async def list_quotations(current_user: User = Depends(get_current_user)):
    query = (
        QuotationRequest.find_all()
        if current_user.role == "ADMIN"
        else QuotationRequest.find({"user_id": str(current_user.id)})
    )
    quotations = await query.sort("-created_at").to_list()
    for quotation in quotations:
        quotation.status = normalize_quotation_status(quotation.status)
    return await quotation_responses_with_followups(quotations)


@router.get("/{quotation_id}", response_model=QuotationResponse, summary="Get a quotation request")
async def get_quotation(quotation_id: str, current_user: User = Depends(get_current_user)):
    try:
        quotation = await QuotationRequest.get(PydanticObjectId(quotation_id))
    except (InvalidId, TypeError, ValueError):
        quotation = None
    if not quotation or (
        current_user.role != "ADMIN" and quotation.user_id != str(current_user.id)
    ):
        raise HTTPException(status_code=404, detail=f"Quotation #{quotation_id} not found")
    quotation.status = normalize_quotation_status(quotation.status)
    return (await quotation_responses_with_followups([quotation]))[0]


@router.get("/{quotation_id}/pdf", summary="Download an approved quotation PDF")
async def download_quotation_pdf(
    quotation_id: str,
    current_user: User = Depends(get_current_user),
):
    try:
        quotation = await QuotationRequest.get(PydanticObjectId(quotation_id))
    except (InvalidId, TypeError, ValueError):
        quotation = None
    if not quotation or (
        current_user.role != "ADMIN" and quotation.user_id != str(current_user.id)
    ):
        raise HTTPException(status_code=404, detail=f"Quotation #{quotation_id} not found")
    if quotation.status != "Approved":
        raise HTTPException(status_code=409, detail="The quotation PDF is available after approval.")
    from app.quotation_documents import render_quotation_pdf
    try:
        pdf = render_quotation_pdf(quotation)
    except ValueError as error:
        raise HTTPException(status_code=409, detail="This approved quotation has no complete commercial pricing.") from error
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="WaveNxD-Quotation-{quotation.id}.pdf"'},
    )


@router.patch("/{quotation_id}/status", response_model=QuotationResponse, summary="Update quotation status")
async def update_status(
    quotation_id: str,
    status: str,
    admin: User = Depends(require_role("ADMIN")),
):
    allowed = {"Pending", "In Review", "Quoted", "Closed", "Approved", "Rejected"}
    if status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{status}'. Allowed: {', '.join(sorted(allowed))}",
        )
    try:
        quotation = await QuotationRequest.get(PydanticObjectId(quotation_id))
    except (InvalidId, TypeError, ValueError):
        quotation = None
    if not quotation:
        raise HTTPException(status_code=404, detail=f"Quotation #{quotation_id} not found")
    pdf_bytes = None
    if status == "Approved":
        if quotation.status == "Approved":
            raise HTTPException(status_code=409, detail="This quotation is already approved.")
        try:
            pdf_bytes = prepare_quotation_for_approval(quotation)
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error
        except RuntimeError as error:
            raise HTTPException(status_code=503, detail=str(error)) from error
    quotation.status = status
    quotation.reviewed_by = admin.username
    quotation.reviewed_at = datetime.now(timezone.utc)
    quotation.updated_at = datetime.now(timezone.utc)
    await quotation.save()
    await ActivityLog(
        user_id=str(admin.id),
        username=admin.username,
        role=admin.role,
        action=f"{status.upper().replace(' ', '_')}_QUOTATION",
        details=f"Quotation #{quotation_id} status changed to {status}",
    ).insert()
    if status == "Approved":
        try:
            await email_approved_quotation(quotation, pdf_bytes)
        except QuotationEmailDeliveryError as error:
            logger.exception("Quotation email delivery failed for quotation %s", quotation_id)
            raise HTTPException(
                status_code=502,
                detail=(
                    f"Quotation #{quotation_id} was approved, but email delivery failed. "
                    "The PDF is available in the customer's dashboard; retry email from the admin panel."
                ),
            ) from error
    return quotation
