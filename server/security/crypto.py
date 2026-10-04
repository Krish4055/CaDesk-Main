"""
CAdesk Cryptographic Utilities
- Application-layer AES-256-GCM encryption for PAN & Account numbers.
- HMAC-SHA256 deterministic hash for searchable lookup index without leaking plaintext.
- Strict masking helper (only last 4 characters visible).
"""

import os
import hmac
import hashlib
import re
from typing import Tuple, Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from server.db.config import db_settings

def _get_encryption_key() -> bytes:
    key_hex = db_settings.PAN_ENCRYPTION_KEY
    if len(key_hex) == 64:
        return bytes.fromhex(key_hex)
    return hashlib.sha256(key_hex.encode("utf-8")).digest()

def _get_hmac_key() -> bytes:
    key_hex = db_settings.PAN_HMAC_KEY
    if len(key_hex) == 64:
        return bytes.fromhex(key_hex)
    return hashlib.sha256(key_hex.encode("utf-8")).digest()

def encrypt_pan(pan_plaintext: str) -> Tuple[bytes, str, str]:
    """
    Encrypts a plaintext PAN.
    Returns:
      (pan_encrypted_bytes, pan_hmac_hex, pan_last4)
    """
    if not pan_plaintext:
        raise ValueError("PAN cannot be empty.")
    
    clean_pan = pan_plaintext.strip().upper()
    if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', clean_pan):
        raise ValueError(f"Invalid Indian PAN format: {clean_pan}")

    key = _get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce for GCM
    ciphertext = aesgcm.encrypt(nonce, clean_pan.encode("utf-8"), None)
    
    # Store nonce + ciphertext together
    pan_encrypted = nonce + ciphertext
    
    # Deterministic HMAC for lookup
    pan_hmac = compute_pan_hmac(clean_pan)
    pan_last4 = clean_pan[-4:]
    
    return pan_encrypted, pan_hmac, pan_last4

def decrypt_pan(pan_encrypted: bytes) -> str:
    """Decrypts an AES-256-GCM encrypted PAN"""
    if not pan_encrypted or len(pan_encrypted) < 28:
        raise ValueError("Invalid encrypted PAN payload.")
    
    key = _get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = pan_encrypted[:12]
    ciphertext = pan_encrypted[12:]
    
    decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
    return decrypted_bytes.decode("utf-8")

def compute_pan_hmac(pan_plaintext: str) -> str:
    """Computes deterministic HMAC-SHA256 for index lookup"""
    clean_pan = pan_plaintext.strip().upper()
    h = hmac.new(_get_hmac_key(), clean_pan.encode("utf-8"), hashlib.sha256)
    return h.hexdigest()

def mask_pan(pan_plaintext_or_last4: str) -> str:
    """Returns safe masked format e.g. XXXXXX1234"""
    if not pan_plaintext_or_last4:
        return "XXXXXX"
    if len(pan_plaintext_or_last4) == 10:
        return f"XXXXXX{pan_plaintext_or_last4[-4:]}"
    if len(pan_plaintext_or_last4) == 4:
        return f"XXXXXX{pan_plaintext_or_last4}"
    return "XXXXXX"
