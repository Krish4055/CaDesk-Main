"""Initial CAdesk Schema with RLS, Constraints and Audit Trigger

Revision ID: 001_initial_cadesk
Revises: 
Create Date: 2026-10-04 20:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_initial_cadesk'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Enable pgcrypto extension for gen_random_uuid
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

    # 2. Tenancy & People
    op.create_table(
        'firms',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('plan', sa.String(length=50), server_default='starter', nullable=False),
        sa.Column('settings', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("plan IN ('free', 'starter', 'pro', 'enterprise')", name='chk_firm_plan'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('external_auth_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('external_auth_id')
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_external_auth_id', 'users', ['external_auth_id'])

    op.create_table(
        'memberships',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('firm_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(length=50), server_default='staff', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("role IN ('owner', 'ca', 'staff', 'individual')", name='chk_membership_role'),
        sa.ForeignKeyConstraint(['firm_id'], ['firms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('firm_id', 'user_id', name='uq_firm_user_membership')
    )
    op.create_index('ix_memberships_firm_id', 'memberships', ['firm_id'])
    op.create_index('ix_memberships_user_id', 'memberships', ['user_id'])

    op.create_table(
        'clients',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('firm_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('display_name', sa.String(length=255), nullable=False),
        sa.Column('client_type', sa.String(length=50), server_default='salaried', nullable=False),
        sa.Column('pan_encrypted', sa.LargeBinary(), nullable=False),
        sa.Column('pan_hmac', sa.String(length=64), nullable=False),
        sa.Column('pan_last4', sa.CHAR(length=4), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='draft', nullable=False),
        sa.Column('assigned_ca_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('risk_flag', sa.String(length=20), server_default='low', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("client_type IN ('salaried', 'freelancer', 'business')", name='chk_client_type'),
        sa.CheckConstraint("risk_flag IN ('low', 'medium', 'high')", name='chk_client_risk_flag'),
        sa.CheckConstraint("status IN ('draft', 'in_review', 'action_required', 'ready_for_filing', 'filed')", name='chk_client_status'),
        sa.ForeignKeyConstraint(['assigned_ca_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['firm_id'], ['firms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_clients_firm_id', 'clients', ['firm_id'])
    op.create_index('ix_clients_firm_status', 'clients', ['firm_id', 'status'])
    op.create_index('ix_clients_pan_hmac', 'clients', ['pan_hmac'])

    op.create_table(
        'client_assignments',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(length=50), server_default='preparer', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("role IN ('preparer', 'reviewer', 'partner')", name='chk_client_assignment_role'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('client_id', 'user_id', name='uq_client_user_assignment')
    )

    # 3. Rules & KB
    op.create_table(
        'rule_sets',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('financial_year', sa.String(length=10), nullable=False),
        sa.Column('version', sa.Integer(), server_default='1', nullable=False),
        sa.Column('effective_from', sa.Date(), nullable=False),
        sa.Column('effective_to', sa.Date(), nullable=True),
        sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('section_label_map', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('status', sa.String(length=20), server_default='draft', nullable=False),
        sa.Column('content_hash', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("status IN ('draft', 'active', 'retired')", name='chk_ruleset_status'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('financial_year', 'version', name='uq_ruleset_fy_version')
    )

    op.create_table(
        'kb_sources',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False),
        sa.Column('jurisdiction', sa.String(length=100), server_default='India/CBDT', nullable=False),
        sa.Column('effective_date', sa.Date(), nullable=False),
        sa.Column('version', sa.String(length=50), server_default='1.0', nullable=False),
        sa.Column('url', sa.Text(), nullable=True),
        sa.Column('content_hash', sa.String(length=64), nullable=False),
        sa.Column('ingested_at', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("source_type IN ('act', 'circular', 'notification', 'case_law')", name='chk_kb_source_type'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'kb_chunks',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('source_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('section_ref', sa.String(length=100), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('qdrant_point_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('effective_from', sa.Date(), nullable=False),
        sa.Column('effective_to', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['source_id'], ['kb_sources.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_kb_chunks_section_ref', 'kb_chunks', ['section_ref'])

    # 4. Documents & Extraction
    op.create_table(
        'documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('firm_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('financial_year', sa.String(length=10), nullable=False),
        sa.Column('doc_type', sa.String(length=50), nullable=False),
        sa.Column('storage_key', sa.Text(), nullable=False),
        sa.Column('sha256', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='uploaded', nullable=False),
        sa.Column('page_count', sa.Integer(), server_default='1', nullable=False),
        sa.Column('uploaded_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("status IN ('uploaded', 'ocr', 'classified', 'extracted', 'needs_review', 'verified', 'failed')", name='chk_document_status'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['firm_id'], ['firms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('firm_id', 'sha256', name='uq_firm_document_sha256')
    )
    op.create_index('ix_documents_firm_client', 'documents', ['firm_id', 'client_id'])

    op.create_table(
        'extraction_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('engine', sa.String(length=100), server_default='rednote-hilab/dots.ocr', nullable=False),
        sa.Column('engine_version', sa.String(length=50), server_default='1.7B', nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('latency_ms', sa.Float(), server_default='0', nullable=False),
        sa.Column('overall_confidence', sa.Numeric(precision=5, scale=2), server_default='0', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='completed', nullable=False),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'extracted_fields',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('run_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('field_key', sa.String(length=100), nullable=False),
        sa.Column('label', sa.String(length=255), nullable=False),
        sa.Column('value_text', sa.Text(), nullable=True),
        sa.Column('value_numeric', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('confidence', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('needs_review', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('bbox', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('source_snippet', sa.Text(), nullable=True),
        sa.Column('is_confirmed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('confirmed_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['confirmed_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['run_id'], ['extraction_runs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_extracted_fields_document_key', 'extracted_fields', ['document_id', 'field_key'])

    op.create_table(
        'field_edits',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('field_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('old_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=True),
        sa.Column('edited_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('edited_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['edited_by'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['field_id'], ['extracted_fields.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 5. Tax Computations & Working Papers
    op.create_table(
        'financial_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('financial_year', sa.String(length=10), nullable=False),
        sa.Column('version', sa.Integer(), server_default='1', nullable=False),
        sa.Column('data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('conflicts', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('built_from_run_ids', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'tax_computations',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('financial_year', sa.String(length=10), nullable=False),
        sa.Column('rule_set_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('engine_version', sa.String(length=50), server_default='2025.1', nullable=False),
        sa.Column('inputs', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('new_regime', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('old_regime', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('better_regime', sa.String(length=10), nullable=False),
        sa.Column('savings', sa.Numeric(precision=15, scale=2), server_default='0', nullable=False),
        sa.Column('input_hash', sa.String(length=64), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("better_regime IN ('old', 'new', 'equal')", name='chk_better_regime'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['rule_set_id'], ['rule_sets.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tax_computations_input_hash', 'tax_computations', ['input_hash'])

    op.create_table(
        'findings',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('computation_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('finding_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('detail', sa.Text(), nullable=False),
        sa.Column('estimated_saving', sa.Numeric(precision=15, scale=2), server_default='0', nullable=False),
        sa.Column('confidence', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('requires_human_review', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('status', sa.String(length=20), server_default='open', nullable=False),
        sa.Column('created_by_agent', sa.String(length=100), server_default='Compliance Agent', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("status IN ('open', 'accepted', 'dismissed')", name='chk_finding_status'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['computation_id'], ['tax_computations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'citations',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('finding_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('message_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('kb_chunk_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('rule_set_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('section_ref', sa.String(length=100), nullable=False),
        sa.Column('as_of_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['finding_id'], ['findings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['kb_chunk_id'], ['kb_chunks.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['rule_set_id'], ['rule_sets.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. Review Tasks, Sign-Offs & Audit Log
    op.create_table(
        'review_tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('firm_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False),
        sa.Column('source_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('priority', sa.String(length=20), server_default='medium', nullable=False),
        sa.Column('status', sa.String(length=20), server_default='open', nullable=False),
        sa.Column('assigned_to', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('due_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("priority IN ('low', 'medium', 'high', 'urgent')", name='chk_review_priority'),
        sa.CheckConstraint("source_type IN ('finding', 'field', 'computation', 'document')", name='chk_review_source_type'),
        sa.CheckConstraint("status IN ('open', 'in_review', 'resolved')", name='chk_review_status'),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['firm_id'], ['firms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'signoffs',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('financial_year', sa.String(length=10), nullable=False),
        sa.Column('computation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('signed_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('signed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='approved', nullable=False),
        sa.Column('snapshot', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('snapshot_sha256', sa.String(length=64), nullable=False),
        sa.Column('rule_set_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("status IN ('approved', 'changes_requested')", name='chk_signoff_status'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['computation_id'], ['tax_computations.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['rule_set_id'], ['rule_sets.id']),
        sa.ForeignKeyConstraint(['signed_by'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'audit_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('firm_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('actor_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('actor_type', sa.String(length=20), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=100), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('before', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('after', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('prev_hash', sa.String(length=64), nullable=False),
        sa.Column('row_hash', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("actor_type IN ('user', 'agent', 'system')", name='chk_audit_actor_type'),
        sa.ForeignKeyConstraint(['firm_id'], ['firms.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('row_hash')
    )
    op.create_index('ix_audit_firm_created', 'audit_log', ['firm_id', 'created_at'])

    # 7. Collaboration & Deadlines
    op.create_table(
        'document_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('requested_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='sent', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("status IN ('draft', 'sent', 'partially_fulfilled', 'completed', 'cancelled')", name='chk_doc_req_status'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requested_by'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'document_request_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('request_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('label', sa.String(length=255), nullable=False),
        sa.Column('doc_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='pending', nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('due_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("status IN ('pending', 'submitted', 'approved', 'rejected')", name='chk_doc_req_item_status'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['request_id'], ['document_requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'reminders',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('channel', sa.String(length=20), server_default='email', nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='scheduled', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("channel IN ('email', 'whatsapp', 'sms')", name='chk_reminder_channel'),
        sa.CheckConstraint("status IN ('scheduled', 'sent', 'failed', 'cancelled')", name='chk_reminder_status'),
        sa.ForeignKeyConstraint(['item_id'], ['document_request_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'deadline_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('applies_to', sa.String(length=50), server_default='all', nullable=False),
        sa.Column('rule', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'client_deadlines',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('template_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='pending', nullable=False),
        sa.Column('snoozed_until', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("status IN ('pending', 'completed', 'overdue')", name='chk_deadline_status'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['template_id'], ['deadline_templates.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 8. Agent Telemetry & Evals
    op.create_table(
        'agent_threads',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('firm_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['firm_id'], ['firms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'agent_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('thread_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('confidence', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('flagged_for_review', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['thread_id'], ['agent_threads.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'agent_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('message_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('agent_name', sa.String(length=100), nullable=False),
        sa.Column('model_provider', sa.String(length=50), nullable=False),
        sa.Column('model_name', sa.String(length=100), nullable=False),
        sa.Column('tokens_in', sa.Integer(), server_default='0', nullable=False),
        sa.Column('tokens_out', sa.Integer(), server_default='0', nullable=False),
        sa.Column('latency_ms', sa.Float(), server_default='0', nullable=False),
        sa.Column('cost', sa.Numeric(precision=10, scale=6), server_default='0', nullable=False),
        sa.Column('status', sa.String(length=20), server_default='completed', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['message_id'], ['agent_messages.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'agent_steps',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('run_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('step_index', sa.Integer(), nullable=False),
        sa.Column('tool', sa.String(length=100), nullable=False),
        sa.Column('input', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('output', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('verifier_passed', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['run_id'], ['agent_runs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'eval_cases',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('task', sa.String(length=100), nullable=False),
        sa.Column('doc_type', sa.String(length=50), nullable=False),
        sa.Column('input_ref', sa.String(length=255), nullable=False),
        sa.Column('ground_truth', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('labelled_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['labelled_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'eval_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('model', sa.String(length=100), nullable=False),
        sa.Column('engine_version', sa.String(length=50), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'eval_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('run_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('predicted', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('exact_match', sa.Boolean(), nullable=False),
        sa.Column('numeric_match', sa.Boolean(), nullable=False),
        sa.Column('critical_error', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['case_id'], ['eval_cases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['run_id'], ['eval_runs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 9. Privacy & DPDP
    op.create_table(
        'consents',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('purpose', sa.String(length=255), nullable=False),
        sa.Column('granted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('withdrawn_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('version_text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'data_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('request_type', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='pending', nullable=False),
        sa.Column('requested_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("request_type IN ('export', 'delete')", name='chk_data_request_type'),
        sa.CheckConstraint("status IN ('pending', 'in_progress', 'completed', 'rejected')", name='chk_data_request_status'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 10. Audit Log Immutability Trigger (APPEND-ONLY)
    op.execute("""
        CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
        RETURNS TRIGGER AS $$
        BEGIN
            RAISE EXCEPTION 'audit_log is append-only. Modification or deletion is forbidden by statutory compliance policy.';
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trg_audit_log_immutable
        BEFORE UPDATE OR DELETE ON audit_log
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
    """)

    # 11. Row Level Security (RLS) Enablement & Tenant Policies
    rls_tables = ['clients', 'documents', 'review_tasks', 'audit_log', 'agent_threads']
    for t in rls_tables:
        op.execute(f"ALTER TABLE {t} ENABLE ROW LEVEL SECURITY;")
        op.execute(f"""
            CREATE POLICY tenant_isolation_policy_{t} ON {t}
            FOR ALL
            USING (
                firm_id = NULLIF(current_setting('app.current_firm_id', true), '')::uuid
            );
        """)

def downgrade() -> None:
    # Drop RLS Policies & Triggers
    op.execute("DROP TRIGGER IF EXISTS trg_audit_log_immutable ON audit_log;")
    op.execute("DROP FUNCTION IF EXISTS prevent_audit_log_modification();")

    rls_tables = ['clients', 'documents', 'review_tasks', 'audit_log', 'agent_threads']
    for t in rls_tables:
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation_policy_{t} ON {t};")

    # Drop tables in reverse topological dependency order
    op.drop_table('data_requests')
    op.drop_table('consents')
    op.drop_table('eval_results')
    op.drop_table('eval_runs')
    op.drop_table('eval_cases')
    op.drop_table('agent_steps')
    op.drop_table('agent_runs')
    op.drop_table('agent_messages')
    op.drop_table('agent_threads')
    op.drop_table('notifications')
    op.drop_table('client_deadlines')
    op.drop_table('deadline_templates')
    op.drop_table('reminders')
    op.drop_table('document_request_items')
    op.drop_table('document_requests')
    op.drop_table('audit_log')
    op.drop_table('signoffs')
    op.drop_table('review_tasks')
    op.drop_table('citations')
    op.drop_table('findings')
    op.drop_table('tax_computations')
    op.drop_table('financial_profiles')
    op.drop_table('field_edits')
    op.drop_table('extracted_fields')
    op.drop_table('extraction_runs')
    op.drop_table('documents')
    op.drop_table('kb_chunks')
    op.drop_table('kb_sources')
    op.drop_table('rule_sets')
    op.drop_table('client_assignments')
    op.drop_table('clients')
    op.drop_table('memberships')
    op.drop_table('users')
    op.drop_table('firms')
