"""
Tax Work & Grounding Models: FinancialProfile, TaxComputation, Finding, Citation
"""

import uuid
from typing import List, Optional
from datetime import date
from decimal import Decimal
from sqlalchemy import (
    String, Text, Integer, Numeric, Boolean, Date, ForeignKey, Index, CheckConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from server.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class FinancialProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Immutable aggregate profile rebuilt per document run"""
    __tablename__ = "financial_profiles"

    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    financial_year: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    conflicts: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    built_from_run_ids: Mapped[list] = mapped_column(JSONB, default=list, server_default="[]")

class TaxComputation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Deterministic mathematical calculation outputs with input_hash"""
    __tablename__ = "tax_computations"

    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    financial_year: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    rule_set_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("rule_sets.id"), nullable=False, index=True)
    engine_version: Mapped[str] = mapped_column(String(50), default="2025.1", nullable=False)
    inputs: Mapped[dict] = mapped_column(JSONB, nullable=False)
    new_regime: Mapped[dict] = mapped_column(JSONB, nullable=False)
    old_regime: Mapped[dict] = mapped_column(JSONB, nullable=False)
    better_regime: Mapped[str] = mapped_column(String(10), nullable=False)
    savings: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0.00, nullable=False)
    input_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    findings: Mapped[List["Finding"]] = relationship("Finding", back_populates="computation", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("better_regime IN ('old', 'new', 'equal')", name="chk_better_regime"),
        Index("ix_tax_computations_client_fy", "client_id", "financial_year"),
        Index("ix_tax_computations_hash_ruleset", "input_hash", "rule_set_id"),
    )

class Finding(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "findings"

    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    computation_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("tax_computations.id", ondelete="CASCADE"), nullable=True, index=True)
    finding_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    detail: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_saving: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0.00, nullable=False)
    confidence: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    requires_human_review: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)
    created_by_agent: Mapped[str] = mapped_column(String(100), default="Compliance Agent", nullable=False)

    # Relationships
    computation: Mapped[Optional["TaxComputation"]] = relationship("TaxComputation", back_populates="findings")
    citations: Mapped[List["Citation"]] = relationship("Citation", back_populates="finding", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("status IN ('open', 'accepted', 'dismissed')", name="chk_finding_status"),
    )

class Citation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "citations"

    finding_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("findings.id", ondelete="CASCADE"), nullable=True, index=True)
    message_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    kb_chunk_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("kb_chunks.id", ondelete="SET NULL"), nullable=True, index=True)
    rule_set_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("rule_sets.id", ondelete="SET NULL"), nullable=True, index=True)
    section_ref: Mapped[str] = mapped_column(String(100), nullable=False)
    as_of_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Relationships
    finding: Mapped[Optional["Finding"]] = relationship("Finding", back_populates="citations")
