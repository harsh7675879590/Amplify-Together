from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.campaign import Campaign
from app.models.contribution import Contribution
from app.models.user import User
from app.schemas.contribution import (
    ContributionQuoteRequest,
    ContributionQuoteResponse,
    ContributionCreateRequest,
    ContributionResponse
)
from app.services.fees import calculate_fees
from app.services.reach import estimate_reach
from app.services.payments import simulate_payment
from app.routers.auth import get_optional_current_user, get_current_user

router = APIRouter(tags=["Contributions"])


@router.post("/campaigns/{campaign_id}/quote", response_model=ContributionQuoteResponse)
def get_contribution_quote(
    campaign_id: str,
    req: ContributionQuoteRequest,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    fees = calculate_fees(req.amount)
    reach = estimate_reach(fees["available_for_ads"])

    return ContributionQuoteResponse(
        amount=fees["amount"],
        platform_fee=fees["platform_fee"],
        platform_fee_percent=fees["platform_fee_percent"],
        processing_fee=fees["processing_fee"],
        processing_fee_formula=fees["processing_fee_formula"],
        total_charged=fees["total_charged"],
        available_for_ads=fees["available_for_ads"],
        reach_estimate=reach,
        disclaimer=fees["disclaimer"]
    )


@router.post("/campaigns/{campaign_id}/contribute", response_model=ContributionResponse)
def create_and_pay_contribution(
    campaign_id: str,
    req: ContributionCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Contributions are only accepted when campaign is actively available for funding
    if campaign.status != "available_for_funding":
        raise HTTPException(
            status_code=409,
            detail=f"This campaign is currently in '{campaign.status}' state and is not accepting contributions."
        )

    fees = calculate_fees(req.amount)
    reach = estimate_reach(fees["available_for_ads"])

    user_id = current_user.id if current_user else None
    display_name = req.display_name if req.is_public else (current_user.display_name if (current_user and req.is_public) else "Anonymous Backer")

    contribution = Contribution(
        campaign_id=campaign.id,
        user_id=user_id,
        guest_email=req.guest_email if not user_id else None,
        amount=fees["amount"],
        platform_fee=fees["platform_fee"],
        processing_fee=fees["processing_fee"],
        total=fees["total_charged"],
        status="pending",
        is_public=req.is_public,
        display_name=display_name,
        reach_estimate_mid=reach["mid"]
    )
    db.add(contribution)
    db.commit()
    db.refresh(contribution)

    # Process simulated checkout
    status, message = simulate_payment(
        db=db,
        contribution=contribution,
        card_number=req.card_number,
        action=req.action
    )

    return ContributionResponse(
        id=contribution.id,
        campaign_id=campaign.id,
        campaign_title=campaign.title,
        amount=contribution.amount,
        platform_fee=contribution.platform_fee,
        processing_fee=contribution.processing_fee,
        total=contribution.total,
        status=contribution.status,
        is_public=contribution.is_public,
        display_name=contribution.display_name,
        reach_estimate_mid=contribution.reach_estimate_mid,
        created_at=contribution.created_at,
        message=message
    )


@router.get("/contributions/{contribution_id}", response_model=ContributionResponse)
def get_contribution_receipt(
    contribution_id: str,
    db: Session = Depends(get_db)
):
    contrib = db.query(Contribution).filter(Contribution.id == contribution_id).first()
    if not contrib:
        raise HTTPException(status_code=404, detail="Contribution not found")

    campaign_title = contrib.campaign.title if contrib.campaign else "Unknown Campaign"

    return ContributionResponse(
        id=contrib.id,
        campaign_id=contrib.campaign_id,
        campaign_title=campaign_title,
        amount=contrib.amount,
        platform_fee=contrib.platform_fee,
        processing_fee=contrib.processing_fee,
        total=contrib.total,
        status=contrib.status,
        is_public=contrib.is_public,
        display_name=contrib.display_name,
        reach_estimate_mid=contrib.reach_estimate_mid,
        created_at=contrib.created_at,
        message=f"Transaction {contrib.status.upper()}"
    )


@router.get("/me/contributions", response_model=List[ContributionResponse])
def get_my_contributions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contribs = db.query(Contribution)\
        .filter(Contribution.user_id == current_user.id)\
        .order_by(desc(Contribution.created_at))\
        .all()

    return [
        ContributionResponse(
            id=c.id,
            campaign_id=c.campaign_id,
            campaign_title=c.campaign.title if c.campaign else "",
            amount=c.amount,
            platform_fee=c.platform_fee,
            processing_fee=c.processing_fee,
            total=c.total,
            status=c.status,
            is_public=c.is_public,
            display_name=c.display_name,
            reach_estimate_mid=c.reach_estimate_mid,
            created_at=c.created_at
        )
        for c in contribs
    ]
