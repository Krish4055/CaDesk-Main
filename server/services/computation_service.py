"""
CAdesk Tax Computation Service
Ensures strict determinism: identical inputs + rule_set_id produces identical input_hash and outputs.
"""

import uuid
import hashlib
import json
from decimal import Decimal
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from server.models.tax_work import TaxComputation, Finding
from server.models.rules_kb import RuleSet

def compute_input_hash(inputs: Dict[str, Any], rule_set_id: Optional[uuid.UUID] = None) -> str:
    """Computes deterministic SHA-256 hash over input parameters (+ optional rule_set_id)"""
    payload = {
        "rule_set_id": str(rule_set_id) if rule_set_id else None,
        "inputs": inputs,
    }
    encoded = json.dumps(payload, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()

async def record_tax_computation(
    session: AsyncSession,
    client_id: uuid.UUID,
    financial_year: str,
    rule_set_id: uuid.UUID,
    inputs: Dict[str, Any],
    new_regime_result: Dict[str, Any],
    old_regime_result: Dict[str, Any],
    better_regime: str,
    savings: Decimal,
    engine_version: str = "2025.1",
    created_by: Optional[uuid.UUID] = None
) -> TaxComputation:
    """Records a deterministic tax computation with input_hash"""
    input_hash = compute_input_hash(inputs, rule_set_id)

    computation = TaxComputation(
        client_id=client_id,
        financial_year=financial_year,
        rule_set_id=rule_set_id,
        engine_version=engine_version,
        inputs=inputs,
        new_regime=new_regime_result,
        old_regime=old_regime_result,
        better_regime=better_regime,
        savings=savings,
        input_hash=input_hash,
        created_by=created_by
    )
    session.add(computation)
    await session.flush()
    return computation
