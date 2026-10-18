from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime


class SourceBase(BaseModel):
    title: str
    url: str


class SourceResponse(SourceBase):
    id: str

    class Config:
        from_attributes = True


class StoryBlock(BaseModel):
    type: str  # heading, paragraph, image, stat, quote
    text: Optional[str] = None
    url: Optional[str] = None
    caption: Optional[str] = None
    credit: Optional[str] = None
    value: Optional[str] = None
    label: Optional[str] = None


class ReachSettings(BaseModel):
    locations: List[str] = Field(default_factory=lambda: ["National"])
    interests: List[str] = Field(default_factory=list)
    channels: List[str] = Field(default_factory=lambda: ["Social Media", "Display", "Search"])
    duration_days: int = 30


class CampaignBase(BaseModel):
    title: str = Field(..., max_length=60)
    category: str
    creator_name: str
    summary: str
    cover_image_url: Optional[str] = None
    story: List[Dict[str, Any]] = Field(default_factory=list)
    ad_headline: Optional[str] = None
    ad_description: Optional[str] = None
    cta_text: Optional[str] = "Learn More"
    ad_image_url: Optional[str] = None
    reach_settings: Dict[str, Any] = Field(default_factory=dict)
    funding_goal: float = 0.0


class CampaignCreate(CampaignBase):
    sources: List[SourceBase] = Field(default_factory=list)


class CampaignResponse(CampaignBase):
    id: str
    creator_id: Optional[str] = None
    status: str
    amount_raised: float
    funding_goal: float
    percent_funded: float = 0.0
    estimated_reach_mid: int = 0
    estimated_reach_range: str = ""
    deadline: Optional[datetime] = None
    created_at: datetime
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    sources: List[SourceResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class CampaignFeedbackRequest(BaseModel):
    encouraged_to_continue: Optional[str] = None  # "Yes", "Somewhat", "No"
    changed_mind: Optional[str] = None  # "Yes", "Somewhat", "No"
    feedback_text: Optional[str] = None
