# routers/admin.py — Admin endpoints for managing quotations and viewing activity logs
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List
from beanie import PydanticObjectId
from bson.errors import InvalidId
from app.models import (
    QUOTATION_STATUSES,
    ActivityLog,
    QuotationRequest,
    User,
    normalize_quotation_status,
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ── Dependency: require ADMIN role ────────────────────────────────────────────
async def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ── Schemas ───────────────────────────────────────────────────────────────────
class QuotationActionRequest(BaseModel):
    action: str  # "Approved" or "Rejected"
    admin_comments: Optional[str] = None


class AdminQuotationResponse(BaseModel):
    id: str
    customer_name: str
    company: Optional[str]
    email: str
    phone: Optional[str]
    application: Optional[str]
    liquid_type: Optional[str]
    viscosity_cp: Optional[float]
    flow_rate_ml_min: Optional[float]
    droplet_size_um: Optional[float]
    frequency_khz: Optional[float]
    additional_requirements: Optional[str]
    recommended_product: Optional[str]
    notes: Optional[str]
    status: str
    estimated_price: Optional[float]
    admin_comments: Optional[str]
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ActivityLogResponse(BaseModel):
    id: str
    user_id: str
    username: str
    role: str
    action: str
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Dashboard stats ───────────────────────────────────────────────────────────
@router.get("/dashboard", summary="Admin dashboard statistics")
async def admin_dashboard(admin: User = Depends(require_admin)):
    total = await QuotationRequest.find_all().count()
    status_counts = {
        status: await QuotationRequest.find({
            "status": {"$regex": f"^{status}$", "$options": "i"}
        }).count()
        for status in QUOTATION_STATUSES
    }
    total_users = await User.find({"role": "USER"}).count()
    total_admins = await User.find({"role": "ADMIN"}).count()
    recent_activities = await ActivityLog.find_all().sort("-created_at").limit(10).to_list()

    return {
        "total_quotations": total,
        "pending": status_counts["Pending"],
        "approved": status_counts["Approved"],
        "rejected": status_counts["Rejected"],
        "in_review": status_counts["In Review"],
        "quoted": status_counts["Quoted"],
        "closed": status_counts["Closed"],
        "total_users": total_users,
        "total_admins": total_admins,
        "recent_activities": [
            {
                "id": str(a.id),
                "username": a.username,
                "role": a.role,
                "action": a.action,
                "details": a.details,
                "created_at": a.created_at.isoformat(),
            }
            for a in recent_activities
        ],
    }


# ── List all quotations for admin ─────────────────────────────────────────────
@router.get("/quotations", summary="List all quotations (admin view)")
async def list_all_quotations(
    status_filter: Optional[str] = None,
    admin: User = Depends(require_admin),
):
    query = {}
    if status_filter:
        query["status"] = {"$regex": f"^{status_filter}$", "$options": "i"}
    quotations = await QuotationRequest.find(query).sort("-created_at").to_list()
    return [
        {
            "id": str(q.id),
            "customer_name": q.customer_name,
            "company": q.company,
            "email": q.email,
            "phone": q.phone,
            "application": q.application,
            "liquid_type": q.liquid_type,
            "viscosity_cp": q.viscosity_cp,
            "flow_rate_ml_min": q.flow_rate_ml_min,
            "droplet_size_um": q.droplet_size_um,
            "frequency_khz": q.frequency_khz,
            "additional_requirements": q.additional_requirements,
            "recommended_product": q.recommended_product,
            "notes": q.notes,
            "status": normalize_quotation_status(q.status),
            "estimated_price": q.estimated_price,
            "admin_comments": q.admin_comments,
            "reviewed_by": q.reviewed_by,
            "reviewed_at": q.reviewed_at.isoformat() if q.reviewed_at else None,
            "created_at": q.created_at.isoformat(),
            "updated_at": q.updated_at.isoformat(),
        }
        for q in quotations
    ]


# ── Approve or Reject a quotation ────────────────────────────────────────────
@router.patch("/quotations/{quotation_id}", summary="Approve or reject a quotation")
async def update_quotation_status(
    quotation_id: str,
    data: QuotationActionRequest,
    request: Request,
    admin: User = Depends(require_admin),
):
    allowed_actions = {"Approved", "Rejected", "In Review", "Quoted", "Closed", "Pending"}
    if data.action not in allowed_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action '{data.action}'. Allowed: {', '.join(sorted(allowed_actions))}",
        )

    try:
        quotation = await QuotationRequest.get(PydanticObjectId(quotation_id))
    except (InvalidId, TypeError, ValueError):
        quotation = None
    if not quotation:
        raise HTTPException(status_code=404, detail=f"Quotation #{quotation_id} not found")

    quotation.status = data.action
    response_message = (data.admin_comments or "").strip()
    if data.action in {"Approved", "Rejected"} and not response_message:
        response_message = f"Your quotation request has been {data.action.lower()}."
    if response_message:
        quotation.admin_comments = response_message
    quotation.reviewed_by = admin.username
    quotation.reviewed_at = datetime.utcnow()
    quotation.updated_at = datetime.utcnow()
    await quotation.save()

    # Log admin activity
    await ActivityLog(
        user_id=str(admin.id),
        username=admin.username,
        role=admin.role,
        action=f"{data.action.upper()}_QUOTATION",
        details=f"Quotation #{quotation_id} {data.action.lower()} by {admin.username}. Message: {response_message or 'None'}",
        ip_address=request.client.host if request.client else None,
    ).insert()

    return {
        "id": str(quotation.id),
        "customer_name": quotation.customer_name,
        "status": quotation.status,
        "admin_comments": quotation.admin_comments,
        "reviewed_by": quotation.reviewed_by,
        "reviewed_at": quotation.reviewed_at.isoformat() if quotation.reviewed_at else None,
        "message": f"Quotation #{quotation_id} has been {data.action.lower()}.",
    }


# ── Get single quotation detail (admin) ──────────────────────────────────────
@router.get("/quotations/{quotation_id}", summary="Get quotation details (admin)")
async def get_quotation_detail(
    quotation_id: str,
    admin: User = Depends(require_admin),
):
    try:
        quotation = await QuotationRequest.get(PydanticObjectId(quotation_id))
    except (InvalidId, TypeError, ValueError):
        quotation = None
    if not quotation:
        raise HTTPException(status_code=404, detail=f"Quotation #{quotation_id} not found")
    return {
        "id": str(quotation.id),
        "customer_name": quotation.customer_name,
        "company": quotation.company,
        "email": quotation.email,
        "phone": quotation.phone,
        "application": quotation.application,
        "liquid_type": quotation.liquid_type,
        "viscosity_cp": quotation.viscosity_cp,
        "flow_rate_ml_min": quotation.flow_rate_ml_min,
        "droplet_size_um": quotation.droplet_size_um,
        "frequency_khz": quotation.frequency_khz,
        "additional_requirements": quotation.additional_requirements,
        "recommended_product": quotation.recommended_product,
        "notes": quotation.notes,
        "status": quotation.status,
        "estimated_price": quotation.estimated_price,
        "admin_comments": quotation.admin_comments,
        "reviewed_by": quotation.reviewed_by,
        "reviewed_at": quotation.reviewed_at.isoformat() if quotation.reviewed_at else None,
        "created_at": quotation.created_at.isoformat(),
        "updated_at": quotation.updated_at.isoformat(),
    }


# ── Activity logs ─────────────────────────────────────────────────────────────
@router.get("/activity-logs", summary="View all activity logs")
async def list_activity_logs(
    limit: int = 50,
    admin: User = Depends(require_admin),
):
    logs = await ActivityLog.find_all().sort("-created_at").limit(limit).to_list()
    return [
        {
            "id": str(log.id),
            "user_id": log.user_id,
            "username": log.username,
            "role": log.role,
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]
