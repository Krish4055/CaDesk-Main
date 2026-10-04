"""
Review Tasks, Working Paper Sign-Offs, and Append-Only Audit Log
"""

import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import (
    String, Text, DateTime, ForeignKey, Index, CheckConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from server.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class ReviewTask(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "review_tasks"

    firm_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False) # finding | field | computation
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False, index=True)
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    due_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("source_type IN ('finding', 'field', 'computation', 'document')", name="chk_review_source_type"),
        CheckConstraint("priority IN ('low', 'medium', 'high', 'urgent')", name="chk_review_priority"),
        CheckConstraint("status IN ('open', 'in_review', 'resolved')", name="chk_review_status"),
        Index("ix_review_tasks_firm_status", "firm_id", "status"),
    )

class Signoff(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Immutable working papers sign-off frozen with SHA-256 snapshot hash"""
    __tablename__ = "signoffs"

    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    financial_year: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    computation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tax_computations.id", ondelete="RESTRICT"), nullable=False)
    signed_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    signed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="approved", nullable=False)
    snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False) # Complete working papers snapshot
    snapshot_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    rule_set_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rule_sets.id"), nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('approved', 'changes_requested')", name="chk_signoff_status"),
    )

class AuditLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    APPEND-ONLY Audit Ledger.
    Protected by DB triggers preventing UPDATE and DELETE.
    Chained by SHA-256 row_hash = hash(prev_hash + row content).
    """
    __tablename__ = "audit_log"

    firm_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    actor_type: Mapped[str] = mapped_column(String(20), nullable=False) # user | agent | system
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    before: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    after: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    prev_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    row_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)

    __table_args__ = (
        CheckConstraint("actor_type IN ('user', 'agent', 'system')", name="chk_audit_actor_type"),
        Index("ix_audit_firm_created", "firm_id", "created_at"),
    )
