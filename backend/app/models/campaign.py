import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = Column(String, ForeignKey("users.id"), nullable=True)
    title = Column(String(60), nullable=False)
    category = Column(String, nullable=False)
    creator_name = Column(String, nullable=False)
    summary = Column(String, nullable=False)
    cover_image_url = Column(String, nullable=True)

    # Story is stored as an ordered list of JSON blocks:
    # [{"type": "heading", "text": "..."}, {"type": "paragraph", "text": "..."}, {"type": "image", ...}, {"type": "stat", ...}]
    story = Column(JSON, default=list)

    # Lifecycle status:
    # draft -> submitted -> changes_requested / approved -> available_for_funding
    # -> goal_reached / funding_ended -> distribution_prep -> promoting -> completed / cancelled
    status = Column(String, default="draft", index=True)

    funding_goal = Column(Float, nullable=False, default=0.0)
    amount_raised = Column(Float, nullable=False, default=0.0)
    deadline = Column(DateTime, nullable=True)

    # Ad visuals & assets
    ad_headline = Column(String, nullable=True)
    ad_description = Column(String, nullable=True)
    cta_text = Column(String, default="Learn More")
    ad_image_url = Column(String, nullable=True)

    # Reach & targeting settings JSON:
    # {"locations": ["US-National"], "interests": ["Environment"], "channels": ["Social", "Search"], "duration_days": 30}
    reach_settings = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)

    # Relationships
    sources = relationship("Source", back_populates="campaign", cascade="all, delete-orphan")
    contributions = relationship("Contribution", back_populates="campaign", cascade="all, delete-orphan")
    updates = relationship("CampaignUpdate", back_populates="campaign", cascade="all, delete-orphan")
    report = relationship("Report", back_populates="campaign", uselist=False, cascade="all, delete-orphan")


class Source(Base):
    __tablename__ = "sources"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False)
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)

    campaign = relationship("Campaign", back_populates="sources")


class CampaignUpdate(Base):
    __tablename__ = "campaign_updates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False)
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="updates")
