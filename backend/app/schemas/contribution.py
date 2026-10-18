from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from datetime import datetime


class ContributionQuoteRequest(BaseModel):
    amount: float = Field(..., gt=0)


class ContributionQuoteResponse(BaseModel):
    amount: float
    platform_fee: float
    platform_fee_percent: str
    processing_fee: float
    processing_fee_formula: str
    total_charged: float
    available_for_ads: float
    reach_estimate: Dict[str, Any]
    disclaimer: str


class ContributionCreateRequest(BaseModel):
    amount: float = Field(..., gt=0)
    guest_email: Optional[EmailStr] = None
    is_public: bool = False
    display_name: Optional[str] = None
    card_number: str = "4242"
    action: str = "pay"  # "pay" or "cancel"


class ContributionResponse(BaseModel):
    id: str
    campaign_id: str
    campaign_title: Optional[str] = None
    amount: float
    platform_fee: float
    processing_fee: float
    total: float
    status: str
    is_public: bool
    display_name: Optional[str] = None
    reach_estimate_mid: int
    created_at: datetime
    message: Optional[str] = None

    class Config:
        from_attributes = True
