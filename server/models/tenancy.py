"""
Tenancy & People Models: Firm, User, Membership, Client, ClientAssignment
"""

import uuid
from typing import List, Optional
from datetime import datetime
from sqlalchemy import (
    String, Text, Boolean, DateTime, ForeignKey, Index, CheckConstraint, UniqueConstraint, LargeBinary, CHAR
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from server.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class Firm(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "firms"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    plan: Mapped[str] = mapped_column(
        String(50),
        default="starter",
        server_default="starter",
        nullable=False,
    )
    settings: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")

    # Relationships
    memberships: Mapped[List["Membership"]] = relationship("Membership", back_populates="firm", cascade="all, delete-orphan")
    clients: Mapped[List["Client"]] = relationship("Client", back_populates="firm", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("plan IN ('free', 'starter', 'pro', 'enterprise')", name="chk_firm_plan"),
    )

class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    external_auth_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    memberships: Mapped[List["Membership"]] = relationship("Membership", back_populates="user", cascade="all, delete-orphan")
    assigned_clients: Mapped[List["ClientAssignment"]] = relationship("ClientAssignment", back_populates="user")

class Membership(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "memberships"

    firm_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(50), default="staff", nullable=False)

    # Relationships
    firm: Mapped["Firm"] = relationship("Firm", back_populates="memberships")
    user: Mapped["User"] = relationship("User", back_populates="memberships")

    __table_args__ = (
        UniqueConstraint("firm_id", "user_id", name="uq_firm_user_membership"),
        CheckConstraint("role IN ('owner', 'ca', 'staff', 'individual')", name="chk_membership_role"),
    )

class Client(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "clients"

    firm_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    client_type: Mapped[str] = mapped_column(String(50), default="salaried", nullable=False)
    
    # Encrypted PAN & Search Index
    pan_encrypted: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    pan_hmac: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    pan_last4: Mapped[str] = mapped_column(CHAR(4), nullable=False)
    
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False, index=True)
    assigned_ca_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    risk_flag: Mapped[str] = mapped_column(String(20), default="low", nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    firm: Mapped["Firm"] = relationship("Firm", back_populates="clients")
    assigned_ca: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_ca_id])
    assignments: Mapped[List["ClientAssignment"]] = relationship("ClientAssignment", back_populates="client", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("client_type IN ('salaried', 'freelancer', 'business')", name="chk_client_type"),
        CheckConstraint("status IN ('draft', 'in_review', 'action_required', 'ready_for_filing', 'filed')", name="chk_client_status"),
        CheckConstraint("risk_flag IN ('low', 'medium', 'high')", name="chk_client_risk_flag"),
        Index("ix_clients_firm_status", "firm_id", "status"),
        Index("ix_clients_firm_pan_hmac", "firm_id", "pan_hmac"),
    )

class ClientAssignment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "client_assignments"

    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(50), default="preparer", nullable=False)

    # Relationships
    client: Mapped["Client"] = relationship("Client", back_populates="assignments")
    user: Mapped["User"] = relationship("User", back_populates="assigned_clients")

    __table_args__ = (
        UniqueConstraint("client_id", "user_id", name="uq_client_user_assignment"),
        CheckConstraint("role IN ('preparer', 'reviewer', 'partner')", name="chk_client_assignment_role"),
    )
