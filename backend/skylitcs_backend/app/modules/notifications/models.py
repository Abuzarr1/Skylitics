import uuid
import enum
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base


class NotificationType(str, enum.Enum):
    DELAY_ALERT   = "DELAY_ALERT"
    AT_RISK       = "AT_RISK"
    WEATHER_IMPACT = "WEATHER_IMPACT"
    GATE_CHANGE   = "GATE_CHANGE"
    SYSTEM        = "SYSTEM"


class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type       = Column(Enum(NotificationType), nullable=False, default=NotificationType.SYSTEM)
    title      = Column(String, nullable=False)
    body       = Column(Text, nullable=False)
    callsign   = Column(String, nullable=True)   # linked flight, if any
    is_read    = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id             = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    push_enabled        = Column(Boolean, default=True,  nullable=False)
    email_enabled       = Column(Boolean, default=False, nullable=False)
    delay_threshold_pct = Column(String, default="50",   nullable=False)  # min probability % to alert
    quiet_hours_start   = Column(String, default="23:00", nullable=False)
    quiet_hours_end     = Column(String, default="07:00", nullable=False)

    user = relationship("User")
