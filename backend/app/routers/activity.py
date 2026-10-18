from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationResponse
from app.routers.auth import get_optional_current_user

router = APIRouter(prefix="/activity", tags=["Activity & Notifications"])


@router.get("", response_model=List[NotificationResponse])
def get_activity_feed(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if current_user:
        query = query.filter(
            (Notification.user_id == current_user.id) | (Notification.user_id.is_(None))
        )
    else:
        # Show public platform milestone updates
        query = query.filter(Notification.user_id.is_(None))

    notifications = query.order_by(desc(Notification.created_at)).limit(50).all()
    return notifications


@router.post("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"status": "success", "message": "Notification marked as read"}


@router.post("/read-all")
def mark_all_notifications_read(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    if current_user:
        db.query(Notification).filter(Notification.user_id == current_user.id).update({"is_read": True})
    else:
        db.query(Notification).filter(Notification.user_id.is_(None)).update({"is_read": True})
    db.commit()
    return {"status": "success", "message": "All notifications marked as read"}
