"""
routers/followups.py — Follow-up tracking API endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from beanie import PydanticObjectId
from bson.errors import InvalidId
from app.auth import require_role
from app.models import FollowUp, QuotationRequest
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
