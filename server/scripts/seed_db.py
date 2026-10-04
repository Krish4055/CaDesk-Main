"""
Database Seed Script for CAdesk
Populates initial demo data for local and staging environments:
- 1 Demo CA Firm ('Apex & Co. Chartered Accountants')
- 3 Users (Owner CA, Staff CA, Individual Client)
- 12 Realistic Indian Tax Clients (Individual, Partnership, Private Limited) with AES-256-GCM encrypted PANs & HMAC indexing
- Documents in various statuses ('uploaded', 'processing', 'extracted', 'verified', 'failed')
- Active FY 2025-26 RuleSet with IT Act tax slabs, 80C caps, 87A rebate, standard deduction Rs 75,000
- 3 Sample Findings (TDS mismatch, 80C overflow, Regime optimization recommendation)
- Review Task & Signed-off Working Paper Snapshot with SHA-256 hash
"""

import os
import sys
import uuid
import hashlib
import asyncio
from datetime import datetime, timezone, date
from decimal import Decimal

# Ensure server package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server.db.session import AsyncSessionLocal, set_db_context_firm_id
from server.models import (
    Firm, User, Membership, Client, ClientAssignment,
    RuleSet, Document, ExtractionRun, ExtractedField,
    FinancialProfile, TaxComputation, Finding,
    ReviewTask, Signoff
)
from server.security.crypto import encrypt_pan, compute_pan_hmac, mask_pan
from server.services.audit_service import record_audit_entry
from server.services.computation_service import compute_input_hash

async def seed():
    print("Starting CAdesk Database Seeding...")
    
    async with AsyncSessionLocal() as session:
        # 1. Create Demo Firm
        firm_id = uuid.uuid4()
        firm = Firm(
            id=firm_id,
            name="Apex & Co. Chartered Accountants",
            slug="apex-co-demo",
            firm_registration_number="FRN012345N",
            settings={
                "demo_mode": True,
                "currency": "INR",
                "locale": "en-IN",
                "auto_rerank_threshold": 0.90,
                "mfa_required": True
            }
        )
        session.add(firm)
        await session.flush()
        
        # Set tenant session context for RLS & triggers
        await set_db_context_firm_id(session, firm_id)
        
        # 2. Create Users & Memberships
        user_owner_id = uuid.uuid4()
        user_staff_id = uuid.uuid4()
        user_client_id = uuid.uuid4()
        
        owner = User(
            id=user_owner_id,
            external_auth_id=uuid.uuid4(),
            email="rajesh.sharma@apexca.example.com",
            full_name="Rajesh Sharma, FCA",
            phone="+919876543210",
            role="firm_owner",
            membership_number="098765"
        )
        staff = User(
            id=user_staff_id,
            external_auth_id=uuid.uuid4(),
            email="priya.verma@apexca.example.com",
            full_name="Priya Verma, ACA",
            phone="+919876543211",
            role="staff",
            membership_number="543210"
        )
        client_user = User(
            id=user_client_id,
            external_auth_id=uuid.uuid4(),
            email="vikram.malhotra@zenithexports.example.com",
            full_name="Vikram Malhotra",
            phone="+919876543212",
            role="client"
        )
        session.add_all([owner, staff, client_user])
        await session.flush()
        
        m1 = Membership(id=uuid.uuid4(), firm_id=firm_id, user_id=user_owner_id, role="firm_owner")
        m2 = Membership(id=uuid.uuid4(), firm_id=firm_id, user_id=user_staff_id, role="staff")
        session.add_all([m1, m2])
        await session.flush()
        
        # 3. Create 12 Indian Tax Clients
        demo_clients_data = [
            ("Vikram Malhotra", "individual", "ABCDE1234F", "vikram.malhotra@zenithexports.example.com", "+919876543212"),
            ("Anita Sundaram", "individual", "BFGPS5678K", "anita.s@biocon.example.com", "+919811122334"),
            ("Rohit Kulkarni", "individual", "CGHPK9012M", "rohit.kulkarni@techcorp.example.com", "+919822233445"),
            ("Sunita Deshmukh", "individual", "DKLPS3456N", "sunita.deshmukh@lawchambers.example.com", "+919833344556"),
            ("Harish Chandra", "individual", "ELMHC7890P", "harish.chandra@investcorp.example.com", "+919844455667"),
            ("Dr. Meera Nambiar", "individual", "FMNPN1234Q", "dr.meera@medicare.example.com", "+919855566778"),
            ("Zenith Global Exports LLP", "llp", "AAAFZ1234A", "accounts@zenithexports.example.com", "+919866677889"),
            ("Kalyan Jewellers & Sons", "partnership", "AABFK5678B", "tax@kalyanpartnership.example.com", "+919877788990"),
            ("Apex Infotech Solutions Pvt Ltd", "private_limited", "AAACA9012C", "finance@apexinfotech.example.com", "+919888899001"),
            ("Southern Spice Hospitality LLP", "llp", "AAAFS3456D", "cfo@southernspice.example.com", "+919899900112"),
            ("Greenfield Agro Tech Pvt Ltd", "private_limited", "AAACG7890E", "compliance@greenfieldagro.example.com", "+919800011223"),
            ("BlueStar Logistics & Cargo LLP", "llp", "AAAFB1234F", "accounts@bluestarlogistics.example.com", "+919812345678"),
        ]
        
        seeded_clients = []
        for name, c_type, pan_plain, email, phone in demo_clients_data:
            c = Client(
                id=uuid.uuid4(),
                firm_id=firm_id,
                name=name,
                client_type=c_type,
                pan_encrypted=encrypt_pan(pan_plain),
                pan_hmac=compute_pan_hmac(pan_plain),
                pan_masked=mask_pan(pan_plain),
                email=email,
                phone=phone,
                metadata_={
                    "demo": True,
                    "industry": "Technology / Trading / Healthcare",
                    "pan_verification_status": "verified"
                }
            )
            session.add(c)
            seeded_clients.append(c)
        
        await session.flush()
        
        # Assign primary client to Priya Verma (Staff)
        assign = ClientAssignment(
            id=uuid.uuid4(),
            firm_id=firm_id,
            client_id=seeded_clients[0].id,
            user_id=user_staff_id,
            role_on_client="lead_accountant"
        )
        session.add(assign)
        await session.flush()
        
        # 4. Create Active FY 2025-26 RuleSet
        rule_set = RuleSet(
            id=uuid.uuid4(),
            financial_year="2025-26",
            assessment_year="2026-27",
            version="2025.1.0-budget",
            is_active=True,
            rules={
                "standard_deduction": {
                    "new_regime": 75000,
                    "old_regime": 50000
                },
                "section_87a_rebate_limit": {
                    "new_regime": 700000,
                    "old_regime": 500000
                },
                "section_80c_cap": 150000,
                "tax_slabs_new": [
                    {"min": 0, "max": 300000, "rate": 0.0},
                    {"min": 300000, "max": 700000, "rate": 0.05},
                    {"min": 700000, "max": 1000000, "rate": 0.10},
                    {"min": 1000000, "max": 1200000, "rate": 0.15},
                    {"min": 1200000, "max": 1500000, "rate": 0.20},
                    {"min": 1500000, "max": None, "rate": 0.30}
                ],
                "health_education_cess": 0.04
            }
        )
        session.add(rule_set)
        await session.flush()
        
        # 5. Create Documents in Varied Statuses for Primary Client
        primary_client = seeded_clients[0]
        doc_statuses = [
            ("Form16_PartA_B_AY26-27.pdf", "form16", "verified", 2),
            ("Annual_Information_Statement_2025-26.pdf", "ais", "extracted", 5),
            ("Form26AS_TaxCredit_FY25-26.pdf", "26as", "processing", 1),
            ("Salary_Slip_March_2026.pdf", "salary_slip", "uploaded", 1),
            ("Corrupt_Bank_Statement.pdf", "bank_statement", "failed", 0)
        ]
        
        seeded_docs = []
        for filename, doc_type, status, pages in doc_statuses:
            dummy_content = f"Sample document payload for {filename} {uuid.uuid4()}".encode()
            sha256_hash = hashlib.sha256(dummy_content).hexdigest()
            doc = Document(
                id=uuid.uuid4(),
                firm_id=firm_id,
                client_id=primary_client.id,
                original_filename=filename,
                storage_path=f"vault/{firm_id}/{primary_client.id}/{filename}",
                mime_type="application/pdf",
                file_size_bytes=len(dummy_content) + 150000,
                sha256=sha256_hash,
                document_type=doc_type,
                page_count=pages,
                status=status,
                metadata_={
                    "uploaded_by": str(user_owner_id),
                    "demo_data": True
                }
            )
            session.add(doc)
            seeded_docs.append(doc)
        
        await session.flush()
        
        # Add Extraction Run and Extracted Fields for the Verified Form 16
        verified_doc = seeded_docs[0]
        ext_run = ExtractionRun(
            id=uuid.uuid4(),
            firm_id=firm_id,
            document_id=verified_doc.id,
            ocr_engine="dots.ocr-vLLM",
            model_version="rednote-hilab/dots.ocr",
            processing_time_ms=1240,
            status="completed"
        )
        session.add(ext_run)
        await session.flush()
        
        fields = [
            ("gross_salary", "2450000.00", "numeric", 0.98, False),
            ("tds_deducted", "384200.00", "numeric", 0.96, False),
            ("section_80c", "150000.00", "numeric", 0.94, False),
            ("pan_of_employee", "ABCDE1234F", "string", 0.99, False),
            ("tan_of_employer", "MUMB12345E", "string", 0.97, False),
        ]
        for name, val, f_type, conf, rev in fields:
            ef = ExtractedField(
                id=uuid.uuid4(),
                firm_id=firm_id,
                extraction_run_id=ext_run.id,
                field_name=name,
                field_value=val,
                field_type=f_type,
                confidence=conf,
                needs_review=rev
            )
            session.add(ef)
        await session.flush()
        
        # 6. Create Financial Profile & Tax Computation
        fin_profile = FinancialProfile(
            id=uuid.uuid4(),
            firm_id=firm_id,
            client_id=primary_client.id,
            financial_year="2025-26",
            gross_total_income=Decimal("2450000.00"),
            total_deductions=Decimal("150000.00"),
            taxable_income=Decimal("2300000.00"),
            tax_payable=Decimal("365800.00"),
            tds_claimed=Decimal("384200.00"),
            refund_due=Decimal("18400.00"),
            regime_selected="new",
            regime_comparison={
                "new_regime": {
                    "gross_income": 2450000,
                    "standard_deduction": 75000,
                    "taxable_income": 2375000,
                    "tax_payable": 365800,
                    "net_refund": 18400
                },
                "old_regime": {
                    "gross_income": 2450000,
                    "standard_deduction": 50000,
                    "section_80c": 150000,
                    "taxable_income": 2250000,
                    "tax_payable": 384200,
                    "net_refund": 0
                }
            },
            status="draft"
        )
        session.add(fin_profile)
        await session.flush()
        
        # Tax computation record
        comp_inputs = {
            "client_id": str(primary_client.id),
            "fy": "2025-26",
            "gross_salary": 2450000.0,
            "deductions_80c": 150000.0,
            "regime": "new"
        }
        input_hash = compute_input_hash(comp_inputs)
        
        tax_comp = TaxComputation(
            id=uuid.uuid4(),
            firm_id=firm_id,
            client_id=primary_client.id,
            rule_set_id=rule_set.id,
            financial_year="2025-26",
            assessment_year="2026-27",
            regime="new",
            inputs=comp_inputs,
            input_hash=input_hash,
            outputs={
                "gross_total_income": 2450000.0,
                "standard_deduction": 75000.0,
                "taxable_income": 2375000.0,
                "tax_before_cess": 351730.77,
                "cess_4_percent": 14069.23,
                "total_tax": 365800.0,
                "tds_paid": 384200.0,
                "refund": 18400.0
            },
            tax_payable=Decimal("365800.00"),
            refund_due=Decimal("18400.00"),
            calculated_by_actor_type="ai_agent",
            calculated_by_actor_id=user_staff_id,
            version=1
        )
        session.add(tax_comp)
        await session.flush()
        
        # 7. Create 3 Sample Findings
        findings_data = [
            (
                "TDS Credit Mismatch between 26AS and Form 16 Part A",
                "warning",
                "Form 26AS shows TDS credit of Rs 3,72,000 against Rs 3,84,200 deducted in Form 16 Part A by employer MUMB12345E. Rs 12,200 remains unmatched in Q4 return.",
                "TDS_MISMATCH",
                Decimal("12200.00")
            ),
            (
                "Section 80C Investment Ceiling Overflow",
                "info",
                "Client submitted total 80C proofs worth Rs 2,10,000 (EPF Rs 1,20,000, PPF Rs 50,000, ELSS Rs 40,000). Capped at statutory limit of Rs 1,50,000.",
                "SECTION_80C_CAP",
                Decimal("60000.00")
            ),
            (
                "New Tax Regime Recommendation (FY 2025-26)",
                "info",
                "Under Finance Act 2025, New Regime with standard deduction Rs 75,000 and revised slab rates saves Rs 18,400 compared to Old Regime with 80C deductions.",
                "REGIME_OPTIMIZATION",
                Decimal("18400.00")
            )
        ]
        
        for title, sev, desc, code, impact in findings_data:
            f = Finding(
                id=uuid.uuid4(),
                firm_id=firm_id,
                client_id=primary_client.id,
                tax_computation_id=tax_comp.id,
                title=title,
                severity=sev,
                description=desc,
                rule_code=code,
                impact_amount=impact,
                is_resolved=False,
                created_by_actor_type="ai_agent"
            )
            session.add(f)
        await session.flush()
        
        # 8. Create Review Task & Completed Signoff
        review_task = ReviewTask(
            id=uuid.uuid4(),
            firm_id=firm_id,
            client_id=primary_client.id,
            task_type="tax_computation_review",
            assigned_to=user_staff_id,
            status="in_review",
            priority="high",
            title="Review AY 2026-27 Computation for Vikram Malhotra",
            description="Verify TDS mismatch resolution and validate New Regime selection before signoff."
        )
        session.add(review_task)
        await session.flush()
        
        # Signoff snapshot
        snapshot_payload = f"Snapshot of TaxComputation {tax_comp.id} signed by Rajesh Sharma on 2026-10-04".encode()
        snapshot_hash = hashlib.sha256(snapshot_payload).hexdigest()
        
        signoff = Signoff(
            id=uuid.uuid4(),
            firm_id=firm_id,
            client_id=primary_client.id,
            tax_computation_id=tax_comp.id,
            signed_by=user_owner_id,
            signoff_level="partner",
            snapshot_sha256=snapshot_hash,
            comments="Verified against Form 16 Part A and bank statements. New regime calculation verified.",
            status="signed"
        )
        session.add(signoff)
        await session.flush()
        
        # Record Audit Log Entries using audit service
        await record_audit_entry(
            session=session,
            firm_id=firm_id,
            actor_id=user_owner_id,
            actor_type="ca",
            action="signoff_completed",
            entity_type="signoff",
            entity_id=signoff.id,
            after_state={
                "status": "signed",
                "tax_computation_id": str(tax_comp.id),
                "snapshot_sha256": snapshot_hash
            }
        )
        
        await session.commit()
        print("CAdesk Database successfully seeded with demo firm, 12 clients, ruleset, documents, computations, and signoff!")

if __name__ == "__main__":
    asyncio.run(seed())
