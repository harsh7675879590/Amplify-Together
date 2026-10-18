from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.campaign import Campaign
from app.models.moderation import ModerationLog
from app.schemas.campaign import CampaignResponse
from app.routers.campaigns import serialize_campaign
from app.services.lifecycle import transition_campaign

router = APIRouter(prefix="/admin", tags=["Reviewer & Admin (Demo)"])


@router.get("/review-queue", response_model=List[CampaignResponse])
def get_review_queue(db: Session = Depends(get_db)):
    """Returns all campaigns currently awaiting editorial/fact-checking review."""
    campaigns = db.query(Campaign)\
        .filter(Campaign.status.in_(["submitted", "changes_requested", "distribution_prep"]))\
        .order_by(desc(Campaign.submitted_at))\
        .all()
    return [serialize_campaign(c) for c in campaigns]


@router.post("/campaigns/{campaign_id}/approve")
def approve_campaign(
    campaign_id: str,
    note: Optional[str] = Body(None),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Step 1: Transition to approved
    transition_campaign(
        db=db,
        campaign=campaign,
        new_status="approved",
        actor_id="reviewer",
        note=note or "Content, supporting sources, and advertising assets verified and approved."
    )

    # Step 2: Open for funding
    transition_campaign(
        db=db,
        campaign=campaign,
        new_status="available_for_funding",
        actor_id="reviewer",
        note="Campaign opened for community backing and distribution pooling."
    )

    return {"status": "success", "campaign_status": campaign.status, "message": "Campaign approved and opened for funding!"}


@router.post("/campaigns/{campaign_id}/request-changes")
def request_changes(
    campaign_id: str,
    note: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    transition_campaign(
        db=db,
        campaign=campaign,
        new_status="changes_requested",
        actor_id="reviewer",
        note=note
    )
    return {"status": "success", "campaign_status": campaign.status, "message": "Changes requested from creator."}


@router.post("/campaigns/{campaign_id}/start-promotion")
def start_promotion(
    campaign_id: str,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    transition_campaign(
        db=db,
        campaign=campaign,
        new_status="promoting",
        actor_id="reviewer",
        note="Approved ad creatives launched across target channels and audiences."
    )
    return {"status": "success", "campaign_status": campaign.status, "message": "Campaign promotion is now live!"}


@router.post("/campaigns/{campaign_id}/complete")
def complete_campaign(
    campaign_id: str,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    transition_campaign(
        db=db,
        campaign=campaign,
        new_status="completed",
        actor_id="reviewer",
        note="Campaign distribution completed. Performance metrics and report generated."
    )
    return {"status": "success", "campaign_status": campaign.status, "message": "Campaign marked completed."}


@router.post("/demo/advance/{campaign_id}")
def advance_campaign_stage(
    campaign_id: str,
    db: Session = Depends(get_db)
):
    """
    Convenient one-tap demo advancement helper for live judging:
    Moves a campaign to its next logical lifecycle state.
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    current = campaign.status
    if current == "draft":
        transition_campaign(db, campaign, "submitted", note="Submitted in demo walkthrough")
    elif current == "submitted":
        transition_campaign(db, campaign, "approved", note="Approved by reviewer")
        transition_campaign(db, campaign, "available_for_funding", note="Opened for funding")
    elif current == "available_for_funding":
        # Simulate meeting the goal
        campaign.amount_raised = campaign.funding_goal
        transition_campaign(db, campaign, "goal_reached", note="Goal met via demo")
        transition_campaign(db, campaign, "distribution_prep", note="Prepared for ad distribution")
    elif current == "distribution_prep":
        transition_campaign(db, campaign, "promoting", note="Ad delivery launched")
    elif current == "promoting":
        transition_campaign(db, campaign, "completed", note="Campaign completed successfully")
    else:
        return {"status": "unchanged", "campaign_status": current, "message": f"Campaign is in terminal state '{current}'"}

    return {"status": "success", "old_status": current, "new_status": campaign.status}
