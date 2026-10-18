from typing import Tuple
from sqlalchemy.orm import Session
from app.models.campaign import Campaign
from app.models.contribution import Contribution
from app.models.notification import Notification
from app.services.lifecycle import transition_campaign


def simulate_payment(
    db: Session,
    contribution: Contribution,
    card_number: str = "4242",
    action: str = "pay"
) -> Tuple[str, str]:
    """
    Simulates a secure checkout transaction without touching real funds.
    Demonstrates state transitions for: succeeded, pending, failed, cancelled.
    """
    card_clean = card_number.replace(" ", "").replace("-", "")

    if action == "cancel":
        status = "cancelled"
        message = "Contribution checkout was cancelled by the user."
    elif card_clean.endswith("0002"):
        status = "failed"
        message = "Payment simulation failed: Insufficient funds or card declined by issuing bank."
    elif card_clean.endswith("0001"):
        status = "pending"
        message = "Payment authorization is pending bank settlement."
    else:
        status = "succeeded"
        message = "Simulated payment succeeded. Funds allocated to campaign message distribution."

    contribution.status = status

    if status == "succeeded":
        campaign = db.query(Campaign).filter(Campaign.id == contribution.campaign_id).first()
        if campaign:
            campaign.amount_raised = round(campaign.amount_raised + contribution.amount, 2)

            # Check if funding goal has been met
            if campaign.funding_goal > 0 and campaign.amount_raised >= campaign.funding_goal:
                if campaign.status == "available_for_funding":
                    transition_campaign(
                        db=db,
                        campaign=campaign,
                        new_status="goal_reached",
                        actor_id="system",
                        note=f"Funding goal of ${campaign.funding_goal:,.2f} reached! Total raised: ${campaign.amount_raised:,.2f}."
                    )

            # Create notification for creator
            if campaign.creator_id:
                notif = Notification(
                    user_id=campaign.creator_id,
                    type="contribution",
                    title="New Backer Contribution!",
                    body=f"Someone contributed ${contribution.amount:,.2f} toward amplifying '{campaign.title}'.",
                    campaign_id=campaign.id
                )
                db.add(notif)

    db.commit()
    db.refresh(contribution)
    return status, message
