"""
CAdesk Audit Service
Manages immutable, append-only cryptographic audit trail with SHA-256 hash chains.
"""

import uuid
import hashlib
import json
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from server.models.review_audit import AuditLog

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def compute_row_hash(
    prev_hash: str,
    firm_id: uuid.UUID,
    actor_id: Optional[uuid.UUID],
    actor_type: str,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID,
    before: Optional[Dict[str, Any]] = None,
    after: Optional[Dict[str, Any]] = None,
    before_state: Optional[Dict[str, Any]] = None,
    after_state: Optional[Dict[str, Any]] = None
) -> str:
    """Computes deterministic SHA-256 row hash for chain link"""
    b = before if before is not None else before_state
    a = after if after is not None else after_state
    payload = {
        "prev_hash": prev_hash,
        "firm_id": str(firm_id),
        "actor_id": str(actor_id) if actor_id else None,
        "actor_type": actor_type,
        "action": action,
        "entity_type": entity_type,
        "entity_id": str(entity_id),
        "before": b,
        "after": a,
    }
    encoded = json.dumps(payload, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()

compute_audit_hash = compute_row_hash

async def record_audit_entry(
    session: AsyncSession,
    firm_id: uuid.UUID,
    actor_id: Optional[uuid.UUID],
    actor_type: str, # user | agent | system
    action: str,
    entity_type: str,
    entity_id: uuid.UUID,
    before: Optional[Dict[str, Any]] = None,
    after: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """Appends a new verified audit record linked to the previous row's hash"""
    stmt = (
        select(AuditLog)
        .where(AuditLog.firm_id == firm_id)
        .order_by(desc(AuditLog.created_at), desc(AuditLog.id))
        .limit(1)
    )
    res = await session.execute(stmt)
    last_log = res.scalar_one_or_none()

    prev_hash = last_log.row_hash if last_log else GENESIS_HASH
    row_hash = compute_row_hash(
        prev_hash=prev_hash,
        firm_id=firm_id,
        actor_id=actor_id,
        actor_type=actor_type,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before=before,
        after=after
    )

    log_entry = AuditLog(
        firm_id=firm_id,
        actor_id=actor_id,
        actor_type=actor_type,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before=before,
        after=after,
        prev_hash=prev_hash,
        row_hash=row_hash
    )
    session.add(log_entry)
    await session.flush()
    return log_entry

async def verify_audit_chain_integrity(
    session: AsyncSession,
    firm_id: uuid.UUID
) -> Tuple[bool, int, Optional[str]]:
    """
    Verifies that the entire audit log hash chain is unbroken and unmodified.
    Returns: (is_valid, total_verified_count, error_message)
    """
    stmt = (
        select(AuditLog)
        .where(AuditLog.firm_id == firm_id)
        .order_by(AuditLog.created_at.asc(), AuditLog.id.asc())
    )
    res = await session.execute(stmt)
    logs = res.scalars().all()

    if not logs:
        return True, 0, None

    expected_prev = GENESIS_HASH
    for idx, log in enumerate(logs):
        if log.prev_hash != expected_prev:
            return False, idx, f"Hash chain broken at log ID {log.id}: prev_hash mismatch."

        recalculated = compute_row_hash(
            prev_hash=log.prev_hash,
            firm_id=log.firm_id,
            actor_id=log.actor_id,
            actor_type=log.actor_type,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            before=log.before,
            after=log.after
        )
        if recalculated != log.row_hash:
            return False, idx, f"Hash chain tampered at log ID {log.id}: row_hash recalculation mismatch."

        expected_prev = log.row_hash

    return True, len(logs), None
