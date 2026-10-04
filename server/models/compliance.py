"""
Privacy & DPDP Compliance: Consent, DataRequest
"""

import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import (
    String, Text, DateTime, ForeignKey, Index, CheckConstraint
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from server.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class Consent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "consents"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    purpose: Mapped[str] = mapped_column(String(255), nullable=False)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    withdrawn_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    version_text: Mapped[str] = mapped_column(Text, nullable=False)

class DataRequest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """DPDP Act 2023 Portability & Right to Erasure Requests"""
    __tablename__ = "data_requests"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    request_type: Mapped[str] = mapped_column(String(20), nullable=False) # export | delete
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("request_type IN ('export', 'delete')", name="chk_data_request_type"),
        CheckConstraint("status IN ('pending', 'in_progress', 'completed', 'rejected')", name="chk_data_request_status"),
    )
