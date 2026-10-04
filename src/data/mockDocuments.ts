/**
 * Realistic Document Vault Mock Data
 * Includes full field extractions, OCR snippets, confidence scores, and low-confidence flags.
 */

import { DocumentItem } from '../types';

export const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-001',
    clientId: 'ind-arjun',
    fileName: 'Form16_PartB_TechCorp_FY2526.pdf',
    fileSize: '1.4 MB',
    category: 'form16',
    uploadDate: '2026-09-28',
    status: 'extracted',
    overallConfidence: 96,
    ocrTextPreview: `FORM NO. 16 [See rule 31(1)(a)]
Certificate under section 203 of the Income-tax Act, 1961 for tax deducted at source on salary
Employer: TechCorp Solutions India Pvt Ltd, TAN: BLRT09182A
Employee: Arjun Sharma, PAN: ABCPS1234F
Assessment Year: 2026-27 | Period: 01-Apr-2025 to 31-Mar-2026
Gross Salary under section 17(1): ₹28,50,000
Total deductions under Chapter VI-A: ₹2,25,000
Tax Deducted at Source (TDS): ₹4,12,400`,
    aiNotes: 'Clean digital Form 16 Part A & B. Employer TAN verified against NSDL portal.',
    extractedFields: [
      {
        id: 'f-1',
        key: 'gross_salary_17_1',
        label: 'Gross Salary u/s 17(1)',
        value: 2850000,
        confidence: 99,
        needsReview: false,
        sectionReference: 'Sec 17(1)',
        sourceSnippet: 'Gross Salary under section 17(1): ₹28,50,000',
      },
      {
        id: 'f-2',
        key: 'tds_deducted',
        label: 'Total TDS Deposited',
        value: 412400,
        confidence: 98,
        needsReview: false,
        sectionReference: 'Sec 192',
        sourceSnippet: 'Tax Deducted at Source (TDS): ₹4,12,400',
      },
      {
        id: 'f-3',
        key: 'employer_tan',
        label: 'Employer TAN',
        value: 'BLRT09182A',
        confidence: 99,
        needsReview: false,
        sectionReference: 'Sec 203',
        sourceSnippet: 'TAN: BLRT09182A',
      },
      {
        id: 'f-4',
        key: 'employer_nps',
        label: 'Employer NPS Contribution',
        value: 142500,
        confidence: 76,
        needsReview: true,
        sectionReference: 'Sec 80CCD(2)',
        sourceSnippet: 'Contribution to pension scheme u/s 80CCD(2): ₹1,42,500 (approx handwriting note)',
      },
    ],
  },
  {
    id: 'doc-002',
    clientId: 'ind-arjun',
    fileName: 'HDFC_HomeLoan_Interest_Certificate_2025_26.pdf',
    fileSize: '820 KB',
    category: 'loans',
    uploadDate: '2026-09-30',
    status: 'needs_review',
    overallConfidence: 74,
    ocrTextPreview: `HDFC BANK HOME LOANS - PROVISIONAL CERTIFICATE FOR TAX PURPOSES
Loan Account No: 6291882001 | Customer: Arjun Sharma
Property Address: Flat 402, Green Meadows, Bellandur, Bengaluru
Interest payable (01/04/2025 - 31/03/2026): ₹1,95,420
Principal Repayment expected: ₹1,12,800
Note: Property is co-owned with spouse. Share proportion: Unspecified`,
    aiNotes: 'Low confidence on co-ownership share allocation. Requires verification whether interest is 100% or 50% claimable.',
    extractedFields: [
      {
        id: 'f-5',
        key: 'home_loan_interest',
        label: 'Housing Loan Interest (Sec 24b)',
        value: 195420,
        confidence: 95,
        needsReview: false,
        sectionReference: 'Sec 24(b)',
        sourceSnippet: 'Interest payable: ₹1,95,420',
      },
      {
        id: 'f-6',
        key: 'principal_repayment',
        label: 'Principal Repayment (Sec 80C)',
        value: 112800,
        confidence: 94,
        needsReview: false,
        sectionReference: 'Sec 80C',
        sourceSnippet: 'Principal Repayment expected: ₹1,12,800',
      },
      {
        id: 'f-7',
        key: 'co_ownership_share',
        label: 'Co-Ownership Ownership %',
        value: '100% (Default - needs signoff)',
        confidence: 58,
        needsReview: true,
        sectionReference: 'Sec 26',
        sourceSnippet: 'Property is co-owned with spouse. Share proportion: Unspecified',
      },
    ],
  },
  {
    id: 'doc-003',
    clientId: 'ind-arjun',
    fileName: 'CAMS_Consolidated_Mutual_Fund_LTCG_FY26.pdf',
    fileSize: '2.1 MB',
    category: 'investments',
    uploadDate: '2026-10-01',
    status: 'verified',
    overallConfidence: 97,
    ocrTextPreview: `COMPUTER AGE MANAGEMENT SERVICES LTD (CAMS)
Realised Capital Gain / Loss Statement for FY 2025-26
Investor: Arjun Sharma | PAN: ABCPS1234F
Equity Oriented Schemes:
Short Term Capital Gains (Sec 111A): ₹45,200
Long Term Capital Gains (Sec 112A): ₹1,80,450
LTCG Grandfathering fair value as of 31-Jan-2018 applied where applicable.`,
    aiNotes: 'Consolidated capital gains statement. Grandfathered NAV u/s 112A verified with AMFI database.',
    extractedFields: [
      {
        id: 'f-8',
        key: 'stcg_equity',
        label: 'STCG u/s 111A (20%)',
        value: 45200,
        confidence: 98,
        needsReview: false,
        sectionReference: 'Sec 111A',
        sourceSnippet: 'Short Term Capital Gains (Sec 111A): ₹45,200',
      },
      {
        id: 'f-9',
        key: 'ltcg_equity',
        label: 'LTCG u/s 112A (12.5% > 1.25L)',
        value: 180450,
        confidence: 99,
        needsReview: false,
        sectionReference: 'Sec 112A',
        sourceSnippet: 'Long Term Capital Gains (Sec 112A): ₹1,80,450',
      },
    ],
  },
  {
    id: 'doc-004',
    clientId: 'ind-arjun',
    fileName: 'HDFC_ERGO_Health_Insurance_Premium_Receipt.pdf',
    fileSize: '450 KB',
    category: 'insurance',
    uploadDate: '2026-10-02',
    status: 'verified',
    overallConfidence: 99,
    ocrTextPreview: `HDFC ERGO GENERAL INSURANCE COMPANY
Premium Certificate for Income Tax Exemption u/s 80D
Policy No: 2812009182390 | Policyholder: Arjun Sharma
Insured Members: Arjun Sharma (Self, 36), Meenakshi Sharma (Spouse, 34), Kabir (Son, 6)
Gross Premium Paid: ₹25,000 (Excluding GST)
Preventive Health Checkup Component: ₹3,500`,
    aiNotes: 'Mediclaim premium receipt. Clean Sec 80D eligible amount.',
    extractedFields: [
      {
        id: 'f-10',
        key: 'sec_80d_health_premium',
        label: 'Health Insurance Premium',
        value: 25000,
        confidence: 99,
        needsReview: false,
        sectionReference: 'Sec 80D',
        sourceSnippet: 'Gross Premium Paid: ₹25,000 (Excluding GST)',
      },
    ],
  },
  {
    id: 'doc-005',
    clientId: 'ind-arjun',
    fileName: 'ICICI_Salary_Bank_Statement_Apr25_Mar26.pdf',
    fileSize: '3.6 MB',
    category: 'bank_statements',
    uploadDate: '2026-10-02',
    status: 'classified',
    overallConfidence: 91,
    ocrTextPreview: `ICICI BANK STATEMENT OF ACCOUNT - A/c No: 002901591822
Monthly Net Salary Credits: ₹1,78,200 avg
Quarterly Savings Account Interest: ₹14,200 total (Eligible u/s 80TTA up to 10k in Old Regime)
Rent Debits: ₹40,000 / month to Beneficiary "Sunil Mehta"`,
    aiNotes: 'Bank statement categorized. Detected regular monthly rent debits to Sunil Mehta.',
    extractedFields: [
      {
        id: 'f-11',
        key: 'savings_interest',
        label: 'Savings Bank Interest',
        value: 14200,
        confidence: 94,
        needsReview: false,
        sectionReference: 'Sec 80TTA',
        sourceSnippet: 'Savings Account Interest: ₹14,200 total',
      },
      {
        id: 'f-12',
        key: 'annual_rent_paid',
        label: 'Annual Rent Transferred',
        value: 480000,
        confidence: 88,
        needsReview: true,
        sectionReference: 'Sec 10(13A)',
        sourceSnippet: 'Rent Debits: ₹40,000 / month to Beneficiary "Sunil Mehta"',
      },
    ],
  },
];
