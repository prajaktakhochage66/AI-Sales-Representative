"""
schemas.py — Pydantic request/response validation models.
"""

from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_serializer
from beanie import PydanticObjectId
from app.models import utc_isoformat

# ── Auth ──────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "TECHNICAL"

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    class Config:
        from_attributes = True


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'model'")
    content: str = Field(..., description="Message text")


class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Unique session identifier from the frontend")
    message: str = Field(..., min_length=1, max_length=4000, description="User's message")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Previous messages in this session")


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    ai_available: bool


# ── Products ──────────────────────────────────────────────────────────────────

class Product(BaseModel):
    id: str
    name: str
    nozzle_type: str
    frequency_khz: float
    droplet_size_um: float
    flow_rate_ml_min: str
    max_viscosity_cp: int
    applications: List[str]
    description: str
    category: str


# ── Quotation ─────────────────────────────────────────────────────────────────

class QuotationCreate(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=200)
    company: Optional[str] = Field(None, max_length=200)
    email: str = Field(...)
    phone: Optional[str] = Field(None, max_length=50)
    application: Optional[str] = Field(None, max_length=500)
    liquid_type: Optional[str] = Field(None, max_length=300)
    viscosity_cp: Optional[float] = Field(None, ge=0)
    flow_rate_ml_min: Optional[float] = Field(None, ge=0)
    droplet_size_um: Optional[float] = Field(None, ge=0)
    frequency_khz: Optional[float] = Field(None, ge=0)
    additional_requirements: Optional[str] = None
    recommended_product: Optional[str] = Field(None, max_length=300)
    notes: Optional[str] = None
    quantity: int = Field(default=1, ge=1, le=1000000)


class FollowUpCreate(BaseModel):
    quotation_id: str
    action_taken: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    status: str = "Scheduled"


class FollowUpResponse(BaseModel):
    id: PydanticObjectId
    quotation_id: str
    action_taken: Optional[str]
    notes: Optional[str]
    follow_up_date: Optional[datetime]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

    @field_serializer("follow_up_date", "created_at")
    def serialize_timestamps(self, value: Optional[datetime]) -> Optional[str]:
        return utc_isoformat(value)


class QuotationResponse(BaseModel):
    id: PydanticObjectId
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
    estimated_price: Optional[float] = None
    quantity: int = 1
    quotation_product: Optional[str] = None
    unit_price: Optional[float] = None
    quotation_subtotal: Optional[float] = None
    tax_rate_percent: Optional[float] = None
    tax_amount: Optional[float] = None
    shipping_charge: Optional[float] = None
    customization_charge: Optional[float] = None
    quotation_total: Optional[float] = None
    currency: str = "INR"
    validity_days: Optional[int] = None
    payment_terms: Optional[str] = None
    quotation_issued_at: Optional[datetime] = None
    quotation_valid_until: Optional[date] = None
    quotation_email_status: Optional[str] = None
    quotation_email_sent_at: Optional[datetime] = None
    admin_comments: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    follow_ups: List[FollowUpResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

    @field_serializer("reviewed_at", "created_at", "quotation_issued_at", "quotation_email_sent_at")
    def serialize_timestamps(self, value: Optional[datetime]) -> Optional[str]:
        return utc_isoformat(value)


# ── Recommendation ────────────────────────────────────────────────────────────

class RecommendationRequest(BaseModel):
    application: Optional[str] = None
    viscosity_cp: Optional[float] = None
    flow_rate_ml_min: Optional[float] = None
    droplet_size_um: Optional[float] = None
    frequency_khz: Optional[float] = None


class RecommendationResponse(BaseModel):
    products: List[Product]
    explanation: str
