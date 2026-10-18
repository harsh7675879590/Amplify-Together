from datetime import datetime
from typing import Optional, Set
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.models.moderation import ModerationLog
from app.models.notification import Notification

ALLOWED_TRANSITIONS: dict[str, Set[str]] = {
    "draft": {"submitted"},
    "submitted": {"changes_requested", "approved", "rejected"},
    "changes_requested": {"submitted"},
    "approved": {"available_for_funding"},
    "available_for_funding": {"goal_reached", "funding_ended", "cancelled"},
    "goal_reached": {"distribution_prep"},
    "funding_ended": {"distribution_prep", "refund_pending"},
    "distribution_prep": {"promoting", "cancelled"},
    "promoting": {"completed"},
    "cancelled": {"refund_pending"},
}


class InvalidStateTransitionError(HTTPException):
    def __init__(self, current_status: str, requested_status: str):
        super().__init__(
            status_code=409,
            detail=f"Invalid lifecycle transition: '{current_status}' -> '{requested_status}'. Allowed targets: {list(ALLOWED_TRANSITIONS.get(current_status, []))}"
        )


def can_transition(current_status: str, new_status: str) -> bool:
    allowed = ALLOWED_TRANSITIONS.get(current_status, set())
    return new_status in allowed


def transition_campaign(
    db: Session,
    campaign: Campaign,
    new_status: str,
    actor_id: Optional[str] = "admin",
    note: Optional[str] = None
) -> Campaign:
    """
    Enforces campaign lifecycle transitions, logs moderation audit entries,
    and creates relevant notifications for the campaign creator.
    """
    if not can_transition(campaign.status, new_status):
        raise InvalidStateTransitionError(campaign.status, new_status)

    old_status = campaign.status
    campaign.status = new_status

    if new_status == "submitted":
        campaign.submitted_at = datetime.utcnow()
    elif new_status == "approved":
        campaign.approved_at = datetime.utcnow()

    # Log in audit trail
    mod_log = ModerationLog(
        campaign_id=campaign.id,
        actor_id=actor_id,
        action=f"transition:{old_status}->{new_status}",
        note=note or f"Status changed from {old_status} to {new_status}"
    )
    db.add(mod_log)

    # Trigger creator notification
    notification_titles = {
        "submitted": "Campaign Submitted for Review",
        "approved": "Campaign Approved!",
        "changes_requested": "Editorial Feedback: Changes Requested",
        "rejected": "Campaign Review Outcome: Ineligible",
        "available_for_funding": "Campaign is Live for Backing!",
        "goal_reached": "Funding Goal Reached! Next: Distribution Preparation",
        "distribution_prep": "Message Amplification Being Prepared",
        "promoting": "Ad Distribution Live: Reaching New Audiences",
        "completed": "Campaign Amplification Complete! Report Ready",
    }

    if new_status in notification_titles and campaign.creator_id:
        notif = Notification(
            user_id=campaign.creator_id,
            type=new_status,
            title=notification_titles[new_status],
            body=note or f"Your campaign '{campaign.title}' is now {new_status.replace('_', ' ')}.",
            campaign_id=campaign.id
        )
        db.add(notif)

    db.commit()
    db.refresh(campaign)
    return campaign
