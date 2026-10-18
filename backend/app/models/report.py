import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False, unique=True)

    funds_raised = Column(Float, nullable=False)
    ad_spend = Column(Float, nullable=False)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    estimated_reach = Column(Integer, default=0)
    measured_reach = Column(Integer, default=0)
    ctr = Column(Float, default=0.0)
    cpm = Column(Float, default=0.0)
    channel_breakdown = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="report")
