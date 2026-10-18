from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime


class ReportResponse(BaseModel):
    id: str
    campaign_id: str
    campaign_title: str
    funds_raised: float
    ad_spend: float
    impressions: int
    clicks: int
    estimated_reach: int
    measured_reach: int
    ctr: float
    cpm: float
    channel_breakdown: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
