import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Contribution(Base):
    __tablename__ = "contributions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    guest_email = Column(String, nullable=True)

    amount = Column(Float, nullable=False)
    platform_fee = Column(Float, nullable=False, default=0.0)
    processing_fee = Column(Float, nullable=False, default=0.0)
    total = Column(Float, nullable=False)

    # Status: pending, succeeded, failed, cancelled, refunded
    status = Column(String, default="pending", index=True)

    # Privacy by default:
    is_public = Column(Boolean, default=False)
    display_name = Column(String, nullable=True)

    reach_estimate_mid = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="contributions")
