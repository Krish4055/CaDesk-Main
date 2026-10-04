"""
Rules & Knowledge Base Models: RuleSet, KBSource, KBChunk
"""

import uuid
from typing import List, Optional
from datetime import date
from sqlalchemy import (
    String, Text, Integer, Date, ForeignKey, Index, CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from server.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class RuleSet(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "rule_sets"

    financial_year: Mapped[str] = mapped_column(String(10), nullable=False, index=True) # e.g. "2025-26"
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    config: Mapped[dict] = mapped_column(JSONB, nullable=False) # Slabs, standard deductions, 87A rebates
    section_label_map: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="{}")
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)

    __table_args__ = (
        UniqueConstraint("financial_year", "version", name="uq_ruleset_fy_version"),
        CheckConstraint("status IN ('draft', 'active', 'retired')", name="chk_ruleset_status"),
    )

class KBSource(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "kb_sources"

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    jurisdiction: Mapped[str] = mapped_column(String(100), default="India/CBDT", nullable=False)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    version: Mapped[str] = mapped_column(String(50), default="1.0", nullable=False)
    url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    ingested_at: Mapped[date] = mapped_column(Date, nullable=False)

    # Relationships
    chunks: Mapped[List["KBChunk"]] = relationship("KBChunk", back_populates="source", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("source_type IN ('act', 'circular', 'notification', 'case_law')", name="chk_kb_source_type"),
    )

class KBChunk(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "kb_chunks"

    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("kb_sources.id", ondelete="CASCADE"), nullable=False, index=True)
    section_ref: Mapped[str] = mapped_column(String(100), nullable=False, index=True) # e.g. "Sec 115BAC(1A)"
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    qdrant_point_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Relationships
    source: Mapped["KBSource"] = relationship("KBSource", back_populates="chunks")
