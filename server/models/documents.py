"""
Document Storage, Pipeline & Extraction Models: Document, ExtractionRun, ExtractedField, FieldEdit
"""

import uuid
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    String, Text, Integer, Numeric, Boolean, DateTime, ForeignKey, Index, CheckConstraint, UniqueConstraint, Float
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from server.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class Document(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "documents"

    firm_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    financial_year: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    doc_type: Mapped[str] = mapped_column(String(50), nullable=False)
    storage_key: Mapped[str] = mapped_column(Text, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="uploaded", nullable=False, index=True)
    page_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    uploaded_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    extraction_runs: Mapped[List["ExtractionRun"]] = relationship("ExtractionRun", back_populates="document", cascade="all, delete-orphan")
    fields: Mapped[List["ExtractedField"]] = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("firm_id", "sha256", name="uq_firm_document_sha256"),
        CheckConstraint("status IN ('uploaded', 'ocr', 'classified', 'extracted', 'needs_review', 'verified', 'failed')", name="chk_document_status"),
        Index("ix_documents_firm_client", "firm_id", "client_id"),
    )

class ExtractionRun(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "extraction_runs"

    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    engine: Mapped[str] = mapped_column(String(100), default="rednote-hilab/dots.ocr", nullable=False)
    engine_version: Mapped[str] = mapped_column(String(50), default="1.7B", nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    latency_ms: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    overall_confidence: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="completed", nullable=False)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="extraction_runs")
    fields: Mapped[List["ExtractedField"]] = relationship("ExtractedField", back_populates="run", cascade="all, delete-orphan")

class ExtractedField(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "extracted_fields"

    run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("extraction_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    field_key: Mapped[str] = mapped_column(String(100), nullable=False, index=True) # e.g. "gross_salary"
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    value_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    value_numeric: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    confidence: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    needs_review: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    bbox: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    source_snippet: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    confirmed_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="fields")
    run: Mapped["ExtractionRun"] = relationship("ExtractionRun", back_populates="fields")
    edits: Mapped[List["FieldEdit"]] = relationship("FieldEdit", back_populates="field", cascade="all, delete-orphan")

class FieldEdit(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "field_edits"

    field_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("extracted_fields.id", ondelete="CASCADE"), nullable=False, index=True)
    old_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    edited_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    edited_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    field: Mapped["ExtractedField"] = relationship("ExtractedField", back_populates="edits")
