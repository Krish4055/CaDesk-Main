/**
 * CAdesk Deterministic Tax Calculation Engine
 * Compliant with Income-tax Act provisions for FY 2025-26 (AY 2026-27).
 * All computations are purely mathematical and deterministic.
 * HARD RULE: LLMs never calculate tax liabilities.
 */

import { FYTaxRuleSet, TAX_RULES_CONFIG, DEFAULT_FINANCIAL_YEAR } from '../config/taxRules';

export interface TaxInputs {
  financialYear?: string;
  grossSalary: number;
  basicSalary?: number;
  hraReceived?: number;
  rentPaidAnnual?: number;
  isMetro?: boolean;
  professionalTax?: number;
  section80C?: number;
  section80D?: number;
  section80DSelf?: number;
  section80DParents?: number;
  section80CCD1B?: number;
  section80CCD2?: number;
  employerNps?: number;
  homeLoanInterest24b?: number;
  otherIncome?: number;
  interestSavings?: number;
  interestFd?: number;
  dividend?: number;
  shortTermCapitalGains?: number; // u/s 111A @ 20%
  longTermCapitalGains?: number; // u/s 112A @ 12.5% on gains > 1,25,000
  tdsCredit?: number;

  // Snake_case aliases for direct JSON mapper compatibility
  gross_salary?: number;
  basic?: number;
  hra?: number;
  rent_paid?: number;
  metro?: boolean;
  professional_tax?: number;
  employer_nps?: number;
  interest_savings?: number;
  interest_fd?: number;
  stcg_111a?: number;
  ltcg_112a?: number;
  sec80c?: number;
  d_self?: number;
  d_parents?: number;
  nps_1b?: number;
  other_income?: number;
}

export interface SlabBreakdown {
  slab: string;
  ratePercent: number;
  taxableInSlab: number;
  taxAmount: number;
}

export interface RegimeComputation {
  regime: 'old' | 'new';
  salary_income: number;
  hra_exemption: number;
  standard_deduction: number;
  professional_tax: number;
  other_income: number;
  chapter_VIA: Record<string, number>;
  total_deductions: number;
  normal_taxable_income: number;
  stcg_111a: number;
  ltcg_112a_taxable: number;
  total_income: number;
  tax_on_normal: number;
  tax_stcg: number;
  tax_ltcg: number;
  rebate_87A: number;
  marginal_relief: number;
  tax_before_cess: number;
  cess: number;
  total_tax: number;

  // Backwards compatibility aliases for existing UI components
  grossTotalIncome: number;
  standardDeduction: number;
  hraExemption: number;
  totalDeductions: number;
  deductionBreakdown: {
    name: string;
    section: string;
    claimed: number;
    allowed: number;
  }[];
  netTaxableIncome: number;
  slabTax: number;
  slabBreakdown: SlabBreakdown[];
  rebate87A: number;
  taxAfterRebate: number;
  capitalGainsTax: number;
  surcharge: number;
  totalTaxLiability: number;
  effectiveTaxRate: number;
}

export interface MissedDeduction {
  section: string;
  title: string;
  potentialSavingOld: number;
  potentialSavingNew: number;
  maxEligibleAdditional: number;
  reasoning: string;
  citation: string;
  citationDate: string;
}

export interface TaxComparisonResult {
  new: RegimeComputation;
  old: RegimeComputation;
  recommended: 'old' | 'new' | 'equal';
  savings: number;
  tds_credit: number;
  net_payable_or_refund: number;

  // Backwards compatibility fields for existing UI components
  financialYear: string;
  rulesAsOf: string;
  legalNotice: string;
  inputs: TaxInputs;
  oldRegime: RegimeComputation;
  newRegime: RegimeComputation;
  betterRegime: 'old' | 'new' | 'equal';
  taxDifference: number;
  taxSaved: number;
  missedDeductions: MissedDeduction[];
  timestamp: string;
}

/**
 * Calculates HRA Exemption under Sec 10(13A) & Rule 2A
 * Minimum of:
 * 1. Actual HRA received
 * 2. 50% of basic (Metro) or 40% (Non-metro)
 * 3. Rent paid minus 10% of basic salary
 */
export function calculateHRAExemption(
  basicSalary: number,
  hraReceived: number,
  rentPaidAnnual: number,
  isMetro: boolean = true
): number {
  if (rentPaidAnnual <= 0 || hraReceived <= 0 || basicSalary <= 0) {
    return 0;
  }
  const metroFactor = isMetro ? 0.5 : 0.4;
  const salaryPercent = basicSalary * metroFactor;
  const rentMinusTenPercent = Math.max(0, rentPaidAnnual - basicSalary * 0.1);

  const exemption = Math.min(hraReceived, salaryPercent, rentMinusTenPercent);
  return Math.round(Math.max(0, exemption));
}

/**
 * Computes progressive slab tax
 */
export function computeSlabTax(
  taxableIncome: number,
  slabs: { min: number; max: number | null; rate: number }[]
): { slabTax: number; breakdown: SlabBreakdown[] } {
  let slabTax = 0;
  const breakdown: SlabBreakdown[] = [];

  for (const slab of slabs) {
    if (taxableIncome <= slab.min) {
      break;
    }

    const upperLimit = slab.max !== null ? slab.max : taxableIncome;
    const taxableInThisSlab = Math.max(0, Math.min(taxableIncome, upperLimit) - slab.min);

    if (taxableInThisSlab > 0) {
      const taxForSlab = taxableInThisSlab * slab.rate;
      slabTax += taxForSlab;

      const slabLabel =
        slab.max !== null
          ? `₹${(slab.min / 100000).toFixed(1)}L - ₹${(slab.max / 100000).toFixed(1)}L`
          : `Above ₹${(slab.min / 100000).toFixed(1)}L`;

      breakdown.push({
        slab: slabLabel,
        ratePercent: Math.round(slab.rate * 100),
        taxableInSlab: Math.round(taxableInThisSlab),
        taxAmount: Math.round(taxForSlab),
      });
    }
  }

  return { slabTax: Math.round(slabTax), breakdown };
}

/**
 * Statutory single-regime tax computation function (pure math, FY 2025-26)
 */
export function compute(inputs: TaxInputs, regime: 'new' | 'old'): RegimeComputation {
  const sal = inputs.gross_salary ?? inputs.grossSalary ?? 0;
  const basic = inputs.basic ?? inputs.basicSalary ?? Math.round(sal * 0.5);
  const isMetro = inputs.metro ?? inputs.isMetro ?? true;

  const specificOther =
    (inputs.interest_savings ?? inputs.interestSavings ?? 0) +
    (inputs.interest_fd ?? inputs.interestFd ?? 0) +
    (inputs.dividend ?? 0);
  const generalOther =
    inputs.other_income ??
    (inputs.otherIncome !== undefined && inputs.otherIncome !== specificOther ? inputs.otherIncome : 0);
  const other = specificOther + generalOther;

  const stcg = inputs.stcg_111a ?? inputs.shortTermCapitalGains ?? 0;
  const ltcg = inputs.ltcg_112a ?? inputs.longTermCapitalGains ?? 0;
  const ltcg_taxable = Math.max(0, ltcg - 125000);

  const ded: Record<string, number> = {};
  let std = 0;
  let hra = 0;
  let pt = 0;

  if (regime === 'new') {
    std = Math.min(sal, 75000);
    hra = 0;
    pt = 0;
    const employerNpsClaimed = inputs.employer_nps ?? inputs.section80CCD2 ?? 0;
    ded['80CCD(2)'] = Math.min(employerNpsClaimed, Math.round(0.1 * basic));
  } else {
    std = Math.min(sal, 50000);
    const hraClaimed = inputs.hra ?? inputs.hraReceived ?? 0;
    const rentPaidClaimed = inputs.rent_paid ?? inputs.rentPaidAnnual ?? 0;
    hra = calculateHRAExemption(basic, hraClaimed, rentPaidClaimed, isMetro);
    pt = inputs.professional_tax ?? inputs.professionalTax ?? 0;

    const sec80cClaimed = inputs.sec80c ?? inputs.section80C ?? 0;
    ded['80C'] = Math.min(150000, sec80cClaimed);

    const dSelf = inputs.d_self ?? inputs.section80DSelf ?? (inputs.section80D ? Math.min(inputs.section80D, 25000) : 0);
    const dParents = inputs.d_parents ?? inputs.section80DParents ?? (inputs.section80D ? Math.max(0, inputs.section80D - 25000) : 0);
    ded['80D'] = Math.min(25000, dSelf) + Math.min(50000, dParents);

    const nps1bClaimed = inputs.nps_1b ?? inputs.section80CCD1B ?? 0;
    ded['80CCD(1B)'] = Math.min(50000, nps1bClaimed);

    const employerNpsClaimed = inputs.employer_nps ?? inputs.section80CCD2 ?? 0;
    ded['80CCD(2)'] = Math.min(employerNpsClaimed, Math.round(0.1 * basic));

    const savingsInterestClaimed = inputs.interest_savings ?? inputs.interestSavings ?? 0;
    ded['80TTA'] = Math.min(10000, savingsInterestClaimed);
  }

  const salary_income = Math.max(0, sal - hra - std - pt);
  const other_income = other;
  const gross_total_normal = salary_income + other_income;
  const total_ded = Object.values(ded).reduce((acc, v) => acc + v, 0);
  const normal_taxable_income = Math.max(0, gross_total_normal - total_ded);
  const total_income = normal_taxable_income + stcg + ltcg_taxable;

  // Slab definition
  const newSlabs = [
    { min: 0, max: 400000, rate: 0.0 },
    { min: 400000, max: 800000, rate: 0.05 },
    { min: 800000, max: 1200000, rate: 0.1 },
    { min: 1200000, max: 1600000, rate: 0.15 },
    { min: 1600000, max: 2000000, rate: 0.2 },
    { min: 2000000, max: 2400000, rate: 0.25 },
    { min: 2400000, max: null, rate: 0.3 },
  ];

  const oldSlabs = [
    { min: 0, max: 250000, rate: 0.0 },
    { min: 250000, max: 500000, rate: 0.05 },
    { min: 500000, max: 1000000, rate: 0.2 },
    { min: 1000000, max: null, rate: 0.3 },
  ];

  const activeSlabs = regime === 'new' ? newSlabs : oldSlabs;
  const slabCalc = computeSlabTax(normal_taxable_income, activeSlabs);
  const base = slabCalc.slabTax;

  const t_stcg = Math.round(0.2 * stcg);
  const t_ltcg = Math.round(0.125 * ltcg_taxable);

  // Section 87A rebate (does not apply against 111A/112A special rate tax)
  let rebate_87A = 0;
  if (regime === 'new' && total_income <= 1200000) {
    rebate_87A = Math.min(base, 60000);
  }
  if (regime === 'old' && total_income <= 500000) {
    rebate_87A = Math.min(base, 12500);
  }

  // Section 87A marginal relief in New Regime above 12L
  let marginal_relief = 0;
  if (regime === 'new' && total_income > 1200000) {
    const limit = total_income - 1200000;
    const gross_tax = base + t_stcg + t_ltcg;
    if (gross_tax > limit) {
      marginal_relief = Math.max(0, gross_tax - limit);
    }
  }

  const base_after = Math.max(0, base - rebate_87A - marginal_relief);
  const tax_before_cess = base_after + t_stcg + t_ltcg;
  const cess = Math.round(0.04 * tax_before_cess);
  const total_tax = tax_before_cess + cess;

  // Build deduction breakdown items for UI
  const deductionBreakdown = Object.entries(ded).map(([name, allowed]) => ({
    name: name === '80C' ? 'Investments (80C)' : name === '80D' ? 'Health Insurance (80D)' : name,
    section: `Sec ${name}`,
    claimed: allowed,
    allowed,
  }));
  if (std > 0) {
    deductionBreakdown.unshift({
      name: 'Standard Deduction',
      section: 'Sec 16(ia)',
      claimed: std,
      allowed: std,
    });
  }
  if (hra > 0) {
    deductionBreakdown.push({
      name: 'House Rent Allowance (HRA)',
      section: 'Sec 10(13A)',
      claimed: hra,
      allowed: hra,
    });
  }
  if (pt > 0) {
    deductionBreakdown.push({
      name: 'Professional Tax',
      section: 'Sec 16(iii)',
      claimed: pt,
      allowed: pt,
    });
  }

  return {
    regime,
    salary_income,
    hra_exemption: hra,
    standard_deduction: std,
    professional_tax: pt,
    other_income,
    chapter_VIA: ded,
    total_deductions: total_ded,
    normal_taxable_income,
    stcg_111a: stcg,
    ltcg_112a_taxable: ltcg_taxable,
    total_income,
    tax_on_normal: base,
    tax_stcg: t_stcg,
    tax_ltcg: t_ltcg,
    rebate_87A,
    marginal_relief,
    tax_before_cess,
    cess,
    total_tax,

    // UI compatibility fields
    grossTotalIncome: sal + other_income,
    standardDeduction: std,
    hraExemption: hra,
    totalDeductions: std + hra + pt + total_ded,
    deductionBreakdown,
    netTaxableIncome: normal_taxable_income,
    slabTax: base,
    slabBreakdown: slabCalc.breakdown,
    rebate87A: rebate_87A,
    taxAfterRebate: base_after,
    capitalGainsTax: t_stcg + t_ltcg,
    surcharge: 0,
    totalTaxLiability: total_tax,
    effectiveTaxRate: sal + other_income > 0 ? Number(((total_tax / (sal + other_income)) * 100).toFixed(2)) : 0,
  };
}

/**
 * Compare Old vs New Tax Regimes with full statutory grounding and TDS reconciliation
 */
export function compare(inputs: TaxInputs, tdsCredit: number = 0): TaxComparisonResult {
  const n = compute(inputs, 'new');
  const o = compute(inputs, 'old');

  const tds = tdsCredit || inputs.tdsCredit || 0;
  const best: 'new' | 'old' | 'equal' = n.total_tax < o.total_tax ? 'new' : o.total_tax < n.total_tax ? 'old' : 'equal';
  const chosen = best === 'old' ? o : n;
  const savings = Math.abs(n.total_tax - o.total_tax);
  const net_payable_or_refund = chosen.total_tax - tds;

  // Identify missed deductions for Old/New regime optimization tips
  const missedDeductions: MissedDeduction[] = [];
  const marginalTaxRateOld = o.normal_taxable_income > 1000000 ? 0.312 : o.normal_taxable_income > 500000 ? 0.208 : 0.052;

  const current80C = inputs.sec80c ?? inputs.section80C ?? 0;
  if (current80C < 150000) {
    const gap = 150000 - current80C;
    missedDeductions.push({
      section: '80C',
      title: 'Unexhausted Section 80C Limit',
      potentialSavingOld: Math.round(gap * marginalTaxRateOld),
      potentialSavingNew: 0,
      maxEligibleAdditional: gap,
      reasoning: `You claimed ₹${current80C.toLocaleString('en-IN')}, leaving ₹${gap.toLocaleString('en-IN')} unutilized in ELSS, PPF, or Principal Home Repayment.`,
      citation: 'Sec 80C Income-tax Act, 1961',
      citationDate: 'FY 2025-26',
    });
  }

  const currentNps1b = inputs.nps_1b ?? inputs.section80CCD1B ?? 0;
  if (currentNps1b < 50000) {
    const gap = 50000 - currentNps1b;
    missedDeductions.push({
      section: '80CCD(1B)',
      title: 'Additional NPS Contribution',
      potentialSavingOld: Math.round(gap * marginalTaxRateOld),
      potentialSavingNew: 0,
      maxEligibleAdditional: gap,
      reasoning: `Exclusive ₹${gap.toLocaleString('en-IN')} deduction available for voluntary Tier-1 NPS contribution beyond 80C limit.`,
      citation: 'Sec 80CCD(1B) ITA 1961',
      citationDate: 'FY 2025-26',
    });
  }

  const currentEmployerNps = inputs.employer_nps ?? inputs.section80CCD2 ?? 0;
  const sal = inputs.gross_salary ?? inputs.grossSalary ?? 0;
  const basic = inputs.basic ?? inputs.basicSalary ?? Math.round(sal * 0.5);
  if (currentEmployerNps === 0 && sal >= 800000) {
    const potential = Math.round(basic * 0.1);
    missedDeductions.push({
      section: '80CCD(2)',
      title: 'Employer Corporate NPS Restructuring',
      potentialSavingOld: Math.round(potential * marginalTaxRateOld),
      potentialSavingNew: Math.round(potential * 0.208),
      maxEligibleAdditional: potential,
      reasoning: 'Employer contribution up to 10% of Basic is exempt from tax under BOTH Old and New Tax Regimes under Sec 80CCD(2).',
      citation: 'Sec 80CCD(2) & Finance Act 2024',
      citationDate: 'FY 2025-26',
    });
  }

  return {
    new: n,
    old: o,
    recommended: best,
    savings,
    tds_credit: tds,
    net_payable_or_refund,

    // UI compatibility fields
    financialYear: inputs.financialYear || DEFAULT_FINANCIAL_YEAR,
    rulesAsOf: '01-Apr-2025 (Finance Act 2024)',
    legalNotice: 'Statutory decision-support calculation. Subject to Chartered Accountant verification.',
    inputs,
    oldRegime: o,
    newRegime: n,
    betterRegime: best,
    taxDifference: savings,
    taxSaved: savings,
    missedDeductions,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Backwards compatible alias for computeTaxComparison
 */
export function computeTaxComparison(inputs: TaxInputs): TaxComparisonResult {
  return compare(inputs, inputs.tdsCredit || 0);
}

/**
 * Currency formatter for Indian Rupees
 */
export function formatINR(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  const isNegative = val < 0;
  const absVal = Math.abs(Math.round(val));
  const formatted = absVal.toLocaleString('en-IN');
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Self-test suite verifying the deterministic engine against statutory benchmarks
 */
export function runTaxEngineUnitTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let allPassed = true;

  const test1 = compute({ grossSalary: 1200000, basicSalary: 600000 }, 'new');
  const t1Pass = test1.total_tax === 0;
  if (!t1Pass) allPassed = false;
  results.push(`Test 1 (New Regime 12L zero tax): ${t1Pass ? 'PASSED' : `FAILED (${test1.total_tax})`}`);

  const test2 = compute({ grossSalary: 1200000, basicSalary: 600000 }, 'new');
  const t2Pass = test2.standard_deduction === 75000;
  if (!t2Pass) allPassed = false;
  results.push(`Test 2 (New Regime std deduction = 75k): ${t2Pass ? 'PASSED' : 'FAILED'}`);

  const test3 = compute({ grossSalary: 1200000, basicSalary: 600000 }, 'old');
  const t3Pass = test3.standard_deduction === 50000;
  if (!t3Pass) allPassed = false;
  results.push(`Test 3 (Old Regime std deduction = 50k): ${t3Pass ? 'PASSED' : 'FAILED'}`);

  const hraEx = calculateHRAExemption(600000, 240000, 300000, true);
  const t4Pass = hraEx === 240000;
  if (!t4Pass) allPassed = false;
  results.push(`Test 4 (HRA Exemption calculation): ${t4Pass ? 'PASSED' : `FAILED (${hraEx})`}`);

  return { passed: allPassed, results };
}
