# routers/admin.py — Admin endpoints for managing quotations and viewing activity logs
import logging
from datetime import date, datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from beanie import PydanticObjectId
from bson.errors import InvalidId
from app.models import (
    QUOTATION_STATUSES,
    ActivityLog,
    QuotationRequest,
    User,
    normalize_quotation_status,
    utc_isoformat,
)
from app.auth import get_current_user
from app.quotation_documents import (
    QuotationEmailDeliveryError,
    email_approved_quotation,
    prepare_quotation_for_approval,
    validate_quotation_for_approval,
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])
logger = logging.getLogger(__name__)


# ── Dependency: require ADMIN role ────────────────────────────────────────────
async def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ── Schemas ───────────────────────────────────────────────────────────────────
class QuotationActionRequest(BaseModel):
    action: str  # "Approved" or "Rejected"
    admin_comments: Optional[str] = None
    quotation_product: Optional[str] = Field(None, min_length=1, max_length=300)
    unit_price: Optional[float] = Field(None, ge=0, le=1000000000000, allow_inf_nan=False)
    tax_rate_percent: Optional[float] = Field(None, ge=0, le=100, allow_inf_nan=False)
    shipping_charge: Optional[float] = Field(None, ge=0, le=1000000000000, allow_inf_nan=False)
    customization_charge: Optional[float] = Field(None, ge=0, le=1000000000000, allow_inf_nan=False)
    currency: str = Field(default="INR", pattern=r"^[A-Za-z]{3}$")
    validity_days: int = Field(default=30, ge=1, le=365)
    payment_terms: Optional[str] = Field(None, max_length=2000)

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()


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
    quantity: int
    quotation_product: Optional[str]
    unit_price: Optional[float]
    quotation_subtotal: Optional[float]
    tax_rate_percent: Optional[float]
    tax_amount: Optional[float]
    shipping_charge: Optional[float]
    customization_charge: Optional[float]
    quotation_total: Optional[float]
    currency: str
    validity_days: Optional[int]
    payment_terms: Optional[str]
    quotation_issued_at: Optional[datetime]
    quotation_valid_until: Optional[date]
    quotation_email_status: Optional[str]
    quotation_email_sent_at: Optional[datetime]
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
                "created_at": utc_isoformat(a.created_at),
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
            "quantity": q.quantity,
            "quotation_product": q.quotation_product,
            "unit_price": q.unit_price,
            "quotation_subtotal": q.quotation_subtotal,
            "tax_rate_percent": q.tax_rate_percent,
            "tax_amount": q.tax_amount,
            "shipping_charge": q.shipping_charge,
            "customization_charge": q.customization_charge,
            "quotation_total": q.quotation_total,
            "currency": q.currency,
            "validity_days": q.validity_days,
            "payment_terms": q.payment_terms,
            "quotation_issued_at": utc_isoformat(q.quotation_issued_at),
            "quotation_valid_until": q.quotation_valid_until.isoformat() if q.quotation_valid_until else None,
            "quotation_email_status": q.quotation_email_status,
            "quotation_email_sent_at": utc_isoformat(q.quotation_email_sent_at),
            "admin_comments": q.admin_comments,
            "reviewed_by": q.reviewed_by,
            "reviewed_at": utc_isoformat(q.reviewed_at),
            "created_at": utc_isoformat(q.created_at),
            "updated_at": utc_isoformat(q.updated_at),
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

    pdf_bytes = None
    if data.action == "Approved":
        if quotation.status == "Approved":
            raise HTTPException(
                status_code=409,
                detail="This quotation is already approved. Use the resend email action if needed.",
            )
        quotation.unit_price = data.unit_price
        quotation.quotation_product = data.quotation_product.strip() if data.quotation_product else None
        quotation.tax_rate_percent = data.tax_rate_percent
        quotation.shipping_charge = data.shipping_charge
        quotation.customization_charge = data.customization_charge
        quotation.currency = data.currency
        quotation.validity_days = data.validity_days
        quotation.payment_terms = data.payment_terms
        try:
            pdf_bytes = prepare_quotation_for_approval(quotation)
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error
        except RuntimeError as error:
            raise HTTPException(status_code=503, detail=str(error)) from error

    quotation.status = data.action
    response_message = (data.admin_comments or "").strip()
    if data.action in {"Approved", "Rejected"} and not response_message:
        response_message = f"Your quotation request has been {data.action.lower()}."
    if response_message:
        quotation.admin_comments = response_message
    quotation.reviewed_by = admin.username
    quotation.reviewed_at = datetime.now(timezone.utc)
    quotation.updated_at = datetime.now(timezone.utc)
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

    if data.action == "Approved":
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

    return {
        "id": str(quotation.id),
        "customer_name": quotation.customer_name,
        "status": quotation.status,
        "admin_comments": quotation.admin_comments,
        "quantity": quotation.quantity,
        "quotation_product": quotation.quotation_product,
        "unit_price": quotation.unit_price,
        "quotation_subtotal": quotation.quotation_subtotal,
        "tax_rate_percent": quotation.tax_rate_percent,
        "tax_amount": quotation.tax_amount,
        "shipping_charge": quotation.shipping_charge,
        "customization_charge": quotation.customization_charge,
        "quotation_total": quotation.quotation_total,
        "currency": quotation.currency,
        "validity_days": quotation.validity_days,
        "payment_terms": quotation.payment_terms,
        "quotation_issued_at": utc_isoformat(quotation.quotation_issued_at),
        "quotation_valid_until": quotation.quotation_valid_until.isoformat() if quotation.quotation_valid_until else None,
        "quotation_email_status": quotation.quotation_email_status,
        "quotation_email_sent_at": utc_isoformat(quotation.quotation_email_sent_at),
        "reviewed_by": quotation.reviewed_by,
        "reviewed_at": utc_isoformat(quotation.reviewed_at),
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
        "quantity": quotation.quantity,
        "quotation_product": quotation.quotation_product,
        "unit_price": quotation.unit_price,
        "quotation_subtotal": quotation.quotation_subtotal,
        "tax_rate_percent": quotation.tax_rate_percent,
        "tax_amount": quotation.tax_amount,
        "shipping_charge": quotation.shipping_charge,
        "customization_charge": quotation.customization_charge,
        "quotation_total": quotation.quotation_total,
        "currency": quotation.currency,
        "validity_days": quotation.validity_days,
        "payment_terms": quotation.payment_terms,
        "quotation_issued_at": utc_isoformat(quotation.quotation_issued_at),
        "quotation_valid_until": quotation.quotation_valid_until.isoformat() if quotation.quotation_valid_until else None,
        "quotation_email_status": quotation.quotation_email_status,
        "quotation_email_sent_at": utc_isoformat(quotation.quotation_email_sent_at),
        "admin_comments": quotation.admin_comments,
        "reviewed_by": quotation.reviewed_by,
        "reviewed_at": utc_isoformat(quotation.reviewed_at),
        "created_at": utc_isoformat(quotation.created_at),
        "updated_at": utc_isoformat(quotation.updated_at),
    }


@router.post("/quotations/{quotation_id}/send-email", summary="Send or resend an approved quotation")
async def resend_quotation_email(
    quotation_id: str,
    admin: User = Depends(require_admin),
):
    try:
        quotation = await QuotationRequest.get(PydanticObjectId(quotation_id))
    except (InvalidId, TypeError, ValueError):
        quotation = None
    if not quotation:
        raise HTTPException(status_code=404, detail=f"Quotation #{quotation_id} not found")
    if quotation.status != "Approved":
        raise HTTPException(status_code=409, detail="Only approved quotations can be emailed.")
    try:
        validate_quotation_for_approval(quotation)
        await email_approved_quotation(quotation)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except QuotationEmailDeliveryError as error:
        logger.exception("Quotation email retry failed for quotation %s", quotation_id)
        raise HTTPException(
            status_code=502,
            detail=f"Quotation #{quotation_id} is approved, but email delivery failed again.",
        ) from error

    await ActivityLog(
        user_id=str(admin.id),
        username=admin.username,
        role=admin.role,
        action="RESENT_QUOTATION_EMAIL",
        details=f"Quotation #{quotation_id} email resent",
    ).insert()
    return {
        "id": str(quotation.id),
        "quotation_email_status": quotation.quotation_email_status,
        "quotation_email_sent_at": utc_isoformat(quotation.quotation_email_sent_at),
        "message": f"Quotation #{quotation_id} emailed to {quotation.email}.",
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
            "created_at": utc_isoformat(log.created_at),
        }
        for log in logs
    ]
