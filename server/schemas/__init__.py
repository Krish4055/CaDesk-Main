"""
CAdesk Pydantic v2 Domain Schemas
"""

import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field, EmailStr

class FirmCreate(BaseModel):
    name: str = Field(..., max_length=255)
    plan: str = Field(default="starter")
    settings: Dict[str, Any] = Field(default_factory=dict)

class FirmResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    plan: str
    settings: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class UserCreate(BaseModel):
    external_auth_id: uuid.UUID
    email: EmailStr
    full_name: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    external_auth_id: uuid.UUID
    email: str
    full_name: str
    created_at: datetime

class ClientCreate(BaseModel):
    display_name: str
    client_type: str = Field(default="salaried") # salaried | freelancer | business
    pan_plaintext: str = Field(..., min_length=10, max_length=10)
    assigned_ca_id: Optional[uuid.UUID] = None
    risk_flag: str = Field(default="low")

class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    firm_id: uuid.UUID
    display_name: str
    client_type: str
    pan_last4: str
    status: str
    assigned_ca_id: Optional[uuid.UUID]
    risk_flag: str
    created_at: datetime

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    firm_id: uuid.UUID
    client_id: uuid.UUID
    financial_year: str
    doc_type: str
    storage_key: str
    sha256: str
    status: str
    page_count: int
    created_at: datetime

class ExtractedFieldResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    document_id: uuid.UUID
    field_key: str
    label: str
    value_text: Optional[str]
    value_numeric: Optional[Decimal]
    confidence: Decimal
    needs_review: bool
    is_confirmed: bool

class TaxComputationCreate(BaseModel):
    client_id: uuid.UUID
    financial_year: str
    rule_set_id: uuid.UUID
    engine_version: str = "2025.1"
    inputs: Dict[str, Any]
    new_regime: Dict[str, Any]
    old_regime: Dict[str, Any]
    better_regime: str
    savings: Decimal

class TaxComputationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    client_id: uuid.UUID
    financial_year: str
    rule_set_id: uuid.UUID
    engine_version: str
    inputs: Dict[str, Any]
    new_regime: Dict[str, Any]
    old_regime: Dict[str, Any]
    better_regime: str
    savings: Decimal
    input_hash: str
    created_at: datetime

class FindingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    client_id: uuid.UUID
    computation_id: Optional[uuid.UUID]
    finding_type: str
    title: str
    detail: str
    estimated_saving: Decimal
    confidence: Decimal
    requires_human_review: bool
    status: str
    created_by_agent: str

class SignoffCreate(BaseModel):
    client_id: uuid.UUID
    financial_year: str
    computation_id: uuid.UUID
    signed_by: uuid.UUID
    status: str = "approved"
    snapshot: Dict[str, Any]
    rule_set_id: uuid.UUID
    comment: Optional[str] = None

class SignoffResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    client_id: uuid.UUID
    financial_year: str
    computation_id: uuid.UUID
    signed_by: uuid.UUID
    signed_at: datetime
    status: str
    snapshot: Dict[str, Any]
    snapshot_sha256: str
    rule_set_id: uuid.UUID
    comment: Optional[str]

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    firm_id: uuid.UUID
    actor_id: Optional[uuid.UUID]
    actor_type: str
    action: str
    entity_type: str
    entity_id: uuid.UUID
    before: Optional[Dict[str, Any]]
    after: Optional[Dict[str, Any]]
    prev_hash: str
    row_hash: str
    created_at: datetime
