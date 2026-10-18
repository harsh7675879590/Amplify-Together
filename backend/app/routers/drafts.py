from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.draft import Draft
from app.models.campaign import Campaign, Source
from app.models.notification import Notification
from app.models.moderation import ModerationLog
from app.schemas.draft import DraftSaveRequest, DraftResponse, AIDraftFromTextRequest
from app.routers.auth import get_optional_current_user
from app.models.user import User

router = APIRouter(prefix="/drafts", tags=["Drafts"])


@router.get("", response_model=DraftResponse)
def get_or_create_draft(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else "guest-creator"
    draft = db.query(Draft).filter(Draft.user_id == user_id).first()

    if not draft:
        draft = Draft(
            user_id=user_id,
            current_step=1,
            data={
                "title": "",
                "category": "Environment",
                "creator_name": current_user.display_name if current_user else "",
                "summary": "",
                "cover_image_url": "",
                "story": [
                    {"type": "heading", "text": "The Challenge We Face"},
                    {"type": "paragraph", "text": ""},
                    {"type": "heading", "text": "Why Amplification Matters"},
                    {"type": "paragraph", "text": ""}
                ],
                "sources": [],
                "ad_headline": "",
                "ad_description": "",
                "cta_text": "Learn More",
                "reach_settings": {
                    "locations": ["National (US)"],
                    "interests": ["Public Interest", "Community Action"],
                    "channels": ["Social Media Feeds", "Independent News Placements"],
                    "duration_days": 30
                },
                "funding_goal": 0.0  # Must be set manually in Step 5
            }
        )
        db.add(draft)
        db.commit()
        db.refresh(draft)

    return draft


@router.put("/{draft_id}", response_model=DraftResponse)
def save_draft(
    draft_id: str,
    req: DraftSaveRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    draft = db.query(Draft).filter(Draft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    draft.current_step = req.current_step
    # Merge existing data with new keys to prevent accidental overwrites
    existing_data = draft.data or {}
    existing_data.update(req.data)
    draft.data = existing_data
    draft.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(draft)
    return draft


@router.post("/{draft_id}/submit")
def submit_draft(
    draft_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    draft = db.query(Draft).filter(Draft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    data = draft.data or {}

    # Validation of required fields
    title = (data.get("title") or "").strip()
    category = (data.get("category") or "").strip()
    creator_name = (data.get("creator_name") or "").strip()
    summary = (data.get("summary") or "").strip()
    funding_goal = float(data.get("funding_goal") or 0.0)

    if not title:
        raise HTTPException(status_code=422, detail="Campaign title is required (Step 1)")
    if len(title) > 60:
        raise HTTPException(status_code=422, detail="Campaign title must not exceed 60 characters")
    if not category:
        raise HTTPException(status_code=422, detail="Category selection is required (Step 1)")
    if not creator_name:
        raise HTTPException(status_code=422, detail="Creator or organization name is required (Step 1)")
    if not summary:
        raise HTTPException(status_code=422, detail="A short campaign summary is required (Step 1)")
    if funding_goal <= 0:
        raise HTTPException(
            status_code=422,
            detail="A funding goal greater than $0 must be entered manually in Step 5 (Submit)."
        )

    # Create new campaign in submitted status
    user_id = current_user.id if current_user else None
    new_campaign = Campaign(
        creator_id=user_id,
        title=title,
        category=category,
        creator_name=creator_name,
        summary=summary,
        cover_image_url=data.get("cover_image_url") or "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80",
        story=data.get("story") or [],
        status="submitted",
        funding_goal=funding_goal,
        amount_raised=0.0,
        ad_headline=data.get("ad_headline") or title,
        ad_description=data.get("ad_description") or summary,
        cta_text=data.get("cta_text") or "Learn More",
        ad_image_url=data.get("ad_image_url") or data.get("cover_image_url"),
        reach_settings=data.get("reach_settings") or {},
        submitted_at=datetime.utcnow()
    )
    db.add(new_campaign)
    db.flush()  # assign id

    # Add sources if present
    sources_data = data.get("sources") or []
    for s in sources_data:
        if s.get("title") and s.get("url"):
            db.add(Source(campaign_id=new_campaign.id, title=s["title"], url=s["url"]))

    # Add moderation log entry
    db.add(ModerationLog(
        campaign_id=new_campaign.id,
        actor_id=user_id or "creator",
        action="submission",
        note=f"Campaign '{title}' submitted for editorial and fact-checking review."
    ))

    # Creator notification
    if user_id:
        db.add(Notification(
            user_id=user_id,
            type="submission",
            title="Campaign Received for Review",
            body=f"'{title}' is now in our editorial review queue. We verify sources and ad copy before opening funding.",
            campaign_id=new_campaign.id
        ))

    # Reset draft for future use
    draft.current_step = 1
    draft.data = {}

    db.commit()

    return {
        "status": "success",
        "campaign_id": new_campaign.id,
        "message": "Campaign submitted for review! Our team will inspect content, sources, and ad visuals.",
        "timeline": [
            {"step": "Submitted", "status": "completed", "desc": "Draft verified and received."},
            {"step": "Content & Fact Review", "status": "active", "desc": "Reviewers check supporting sources and claims."},
            {"step": "Ad Asset Approval", "status": "pending", "desc": "Targeting and creative guidelines confirmed."},
            {"step": "Public Backing Open", "status": "pending", "desc": "Backers pool funds toward ad distribution."},
            {"step": "Ad Amplification Launch", "status": "pending", "desc": "Message promoted beyond your network."}
        ]
    }


@router.post("/ai-assist")
def generate_ai_draft(req: AIDraftFromTextRequest):
    """
    AI or Voice assistant endpoint: extracts structured fields from the creator's voice/text description.
    NOTE: Funding goal is strictly left at 0 so creator enters it in Step 5.
    """
    prompt = req.prompt.strip()
    words = prompt.split()
    first_sentence = prompt.split(".")[0] if "." in prompt else prompt
    suggested_title = (first_sentence[:57] + "...") if len(first_sentence) > 60 else first_sentence

    # Keyword based category detection
    category = "Community"
    lower_prompt = prompt.lower()
    if any(k in lower_prompt for k in ["water", "climate", "forest", "clean", "pollution", "solar", "nature"]):
        category = "Environment"
    elif any(k in lower_prompt for k in ["health", "mental", "hospital", "patient", "medical", "disease"]):
        category = "Health"
    elif any(k in lower_prompt for k in ["school", "education", "student", "teacher", "library", "learning"]):
        category = "Education"
    elif any(k in lower_prompt for k in ["transit", "bus", "road", "council", "policy", "law", "vote", "rights"]):
        category = "Public Policy"
    elif any(k in lower_prompt for k in ["business", "farmer", "repair", "worker", "wage", "economy"]):
        category = "Economic Policy"

    return {
        "title": suggested_title or "Community Amplification Initiative",
        "category": category,
        "summary": prompt[:160] if len(prompt) > 160 else prompt,
        "story": [
            {"type": "heading", "text": "The Message That Needs Reach"},
            {"type": "paragraph", "text": prompt},
            {"type": "heading", "text": "Why Beyond Our Network?"},
            {"type": "paragraph", "text": "Traditional social algorithms keep this message trapped in our existing bubble. With community-funded amplification, we can reach the broader public and decision-makers."},
            {"type": "stat", "value": "120+", "label": "People reached per advertising dollar"}
        ],
        "ad_headline": suggested_title[:30] if len(suggested_title) > 30 else suggested_title,
        "ad_description": prompt[:90],
        "cta_text": "Read the Full Story",
        "reach_settings": {
            "locations": ["National", "Key Metro Areas"],
            "interests": [category, "Civic Engagement"],
            "channels": ["Social Media Feeds", "Independent Digital News"],
            "duration_days": 30
        },
        "funding_goal": 0.0,  # Explicitly 0.0 - Must be entered manually in Step 5
        "notice": "Draft generated from your description. All fields remain fully editable."
    }
