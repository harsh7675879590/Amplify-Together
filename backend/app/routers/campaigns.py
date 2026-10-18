from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.database import get_db
from app.models.campaign import Campaign, Source
from app.schemas.campaign import CampaignResponse, CampaignFeedbackRequest
from app.services.reach import estimate_reach

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


def serialize_campaign(campaign: Campaign) -> dict:
    percent_funded = round((campaign.amount_raised / campaign.funding_goal * 100), 1) if campaign.funding_goal > 0 else 0.0
    # Available ad dollars from raised amount (minus 5% platform fee)
    ad_dollars = campaign.amount_raised * 0.95
    reach = estimate_reach(ad_dollars)

    return {
        "id": campaign.id,
        "creator_id": campaign.creator_id,
        "title": campaign.title,
        "category": campaign.category,
        "creator_name": campaign.creator_name,
        "summary": campaign.summary,
        "cover_image_url": campaign.cover_image_url,
        "story": campaign.story or [],
        "status": campaign.status,
        "funding_goal": campaign.funding_goal,
        "amount_raised": campaign.amount_raised,
        "percent_funded": min(percent_funded, 1000.0),
        "estimated_reach_mid": reach["mid"],
        "estimated_reach_range": reach["formatted_range"],
        "deadline": campaign.deadline,
        "ad_headline": campaign.ad_headline or campaign.title,
        "ad_description": campaign.ad_description or campaign.summary,
        "cta_text": campaign.cta_text or "Learn More",
        "ad_image_url": campaign.ad_image_url or campaign.cover_image_url,
        "reach_settings": campaign.reach_settings or {},
        "created_at": campaign.created_at,
        "submitted_at": campaign.submitted_at,
        "approved_at": campaign.approved_at,
        "sources": [
            {"id": s.id, "title": s.title, "url": s.url}
            for s in (campaign.sources or [])
        ]
    }


@router.get("", response_model=List[CampaignResponse])
def list_campaigns(
    search: Optional[str] = Query(None, description="Search keyword in title, summary, or creator"),
    category: Optional[str] = Query(None, description="Filter by category"),
    sort: Optional[str] = Query("trending", description="Sort order: trending, funded, recent, ending_soon"),
    status: Optional[str] = Query(None, description="Optional status filter"),
    db: Session = Depends(get_db)
):
    query = db.query(Campaign)

    if status:
        query = query.filter(Campaign.status == status)
    else:
        # By default in explore/home, show public campaigns: available_for_funding, goal_reached, promoting, completed
        query = query.filter(Campaign.status.in_(["available_for_funding", "goal_reached", "promoting", "completed"]))

    if category and category.lower() != "all":
        query = query.filter(Campaign.category.ilike(f"%{category}%"))

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Campaign.title.ilike(search_pattern),
                Campaign.summary.ilike(search_pattern),
                Campaign.creator_name.ilike(search_pattern)
            )
        )

    if sort == "funded":
        query = query.order_by(desc(Campaign.amount_raised))
    elif sort == "recent":
        query = query.order_by(desc(Campaign.created_at))
    elif sort == "ending_soon":
        query = query.order_by(asc(Campaign.deadline))
    else:  # trending default
        query = query.order_by(desc(Campaign.amount_raised), desc(Campaign.created_at))

    campaigns = query.all()
    return [serialize_campaign(c) for c in campaigns]


@router.get("/featured", response_model=List[CampaignResponse])
def get_featured_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(Campaign)\
        .filter(Campaign.status.in_(["available_for_funding", "promoting"]))\
        .order_by(desc(Campaign.amount_raised))\
        .limit(5)\
        .all()
    return [serialize_campaign(c) for c in campaigns]


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign_detail(campaign_id: str, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return serialize_campaign(campaign)


@router.post("/{campaign_id}/feedback")
def submit_campaign_feedback(
    campaign_id: str,
    feedback: CampaignFeedbackRequest,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    return {
        "status": "success",
        "message": "Thank you for your feedback! Your reaction helps measure message impact and audience persuasion."
    }
