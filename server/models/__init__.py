"""
CAdesk Database Models Unified Module Export
"""

from server.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

from server.models.tenancy import Firm, User, Membership, Client, ClientAssignment
from server.models.rules_kb import RuleSet, KBSource, KBChunk
from server.models.documents import Document, ExtractionRun, ExtractedField, FieldEdit
from server.models.tax_work import FinancialProfile, TaxComputation, Finding, Citation
from server.models.review_audit import ReviewTask, Signoff, AuditLog
from server.models.collaboration import (
    DocumentRequest, DocumentRequestItem, Reminder, DeadlineTemplate, ClientDeadline, Notification
)
from server.models.agent_eval import (
    AgentThread, AgentMessage, AgentRun, AgentStep, EvalCase, EvalRun, EvalResult
)
from server.models.compliance import Consent, DataRequest

__all__ = [
    "Base",
    "TimestampMixin",
    "UUIDPrimaryKeyMixin",
    "Firm",
    "User",
    "Membership",
    "Client",
    "ClientAssignment",
    "RuleSet",
    "KBSource",
    "KBChunk",
    "Document",
    "ExtractionRun",
    "ExtractedField",
    "FieldEdit",
    "FinancialProfile",
    "TaxComputation",
    "Finding",
    "Citation",
    "ReviewTask",
    "Signoff",
    "AuditLog",
    "DocumentRequest",
    "DocumentRequestItem",
    "Reminder",
    "DeadlineTemplate",
    "ClientDeadline",
    "Notification",
    "AgentThread",
    "AgentMessage",
    "AgentRun",
    "AgentStep",
    "EvalCase",
    "EvalRun",
    "EvalResult",
    "Consent",
    "DataRequest",
]
