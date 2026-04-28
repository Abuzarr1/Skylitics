from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete
from pydantic import BaseModel
from typing import Any, List, Optional
import uuid

from app.db.session import get_db
from app.modules.notifications.models import Notification, NotificationPreference, NotificationType
from app.modules.auth.router import get_current_user
from app.modules.users.models import User

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: str
    type: str
    title: str
    body: str
    callsign: Optional[str]
    is_read: bool
    created_at: str


class PreferencesIn(BaseModel):
    push_enabled: bool = True
    email_enabled: bool = False
    delay_threshold_pct: str = "50"
    quiet_hours_start: str = "23:00"
    quiet_hours_end: str = "07:00"


class PreferencesOut(PreferencesIn):
    pass


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fmt(n: Notification) -> NotificationOut:
    return NotificationOut(
        id=str(n.id),
        type=n.type.value,
        title=n.title,
        body=n.body,
        callsign=n.callsign,
        is_read=n.is_read,
        created_at=n.created_at.isoformat() if n.created_at else "",
    )


async def _get_or_create_prefs(user_id: uuid.UUID, db: AsyncSession) -> NotificationPreference:
    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == user_id)
    )
    prefs = result.scalars().first()
    if not prefs:
        prefs = NotificationPreference(user_id=user_id)
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)
    return prefs


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[NotificationOut])
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Return all notifications for the authenticated user, newest first."""
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    return [_fmt(n) for n in result.scalars().all()]


@router.get("/unread-count")
async def unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Returns the unread notification count — used by the bell badge."""
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
    )
    count = len(result.scalars().all())
    return {"unread": count}


@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Mark a single notification as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notif = result.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return _fmt(notif)


@router.post("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Mark all notifications as read for the current user."""
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Delete a single notification."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notif = result.scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    await db.delete(notif)
    await db.commit()
    return {"message": "Notification deleted"}


@router.get("/preferences", response_model=PreferencesOut)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    prefs = await _get_or_create_prefs(current_user.id, db)
    return PreferencesOut(
        push_enabled=prefs.push_enabled,
        email_enabled=prefs.email_enabled,
        delay_threshold_pct=prefs.delay_threshold_pct,
        quiet_hours_start=prefs.quiet_hours_start,
        quiet_hours_end=prefs.quiet_hours_end,
    )


@router.put("/preferences", response_model=PreferencesOut)
async def update_preferences(
    prefs_in: PreferencesIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    prefs = await _get_or_create_prefs(current_user.id, db)
    prefs.push_enabled        = prefs_in.push_enabled
    prefs.email_enabled       = prefs_in.email_enabled
    prefs.delay_threshold_pct = prefs_in.delay_threshold_pct
    prefs.quiet_hours_start   = prefs_in.quiet_hours_start
    prefs.quiet_hours_end     = prefs_in.quiet_hours_end
    await db.commit()
    await db.refresh(prefs)
    return PreferencesOut(
        push_enabled=prefs.push_enabled,
        email_enabled=prefs.email_enabled,
        delay_threshold_pct=prefs.delay_threshold_pct,
        quiet_hours_start=prefs.quiet_hours_start,
        quiet_hours_end=prefs.quiet_hours_end,
    )
