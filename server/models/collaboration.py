"""
Collaboration & Alerts: DocumentRequest, DocumentRequestItem, Reminder, DeadlineTemplate, ClientDeadline, Notification
"""

import uuid
from typing import List, Optional
from datetime import datetime, date
from sqlalchemy import (
    String, Text, Boolean, Date, DateTime, ForeignKey, Index, CheckConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from server.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class DocumentRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "document_requests"

    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="sent", nullable=False)

    # Relationships
    items: Mapped[List["DocumentRequestItem"]] = relationship("DocumentRequestItem", back_populates="request", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("status IN ('draft', 'sent', 'partially_fulfilled', 'completed', 'cancelled')", name="chk_doc_req_status"),
    )

class DocumentRequestItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "document_request_items"

    request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("document_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    document_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    due_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    request: Mapped["DocumentRequest"] = relationship("DocumentRequest", back_populates="items")
    reminders: Mapped[List["Reminder"]] = relationship("Reminder", back_populates="item", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'submitted', 'approved', 'rejected')", name="chk_doc_req_item_status"),
    )

class Reminder(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "reminders"

    item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("document_request_items.id", ondelete="CASCADE"), nullable=False, index=True)
    channel: Mapped[str] = mapped_column(String(20), default="email", nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="scheduled", nullable=False)

    # Relationships
    item: Mapped["DocumentRequestItem"] = relationship("DocumentRequestItem", back_populates="reminders")

    __table_args__ = (
        CheckConstraint("channel IN ('email', 'whatsapp', 'sms')", name="chk_reminder_channel"),
        CheckConstraint("status IN ('scheduled', 'sent', 'failed', 'cancelled')", name="chk_reminder_status"),
    )

class DeadlineTemplate(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "deadline_templates"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    applies_to: Mapped[str] = mapped_column(String(50), default="all", nullable=False)
    rule: Mapped[dict] = mapped_column(JSONB, nullable=False)

class ClientDeadline(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "client_deadlines"

    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("deadline_templates.id", ondelete="SET NULL"), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    snoozed_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'completed', 'overdue')", name="chk_deadline_status"),
    )

class Notification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
