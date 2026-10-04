/**
 * Versioned Tax Rules Configuration
 * Keyed by Financial Year (e.g. "2025-26")
 * Supports section remapping and legal citation references.
 */

export interface TaxSlab {
  min: number;
  max: number | null; // null represents Infinity
  rate: number; // e.g. 0.05 for 5%
}

export interface TaxDeductionRule {
  section: string;
  name: string;
  maxLimit: number;
  description: string;
  eligibleUnderOld: boolean;
  eligibleUnderNew: boolean;
  citationDate: string;
}

export interface FYTaxRuleSet {
  financialYear: string;
  assessmentYear: string;
  rulesAsOf: string;
  legalNotice: string;
  cessRate: number; // e.g. 0.04 (4% Health & Education Cess)
  newRegime: {
    slabs: TaxSlab[];
    standardDeduction: number;
    rebate87ALimit: number; // income up to which rebate applies
    rebate87AMax: number;
    familyPensionDeductionMax?: number;
    employerNpsDeductionSection: string; // 80CCD(2)
  };
  oldRegime: {
    slabs: TaxSlab[];
    standardDeduction: number;
    rebate87ALimit: number;
    rebate87AMax: number;
    section80CLimit: number;
    section80CCD1BLimit: number; // NPS self contribution
    section24bLimit: number; // Self-occupied home loan interest
    section80DLimitSelf: number;
    section80DLimitParents: number;
  };
  sectionRemapping: Record<string, string>;
  commonDeductions: TaxDeductionRule[];
}

export const TAX_RULES_CONFIG: Record<string, FYTaxRuleSet> = {
  '2025-26': {
    financialYear: '2025-26',
    assessmentYear: '2026-27',
    rulesAsOf: 'Union Budget 2025 & CBDT Notifications as of Oct 2026',
    legalNotice:
      'Verified against FY 2025-26 individual resident tax provisions. Note: The Income-tax Act amendments change certain section numbering from FY 2026-27; verify citations prior to filing.',
    cessRate: 0.04,
    newRegime: {
      // 0-4L: Nil, 4-8L: 5%, 8-12L: 10%, 12-16L: 15%, 16-20L: 20%, 20-24L: 25%, above 24L: 30%
      slabs: [
        { min: 0, max: 400000, rate: 0.0 },
        { min: 400000, max: 800000, rate: 0.05 },
        { min: 800000, max: 1200000, rate: 0.1 },
        { min: 1200000, max: 1600000, rate: 0.15 },
        { min: 1600000, max: 2000000, rate: 0.2 },
        { min: 2000000, max: 2400000, rate: 0.25 },
        { min: 2400000, max: null, rate: 0.3 },
      ],
      standardDeduction: 75000,
      rebate87ALimit: 1200000, // Income up to 12L effectively zero tax under new regime
      rebate87AMax: 60000,
      familyPensionDeductionMax: 25000,
      employerNpsDeductionSection: '80CCD(2)',
    },
    oldRegime: {
      // 0-2.5L: Nil, 2.5-5L: 5%, 5-10L: 20%, above 10L: 30%
      slabs: [
        { min: 0, max: 250000, rate: 0.0 },
        { min: 250000, max: 500000, rate: 0.05 },
        { min: 500000, max: 1000000, rate: 0.2 },
        { min: 1000000, max: null, rate: 0.3 },
      ],
      standardDeduction: 50000,
      rebate87ALimit: 500000,
      rebate87AMax: 12500,
      section80CLimit: 150000,
      section80CCD1BLimit: 50000,
      section24bLimit: 200000,
      section80DLimitSelf: 25000,
      section80DLimitParents: 50000,
    },
    sectionRemapping: {
      '80C': 'Sec 80C (Life Ins, ELSS, EPF, PPF)',
      '80D': 'Sec 80D (Health Insurance Premium)',
      '80CCD(1B)': 'Sec 80CCD(1B) (National Pension Scheme - Tier 1)',
      '80CCD(2)': 'Sec 80CCD(2) (Employer NPS Contribution)',
      '24(b)': 'Sec 24(b) (Interest on Housing Loan)',
      '10(13A)': 'Sec 10(13A) (House Rent Allowance Exemption)',
      '87A': 'Sec 87A (Tax Rebate)',
      '112A': 'Sec 112A (LTCG on Listed Equity above 1.25L @ 12.5%)',
      '111A': 'Sec 111A (STCG on Listed Equity @ 20%)',
    },
    commonDeductions: [
      {
        section: '80C',
        name: 'PPF, EPF, ELSS, Life Insurance',
        maxLimit: 150000,
        description: 'Deduction for investments in EPF, PPF, ELSS mutual funds, and principal loan repayment.',
        eligibleUnderOld: true,
        eligibleUnderNew: false,
        citationDate: 'CBDT circular 04/2025',
      },
      {
        section: '80CCD(1B)',
        name: 'National Pension System (Self)',
        maxLimit: 50000,
        description: 'Additional exclusive deduction for voluntary contribution to NPS Tier-I.',
        eligibleUnderOld: true,
        eligibleUnderNew: false,
        citationDate: 'Finance Act Sec 80CCD(1B)',
      },
      {
        section: '80CCD(2)',
        name: 'Employer NPS Contribution',
        maxLimit: 200000, // up to 14% of salary for Central Gov / 10% for Private
        description: 'Employer contribution to NPS allowed under BOTH Old and New Tax Regimes.',
        eligibleUnderOld: true,
        eligibleUnderNew: true,
        citationDate: 'Finance (No. 2) Act 2024 / FY25-26',
      },
      {
        section: '80D',
        name: 'Health Insurance Premium',
        maxLimit: 75000, // 25k self + 50k senior parents
        description: 'Mediclaim for self, family (up to 25k) and senior citizen parents (up to 50k).',
        eligibleUnderOld: true,
        eligibleUnderNew: false,
        citationDate: 'Sec 80D ITA 1961',
      },
      {
        section: '24(b)',
        name: 'Home Loan Interest (Self-Occupied)',
        maxLimit: 200000,
        description: 'Interest paid on housing loan for acquisition or construction of self-occupied property.',
        eligibleUnderOld: true,
        eligibleUnderNew: false,
        citationDate: 'Sec 24(b) ITA 1961',
      },
      {
        section: '10(13A)',
        name: 'House Rent Allowance (HRA)',
        maxLimit: 500000,
        description: 'Least of actual HRA received, 50%/40% of salary, or rent paid excess of 10% of basic.',
        eligibleUnderOld: true,
        eligibleUnderNew: false,
        citationDate: 'Rule 2A of IT Rules 1962',
      },
    ],
  },
};

export const DEFAULT_FINANCIAL_YEAR = '2025-26';
