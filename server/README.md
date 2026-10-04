# CAdesk PostgreSQL Database Layer & AI Architecture

## 1. Overview
The CAdesk database layer is designed for an AI-native statutory tax working-papers platform where AI agents prepare drafts and Chartered Accountants (CAs) review, verify, and sign off.

### Key Architectural Pillars:
- **Multi-Tenant Isolation via Row Level Security (RLS)**: Enforced directly at the PostgreSQL layer using `current_setting('app.current_firm_id')`.
- **Immutable Cryptographic Audit Trail**: `audit_log` table protected by database triggers that strictly block `UPDATE` and `DELETE`. Each record is linked in a SHA-256 hash chain starting from a verified genesis hash.
- **Statutory Data Protection (DPDP Act 2023)**: PANs encrypted at rest using AES-256-GCM with deterministic HMAC-SHA256 index keys. Complete erasure workflow for document & OCR artifacts.
- **Deterministic Tax Computation**: Every tax computation is cryptographically anchored by an `input_hash` and linked to a versioned statutory `rule_set`.
- **Signed-Off Snapshot Immutability**: Signed working papers are locked against modifications.

---

## 2. Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    FIRMS ||--o{ USERS : "has members"
    FIRMS ||--o{ CLIENTS : "owns"
    FIRMS ||--o{ DOCUMENTS : "stores"
    FIRMS ||--o{ TAX_COMPUTATIONS : "calculates"
    FIRMS ||--o{ AUDIT_LOG : "records"
    
    CLIENTS ||--o{ DOCUMENTS : "provides"
    CLIENTS ||--o{ FINANCIAL_PROFILES : "has"
    CLIENTS ||--o{ TAX_COMPUTATIONS : "evaluated in"
    CLIENTS ||--o{ REVIEW_TASKS : "tracked by"
    
    RULE_SETS ||--o{ TAX_COMPUTATIONS : "rules applied"
    DOCUMENTS ||--o{ EXTRACTION_RUNS : "parsed by"
    EXTRACTION_RUNS ||--o{ EXTRACTED_FIELDS : "produces"
    
    TAX_COMPUTATIONS ||--o{ FINDINGS : "flags"
    TAX_COMPUTATIONS ||--o{ SIGNOFFS : "sealed by"
    
    FIRMS {
        uuid id PK
        string name
        string slug
        string firm_registration_number
        jsonb settings
        timestamp created_at
    }
    
    USERS {
        uuid id PK
        uuid external_auth_id UK "Supabase JWT"
        string email UK
        string full_name
        string role
        string membership_number
    }
    
    CLIENTS {
        uuid id PK
        uuid firm_id FK
        string name
        string client_type
        bytea pan_encrypted
        string pan_hmac "HMAC Index"
        string pan_masked "XXXXXX1234"
        timestamp deleted_at
    }
    
    DOCUMENTS {
        uuid id PK
        uuid firm_id FK
        uuid client_id FK
        string original_filename
        string storage_path
        string sha256 UK "Unique per firm"
        string document_type
        string status
    }
    
    RULE_SETS {
        uuid id PK
        string financial_year
        string assessment_year
        string version UK "Unique per FY+Version"
        boolean is_active
        jsonb rules
    }
    
    TAX_COMPUTATIONS {
        uuid id PK
        uuid firm_id FK
        uuid client_id FK
        uuid rule_set_id FK
        string financial_year
        string regime
        string input_hash "Deterministic SHA-256"
        numeric tax_payable
        numeric refund_due
        integer version
    }
    
    FINDINGS {
        uuid id PK
        uuid firm_id FK
        uuid client_id FK
        uuid tax_computation_id FK
        string title
        string severity "info|warning|critical"
        numeric impact_amount
        boolean is_resolved
    }
    
    SIGNOFFS {
        uuid id PK
        uuid firm_id FK
        uuid client_id FK
        uuid tax_computation_id FK
        uuid signed_by FK
        string signoff_level "preparer|reviewer|partner"
        string snapshot_sha256
        string status "draft|signed|rejected"
    }
    
    AUDIT_LOG {
        uuid id PK
        uuid firm_id FK
        uuid actor_id
        string actor_type "user|agent|system"
        string action
        string entity_type
        uuid entity_id
        string prev_hash
        string row_hash UK "Cryptographic Link"
        timestamp created_at
    }
```

---

## 3. Neon Serverless PostgreSQL Setup Guide

CAdesk uses Neon Serverless PostgreSQL with pgBouncer pooling for scalable multi-tenant performance.

### Connection Strings
1. **Pooled Connection String (FastAPI Runtime)**:
   - Host: `ep-xxxx-pooler.region.neon.tech` (Port `6543` or `5432`)
   - Uses `asyncpg` driver for non-blocking I/O.
   - Example: `postgresql+asyncpg://user:pass@ep-xxxx-pooler.region.neon.tech/neondb?sslmode=require`
   - **Configuration**: Since pgBouncer operates in transaction pooling mode, prepared statements must be disabled by setting:
     ```env
     PREPARED_STATEMENT_CACHE_SIZE=0
     ```

2. **Direct Non-Pooled Connection String (Alembic Migrations & DDL)**:
   - Host: `ep-xxxx.region.neon.tech` (Direct host without `-pooler`)
   - Uses `psycopg2` driver.
   - Example: `postgresql+psycopg2://user:pass@ep-xxxx.region.neon.tech/neondb?sslmode=require`

### Environment Configuration (`.env`)
```env
DATABASE_URL=postgresql+asyncpg://<username>:<password>@<neon-pooled-host>/<database>?sslmode=require
DIRECT_DATABASE_URL=postgresql+psycopg2://<username>:<password>@<neon-direct-host>/<database>?sslmode=require
PREPARED_STATEMENT_CACHE_SIZE=0
PAN_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
PAN_HMAC_KEY=fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210
```

---

## 4. Local Development with Docker

Start local PostgreSQL 16:
```bash
docker compose up -d
```

Run database migrations:
```bash
alembic upgrade head
```

Seed initial demo data (1 Demo Firm, 3 Users, 12 Indian Tax Clients, Rules, Computations):
```bash
python scripts/seed_db.py
```

Run test suite:
```bash
pytest server/tests/test_db_layer.py -v
```

---

## 5. Migration & Rollback Strategy

### Apply Migrations:
```bash
alembic upgrade head
```

### Rollback Migration:
```bash
alembic downgrade -1
```

### Generate New Revision:
```bash
alembic revision -m "add_new_feature_table"
```

---

## 6. Cryptography & DPDP Compliance Summary

1. **AES-256-GCM PAN Encryption**: Plaintext PANs are never stored in the database. Every PAN is encrypted with a unique 96-bit initialization vector and authenticated ciphertext.
2. **HMAC-SHA256 Search Index**: Deterministic lookup index enables instant exact-match queries without decrypting entire tables or leaking plaintext PAN patterns.
3. **Log Sanitization**: `SensitiveDataRedactor` automatically masks PANs (`[PAN_REDACTED:234F]`) and Aadhaar numbers (`[AADHAAR_REDACTED:9012]`) in all application logs.
4. **Append-Only Audit Trigger**: Direct `UPDATE` or `DELETE` statements against `audit_log` raise a PostgreSQL exception (`trg_audit_log_immutable`).
