"""
routers/quotations.py — Quotation request API endpoints.
"""

from datetime import datetime
from typing import List

from beanie import PydanticObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user, require_role
from app.models import ActivityLog, QuotationRequest, User, normalize_quotation_status
from app.schemas import QuotationCreate, QuotationResponse

router = APIRouter(prefix="/api/quotations", tags=["Quotations"])


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
    return quotations


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
    return quotation


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
    quotation.status = status
    quotation.reviewed_by = admin.username
    quotation.reviewed_at = datetime.utcnow()
    quotation.updated_at = datetime.utcnow()
    await quotation.save()
    await ActivityLog(
        user_id=str(admin.id),
        username=admin.username,
        role=admin.role,
        action=f"{status.upper().replace(' ', '_')}_QUOTATION",
        details=f"Quotation #{quotation_id} status changed to {status}",
    ).insert()
    return quotation
