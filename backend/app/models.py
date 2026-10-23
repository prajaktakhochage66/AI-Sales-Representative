from datetime import date, datetime, timezone
from typing import Optional

from beanie import Document, Indexed
from pydantic import Field


QUOTATION_STATUSES = ("Pending", "In Review", "Quoted", "Approved", "Rejected", "Closed")


def utc_isoformat(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def normalize_quotation_status(status: str) -> str:
    normalized_status = status.strip().casefold()
    return next(
        (known_status for known_status in QUOTATION_STATUSES if known_status.casefold() == normalized_status),
        status,
    )


class QuotationRequest(Document):
    customer_name: str = Field(...)
    company: Optional[str] = None
    email: str = Field(...)
    phone: Optional[str] = None
    application: Optional[str] = None
    liquid_type: Optional[str] = None
    viscosity_cp: Optional[float] = None
    flow_rate_ml_min: Optional[float] = None
    droplet_size_um: Optional[float] = None
    frequency_khz: Optional[float] = None
    additional_requirements: Optional[str] = None
    recommended_product: Optional[str] = None
    notes: Optional[str] = None
    status: str = Field(default="Pending")
    user_id: Optional[str] = None  # reference to User.id
    estimated_price: Optional[float] = None
    quantity: int = Field(default=1, ge=1)
    quotation_product: Optional[str] = None
    unit_price: Optional[float] = None
    quotation_subtotal: Optional[float] = None
    tax_rate_percent: Optional[float] = None
    tax_amount: Optional[float] = None
    shipping_charge: Optional[float] = None
    customization_charge: Optional[float] = None
    quotation_total: Optional[float] = None
    currency: str = Field(default="INR")
    validity_days: Optional[int] = None
    payment_terms: Optional[str] = None
    quotation_issued_at: Optional[datetime] = None
    quotation_valid_until: Optional[date] = None
    quotation_email_status: Optional[str] = None
    quotation_email_sent_at: Optional[datetime] = None
    technical_status: Optional[str] = None
    technical_comments: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    assigned_technical_id: Optional[int] = None
    admin_comments: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "quotation_requests"


class FollowUp(Document):
    quotation_id: Indexed(str)
    action_taken: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    status: str = Field(default="Scheduled")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "follow_ups"


class ChatSession(Document):
    session_id: str = Field(...)
    role: str = Field(..., description="'user' or 'model'")
    content: str = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "chat_sessions"


class User(Document):
    username: str = Field(..., unique=True)
    password_hash: str = Field(...)
    role: str = Field(...)  # "USER" or "ADMIN"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"


class ActivityLog(Document):
    """Tracks all user and admin activities in the system."""
    user_id: str = Field(...)
    username: str = Field(...)
    role: str = Field(...)
    action: str = Field(...)  # e.g. "LOGIN", "REGISTER", "APPROVE_QUOTATION", "REJECT_QUOTATION"
    details: Optional[str] = None  # e.g. quotation ID, extra info
    ip_address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "activity_logs"
