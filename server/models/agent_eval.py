"""
Agent Telemetry & Quality Evaluation Models: AgentThread, AgentMessage, AgentRun, AgentStep, EvalCase, EvalRun, EvalResult
"""

import uuid
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    String, Text, Integer, Numeric, Boolean, Float, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from server.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class AgentThread(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "agent_threads"

    firm_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("firms.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    messages: Mapped[List["AgentMessage"]] = relationship("AgentMessage", back_populates="thread", cascade="all, delete-orphan")

class AgentMessage(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "agent_messages"

    thread_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("agent_threads.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False) # user | assistant | system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    flagged_for_review: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    thread: Mapped["AgentThread"] = relationship("AgentThread", back_populates="messages")
    runs: Mapped[List["AgentRun"]] = relationship("AgentRun", back_populates="message", cascade="all, delete-orphan")

class AgentRun(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "agent_runs"

    message_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("agent_messages.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model_provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    tokens_in: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tokens_out: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    latency_ms: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    cost: Mapped[Decimal] = mapped_column(Numeric(10, 6), default=0.000000, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="completed", nullable=False)

    # Relationships
    message: Mapped["AgentMessage"] = relationship("AgentMessage", back_populates="runs")
    steps: Mapped[List["AgentStep"]] = relationship("AgentStep", back_populates="run", cascade="all, delete-orphan")

class AgentStep(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "agent_steps"

    run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("agent_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    step_index: Mapped[int] = mapped_column(Integer, nullable=False)
    tool: Mapped[str] = mapped_column(String(100), nullable=False)
    input: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    output: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    verifier_passed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    run: Mapped["AgentRun"] = relationship("AgentRun", back_populates="steps")

class EvalCase(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "eval_cases"

    task: Mapped[str] = mapped_column(String(100), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(50), nullable=False)
    input_ref: Mapped[str] = mapped_column(String(255), nullable=False)
    ground_truth: Mapped[dict] = mapped_column(JSONB, nullable=False)
    labelled_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

class EvalRun(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "eval_runs"

    model: Mapped[str] = mapped_column(String(100), nullable=False)
    engine_version: Mapped[str] = mapped_column(String(50), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    results: Mapped[List["EvalResult"]] = relationship("EvalResult", back_populates="run", cascade="all, delete-orphan")

class EvalResult(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "eval_results"

    run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("eval_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("eval_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    predicted: Mapped[dict] = mapped_column(JSONB, nullable=False)
    exact_match: Mapped[bool] = mapped_column(Boolean, nullable=False)
    numeric_match: Mapped[bool] = mapped_column(Boolean, nullable=False)
    critical_error: Mapped[bool] = mapped_column(Boolean, nullable=False)

    # Relationships
    run: Mapped["EvalRun"] = relationship("EvalRun", back_populates="results")
