"""
routers/followups.py — Follow-up tracking API endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from beanie import PydanticObjectId
from bson.errors import InvalidId
from app.auth import require_role
<<<<<<< HEAD
from app.models import FollowUp, QuotationRequest, utc_isoformat
=======
from app.models import FollowUp, QuotationRequest
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8
from app.schemas import FollowUpCreate, FollowUpResponse
from app.models import User

router = APIRouter(prefix="/api/followups", tags=["Follow-ups"])


@router.post("/", response_model=FollowUpResponse, status_code=201, summary="Create a follow-up record")
async def create_followup(data: FollowUpCreate, admin: User = Depends(require_role("ADMIN"))):
    """Create a follow-up record linked to a quotation request."""
    try:
        quotation = await QuotationRequest.get(PydanticObjectId(data.quotation_id))
    except (InvalidId, TypeError, ValueError):
        quotation = None
    if not quotation:
        raise HTTPException(
            status_code=404,
            detail=f"Quotation #{data.quotation_id} not found",
        )
    followup = FollowUp(**data.model_dump())
    await followup.insert()
    return followup


@router.get("/quotation/{quotation_id}", response_model=List[FollowUpResponse], summary="Get follow-ups for a quotation")
async def get_followups_for_quotation(
    quotation_id: str,
    admin: User = Depends(require_role("ADMIN")),
):
    """Returns all follow-up records for a given quotation."""
    try:
        PydanticObjectId(quotation_id)
    except (InvalidId, TypeError, ValueError):
        raise HTTPException(status_code=404, detail=f"Quotation #{quotation_id} not found")
    return await FollowUp.find(FollowUp.quotation_id == quotation_id).sort("-created_at").to_list()


@router.get("/", response_model=List[FollowUpResponse], summary="List all follow-ups")
async def list_followups(admin: User = Depends(require_role("ADMIN"))):
    """Returns all follow-up records."""
    return await FollowUp.find_all().sort("-created_at").to_list()
<<<<<<< HEAD


@router.get("/admin/all", summary="List follow-ups with quotation contact details")
async def list_admin_followups(admin: User = Depends(require_role("ADMIN"))):
    """Returns scheduled calls together with the customer contact details admins need."""
    followups = await FollowUp.find_all().sort("follow_up_date").to_list()
    quotation_ids = {followup.quotation_id for followup in followups}
    quotations = await QuotationRequest.find(
        {"_id": {"$in": [PydanticObjectId(quotation_id) for quotation_id in quotation_ids]}}
    ).to_list() if quotation_ids else []
    quotations_by_id = {str(quotation.id): quotation for quotation in quotations}

    results = []
    for followup in followups:
        quotation = quotations_by_id.get(followup.quotation_id)
        if quotation is None:
            continue
        results.append({
            "id": str(followup.id),
            "quotation_id": followup.quotation_id,
            "action_taken": followup.action_taken,
            "notes": followup.notes,
            "follow_up_date": utc_isoformat(followup.follow_up_date),
            "status": followup.status,
            "created_at": utc_isoformat(followup.created_at),
            "customer_name": quotation.customer_name,
            "company": quotation.company,
            "email": quotation.email,
            "phone": quotation.phone,
            "application": quotation.application,
        })
    return results
=======
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8
