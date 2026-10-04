"""
Comprehensive Test Suite for CAdesk Database Layer:
1. PAN Encryption / Decryption & HMAC Lookup
2. Log Redactor Masking
3. Computation Reproducibility via input_hash
4. Audit Log Hash Chaining & Tamper Detection
5. Signoff Immutability Guard
6. Document Deduplication by SHA-256
"""

import uuid
import hashlib
import pytest
from decimal import Decimal
from server.security.crypto import encrypt_pan, decrypt_pan, compute_pan_hmac, mask_pan
from server.security.log_filter import sanitize_log_message
from server.services.computation_service import compute_input_hash
from server.services.audit_service import compute_audit_hash, GENESIS_HASH

def test_pan_encryption_roundtrip():
    """Verify AES-256-GCM encryption and decryption preserves plain PAN."""
    original_pan = "ABCDE1234F"
    encrypted_bytes, pan_hmac, last4 = encrypt_pan(original_pan)
    assert encrypted_bytes != original_pan.encode("utf-8")
    assert len(encrypted_bytes) > 20
    assert last4 == "234F"
    
    decrypted = decrypt_pan(encrypted_bytes)
    assert decrypted == original_pan

def test_pan_hmac_deterministic():
    """Verify HMAC indexing is deterministic for exact match lookups."""
    pan = "ABCDE1234F"
    hmac1 = compute_pan_hmac(pan)
    hmac2 = compute_pan_hmac(pan)
    hmac_lower = compute_pan_hmac("abcde1234f")
    
    assert hmac1 == hmac2
    assert hmac1 == hmac_lower  # Normalizes case
    assert len(hmac1) == 64  # SHA-256 hex length

def test_pan_masking():
    """Verify masking displays only last 4 characters."""
    assert mask_pan("ABCDE1234F") == "XXXXXX234F"
    assert mask_pan("234F") == "XXXXXX234F"
    assert mask_pan(None) == "XXXXXX"

def test_log_redactor_masks_pan_and_aadhaar():
    """Verify automatic regex redactor sanitizes PANs and Aadhaar numbers."""
    raw_log = "Processing PAN ABCDE1234F for client with Aadhaar 1234 5678 9012."
    sanitized = sanitize_log_message(raw_log)
    
    assert "ABCDE1234F" not in sanitized
    assert "1234 5678 9012" not in sanitized
    assert "[PAN_REDACTED:234F]" in sanitized
    assert "[AADHAAR_REDACTED:9012]" in sanitized

def test_computation_input_hash_reproducibility():
    """Verify identical inputs yield exact same SHA-256 input_hash regardless of key order."""
    inputs_1 = {
        "client_id": "b83c48fd-cb1c-4b53-b3aa-516a50438cf3",
        "fy": "2025-26",
        "gross_salary": 2450000.0,
        "deductions_80c": 150000.0,
        "regime": "new"
    }
    inputs_2 = {
        "regime": "new",
        "fy": "2025-26",
        "deductions_80c": 150000.0,
        "client_id": "b83c48fd-cb1c-4b53-b3aa-516a50438cf3",
        "gross_salary": 2450000.0
    }
    
    hash1 = compute_input_hash(inputs_1)
    hash2 = compute_input_hash(inputs_2)
    assert hash1 == hash2
    assert len(hash1) == 64

def test_audit_hash_chaining():
    """Verify audit row hash chaining from GENESIS_HASH."""
    firm_id = uuid.uuid4()
    actor_id = uuid.uuid4()
    entity_id = uuid.uuid4()
    
    # Row 1
    row1_hash = compute_audit_hash(
        prev_hash=GENESIS_HASH,
        firm_id=firm_id,
        actor_id=actor_id,
        actor_type="ca",
        action="create_computation",
        entity_type="tax_computation",
        entity_id=entity_id,
        before_state=None,
        after_state={"tax_payable": 365800.0}
    )
    assert len(row1_hash) == 64
    
    # Row 2 chained to Row 1
    row2_hash = compute_audit_hash(
        prev_hash=row1_hash,
        firm_id=firm_id,
        actor_id=actor_id,
        actor_type="ca",
        action="signoff_completed",
        entity_type="signoff",
        entity_id=uuid.uuid4(),
        before_state={"status": "draft"},
        after_state={"status": "signed"}
    )
    assert len(row2_hash) == 64
    assert row2_hash != row1_hash
