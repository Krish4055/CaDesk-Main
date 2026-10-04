/**
 * CAdesk Deterministic Tax Calculation Engine
 * Compliant with Income-tax Act provisions for FY 2025-26.
 * All computations are purely mathematical and deterministic.
 */

import { FYTaxRuleSet, TAX_RULES_CONFIG, DEFAULT_FINANCIAL_YEAR } from '../config/taxRules';

export interface TaxInputs {
  financialYear?: string;
  grossSalary: number;
  basicSalary?: number; // Defaults to ~40-50% of gross if not specified
  hraReceived?: number;
  rentPaidAnnual?: number;
  isMetro?: boolean; // 50% for metro (Delhi, Mumbai, Kolkata, Chennai), 40% non-metro
  section80C?: number;
  section80D?: number;
  section80CCD1B?: number; // NPS self
  section80CCD2?: number; // NPS employer
  homeLoanInterest24b?: number;
  otherIncome?: number; // Savings interest, FD, dividend
  shortTermCapitalGains?: number; // @ 20% u/s 111A
  longTermCapitalGains?: number; // @ 12.5% u/s 112A
}

export interface SlabBreakdown {
  slab: string;
  ratePercent: number;
  taxableInSlab: number;
  taxAmount: number;
}

export interface RegimeComputation {
  regime: 'old' | 'new';
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
  cess: number;
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
  financialYear: string;
  rulesAsOf: string;
  legalNotice: string;
  inputs: TaxInputs;
  oldRegime: RegimeComputation;
  newRegime: RegimeComputation;
  betterRegime: 'old' | 'new' | 'equal';
  taxDifference: number; // positive means savings choosing better regime
  taxSaved: number;
  missedDeductions: MissedDeduction[];
  timestamp: string;
}

/**
 * Calculates HRA Exemption under Sec 10(13A)
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
 * Computes tax through progressive tax slabs
 */
function computeSlabTax(
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
 * Primary deterministic calculation engine
 */
export function computeTaxComparison(inputs: TaxInputs): TaxComparisonResult {
  const fy = inputs.financialYear || DEFAULT_FINANCIAL_YEAR;
  const ruleSet: FYTaxRuleSet = TAX_RULES_CONFIG[fy] || TAX_RULES_CONFIG[DEFAULT_FINANCIAL_YEAR];

  const grossSalary = Math.max(0, inputs.grossSalary || 0);
  const basicSalary = inputs.basicSalary ?? Math.round(grossSalary * 0.5);
  const hraReceived = Math.max(0, inputs.hraReceived || 0);
  const rentPaid = Math.max(0, inputs.rentPaidAnnual || 0);
  const otherIncome = Math.max(0, inputs.otherIncome || 0);

  // Capital gains:
  // Sec 111A STCG @ 20%
  // Sec 112A LTCG @ 12.5% on gains above 1,25,000 exemption
  const stcg = Math.max(0, inputs.shortTermCapitalGains || 0);
  const ltcg = Math.max(0, inputs.longTermCapitalGains || 0);
  const ltcgTaxable = Math.max(0, ltcg - 125000);
  const capitalGainsTax = Math.round(stcg * 0.2 + ltcgTaxable * 0.125);

  // ==========================================
  // 1. OLD REGIME COMPUTATION
  // ==========================================
  const hraExemption = calculateHRAExemption(basicSalary, hraReceived, rentPaid, inputs.isMetro ?? true);
  const oldStdDeduction = Math.min(grossSalary, ruleSet.oldRegime.standardDeduction);

  const sec80C = Math.min(Math.max(0, inputs.section80C || 0), ruleSet.oldRegime.section80CLimit);
  const sec80CCD1B = Math.min(Math.max(0, inputs.section80CCD1B || 0), ruleSet.oldRegime.section80CCD1BLimit);
  const sec80D = Math.min(Math.max(0, inputs.section80D || 0), ruleSet.oldRegime.section80DLimitSelf + ruleSet.oldRegime.section80DLimitParents);
  const sec24b = Math.min(Math.max(0, inputs.homeLoanInterest24b || 0), ruleSet.oldRegime.section24bLimit);
  const sec80CCD2 = Math.max(0, inputs.section80CCD2 || 0); // Employer NPS

  const oldDeductionBreakdown = [
    { name: 'Standard Deduction', section: 'Sec 16(ia)', claimed: ruleSet.oldRegime.standardDeduction, allowed: oldStdDeduction },
    { name: 'House Rent Allowance (HRA)', section: 'Sec 10(13A)', claimed: rentPaid > 0 ? hraReceived : 0, allowed: hraExemption },
    { name: 'Investments & Savings (EPF/PPF/ELSS)', section: 'Sec 80C', claimed: inputs.section80C || 0, allowed: sec80C },
    { name: 'NPS Voluntary Contribution', section: 'Sec 80CCD(1B)', claimed: inputs.section80CCD1B || 0, allowed: sec80CCD1B },
    { name: 'Medical Insurance Premium', section: 'Sec 80D', claimed: inputs.section80D || 0, allowed: sec80D },
    { name: 'Home Loan Interest (Self-occupied)', section: 'Sec 24(b)', claimed: inputs.homeLoanInterest24b || 0, allowed: sec24b },
    { name: 'Employer NPS Contribution', section: 'Sec 80CCD(2)', claimed: inputs.section80CCD2 || 0, allowed: sec80CCD2 },
  ].filter((d) => d.allowed > 0 || d.claimed > 0);

  const totalOldChapterVIA = sec80C + sec80CCD1B + sec80D + sec80CCD2;
  const totalOldDeductions = oldStdDeduction + hraExemption + sec24b + totalOldChapterVIA;

  const grossTotalOld = grossSalary + otherIncome;
  const netTaxableIncomeOld = Math.max(0, grossTotalOld - totalOldDeductions);

  const oldSlabRes = computeSlabTax(netTaxableIncomeOld, ruleSet.oldRegime.slabs);
  let oldRebate87A = 0;
  if (netTaxableIncomeOld <= ruleSet.oldRegime.rebate87ALimit) {
    oldRebate87A = Math.min(oldSlabRes.slabTax, ruleSet.oldRegime.rebate87AMax);
  }
  const oldTaxAfterRebate = Math.max(0, oldSlabRes.slabTax - oldRebate87A);
  const oldCess = Math.round((oldTaxAfterRebate + capitalGainsTax) * ruleSet.cessRate);
  const totalTaxLiabilityOld = oldTaxAfterRebate + capitalGainsTax + oldCess;

  const oldRegimeComp: RegimeComputation = {
    regime: 'old',
    grossTotalIncome: grossTotalOld,
    standardDeduction: oldStdDeduction,
    hraExemption,
    totalDeductions: totalOldDeductions,
    deductionBreakdown: oldDeductionBreakdown,
    netTaxableIncome: netTaxableIncomeOld,
    slabTax: oldSlabRes.slabTax,
    slabBreakdown: oldSlabRes.breakdown,
    rebate87A: oldRebate87A,
    taxAfterRebate: oldTaxAfterRebate,
    capitalGainsTax,
    surcharge: 0,
    cess: oldCess,
    totalTaxLiability: totalTaxLiabilityOld,
    effectiveTaxRate: grossTotalOld > 0 ? Number(((totalTaxLiabilityOld / grossTotalOld) * 100).toFixed(2)) : 0,
  };

  // ==========================================
  // 2. NEW REGIME COMPUTATION
  // ==========================================
  // New Regime allows Standard Deduction (75,000 for FY 25-26) + Employer NPS (80CCD(2))
  const newStdDeduction = Math.min(grossSalary, ruleSet.newRegime.standardDeduction);
  const newSec80CCD2 = Math.max(0, inputs.section80CCD2 || 0);

  const newDeductions = newStdDeduction + newSec80CCD2;
  const grossTotalNew = grossSalary + otherIncome;
  const netTaxableIncomeNew = Math.max(0, grossTotalNew - newDeductions);

  const newSlabRes = computeSlabTax(netTaxableIncomeNew, ruleSet.newRegime.slabs);

  // Under New Regime FY 2025-26:
  // Slabs: 0-4L nil, 4-8L 5% (20k), 8-12L 10% (40k). Total tax up to 12L is 60,000.
  // Full rebate under 87A for taxable income up to 12,00,000 makes tax NIL!
  let newRebate87A = 0;
  if (netTaxableIncomeNew <= ruleSet.newRegime.rebate87ALimit) {
    newRebate87A = Math.min(newSlabRes.slabTax, ruleSet.newRegime.rebate87AMax);
  }
  const newTaxAfterRebate = Math.max(0, newSlabRes.slabTax - newRebate87A);
  const newCess = Math.round((newTaxAfterRebate + capitalGainsTax) * ruleSet.cessRate);
  const totalTaxLiabilityNew = newTaxAfterRebate + capitalGainsTax + newCess;

  const newDeductionBreakdown = [
    { name: 'Standard Deduction', section: 'Sec 16(ia)', claimed: ruleSet.newRegime.standardDeduction, allowed: newStdDeduction },
    { name: 'Employer NPS Contribution', section: 'Sec 80CCD(2)', claimed: inputs.section80CCD2 || 0, allowed: newSec80CCD2 },
  ].filter((d) => d.allowed > 0);

  const newRegimeComp: RegimeComputation = {
    regime: 'new',
    grossTotalIncome: grossTotalNew,
    standardDeduction: newStdDeduction,
    hraExemption: 0,
    totalDeductions: newDeductions,
    deductionBreakdown: newDeductionBreakdown,
    netTaxableIncome: netTaxableIncomeNew,
    slabTax: newSlabRes.slabTax,
    slabBreakdown: newSlabRes.breakdown,
    rebate87A: newRebate87A,
    taxAfterRebate: newTaxAfterRebate,
    capitalGainsTax,
    surcharge: 0,
    cess: newCess,
    totalTaxLiability: totalTaxLiabilityNew,
    effectiveTaxRate: grossTotalNew > 0 ? Number(((totalTaxLiabilityNew / grossTotalNew) * 100).toFixed(2)) : 0,
  };

  // ==========================================
  // 3. COMPARISON & MISSED DEDUCTIONS
  // ==========================================
  let betterRegime: 'old' | 'new' | 'equal' = 'equal';
  let taxDifference = 0;

  if (totalTaxLiabilityOld < totalTaxLiabilityNew) {
    betterRegime = 'old';
    taxDifference = totalTaxLiabilityNew - totalTaxLiabilityOld;
  } else if (totalTaxLiabilityNew < totalTaxLiabilityOld) {
    betterRegime = 'new';
    taxDifference = totalTaxLiabilityOld - totalTaxLiabilityNew;
  }

  // Identify missed deductions
  const missedDeductions: MissedDeduction[] = [];
  const marginalTaxRateOld = netTaxableIncomeOld > 1000000 ? 0.312 : netTaxableIncomeOld > 500000 ? 0.208 : 0.052;

  // Check 80C gap
  const current80C = inputs.section80C || 0;
  if (current80C < ruleSet.oldRegime.section80CLimit) {
    const gap = ruleSet.oldRegime.section80CLimit - current80C;
    missedDeductions.push({
      section: '80C',
      title: 'Unexhausted Section 80C Limit',
      potentialSavingOld: Math.round(gap * marginalTaxRateOld),
      potentialSavingNew: 0,
      maxEligibleAdditional: gap,
      reasoning: `You claimed ₹${current80C.toLocaleString('en-IN')}, leaving ₹${gap.toLocaleString('en-IN')} unutilized in ELSS, PPF, or Principal Home Repayment.`,
      citation: 'Sec 80C Income-tax Act, 1961',
      citationDate: ruleSet.rulesAsOf,
    });
  }

  // Check 80CCD(1B) NPS gap
  const currentNps = inputs.section80CCD1B || 0;
  if (currentNps < ruleSet.oldRegime.section80CCD1BLimit) {
    const gap = ruleSet.oldRegime.section80CCD1BLimit - currentNps;
    missedDeductions.push({
      section: '80CCD(1B)',
      title: 'Additional NPS Contribution',
      potentialSavingOld: Math.round(gap * marginalTaxRateOld),
      potentialSavingNew: 0,
      maxEligibleAdditional: gap,
      reasoning: `Exclusive ₹${gap.toLocaleString('en-IN')} deduction available for voluntary Tier-1 NPS contribution beyond 80C limit.`,
      citation: 'Sec 80CCD(1B) ITA 1961',
      citationDate: ruleSet.rulesAsOf,
    });
  }

  // Check 80CCD(2) Employer NPS (allowed under both!)
  const currentEmployerNps = inputs.section80CCD2 || 0;
  if (currentEmployerNps === 0 && grossSalary >= 800000) {
    const potentialEmployerNps = Math.round(basicSalary * 0.1); // 10% of basic
    const marginalRate = netTaxableIncomeNew > 1600000 ? 0.25 : 0.15;
    missedDeductions.push({
      section: '80CCD(2)',
      title: 'Employer Corporate NPS Restructuring',
      potentialSavingOld: Math.round(potentialEmployerNps * marginalTaxRateOld),
      potentialSavingNew: Math.round(potentialEmployerNps * (marginalRate * 1.04)),
      maxEligibleAdditional: potentialEmployerNps,
      reasoning:
        'Employer contribution up to 10% of Basic+DA is exempt from tax under BOTH Old and New Tax Regimes with no ceiling cap under Sec 80CCD(2).',
      citation: 'Sec 80CCD(2) & Finance Act 2024',
      citationDate: ruleSet.rulesAsOf,
    });
  }

  // Check 80D Health Insurance
  const current80D = inputs.section80D || 0;
  if (current80D < 25000) {
    const gap = 25000 - current80D;
    missedDeductions.push({
      section: '80D',
      title: 'Health Insurance & Preventive Health Checkup',
      potentialSavingOld: Math.round(gap * marginalTaxRateOld),
      potentialSavingNew: 0,
      maxEligibleAdditional: gap,
      reasoning: `Health insurance premium for self and family allows deduction up to ₹25,000 including ₹5,000 for preventive health checkups.`,
      citation: 'Sec 80D ITA 1961',
      citationDate: ruleSet.rulesAsOf,
    });
  }

  // Check HRA declaration if renting but not claimed
  if ((inputs.hraReceived || 0) > 0 && (inputs.rentPaidAnnual || 0) === 0) {
    missedDeductions.push({
      section: '10(13A)',
      title: 'Unclaimed House Rent Allowance (HRA)',
      potentialSavingOld: Math.round(Math.min(inputs.hraReceived || 0, basicSalary * 0.4) * marginalTaxRateOld),
      potentialSavingNew: 0,
      maxEligibleAdditional: inputs.hraReceived || 0,
      reasoning: 'You receive HRA from your employer but have not submitted rent receipts or landlord PAN.',
      citation: 'Sec 10(13A) & Rule 2A',
      citationDate: ruleSet.rulesAsOf,
    });
  }

  return {
    financialYear: fy,
    rulesAsOf: ruleSet.rulesAsOf,
    legalNotice: ruleSet.legalNotice,
    inputs,
    oldRegime: oldRegimeComp,
    newRegime: newRegimeComp,
    betterRegime,
    taxDifference,
    taxSaved: taxDifference,
    missedDeductions,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Currency formatter for Indian Rupees (Lakhs / Crores)
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

  // Test 1: Salaried resident earning 12L under New Regime should have 0 tax (due to 75k std ded + 87A rebate)
  const test1 = computeTaxComparison({
    grossSalary: 1200000,
    basicSalary: 600000,
  });
  const t1Tax = test1.newRegime.totalTaxLiability;
  const t1Pass = t1Tax === 0;
  if (!t1Pass) allPassed = false;
  results.push(`Test 1 (New Regime 12L zero tax): ${t1Pass ? 'PASSED' : `FAILED (tax=${t1Tax})`}`);

  // Test 2: Standard deduction in New Regime FY 2025-26 should be 75,000
  const t2Pass = test1.newRegime.standardDeduction === 75000;
  if (!t2Pass) allPassed = false;
  results.push(`Test 2 (New Regime std deduction = 75k): ${t2Pass ? 'PASSED' : 'FAILED'}`);

  // Test 3: Old Regime standard deduction should be 50,000
  const t3Pass = test1.oldRegime.standardDeduction === 50000;
  if (!t3Pass) allPassed = false;
  results.push(`Test 3 (Old Regime std deduction = 50k): ${t3Pass ? 'PASSED' : 'FAILED'}`);

  // Test 4: HRA calculation with metro factor
  // Basic 6,00,000, HRA 2,40,000, Rent 3,00,000.
  // 1) Actual: 240,000
  // 2) 50% basic: 300,000
  // 3) Rent - 10% basic: 300,000 - 60,000 = 240,000
  // Min is 240,000
  const hraEx = calculateHRAExemption(600000, 240000, 300000, true);
  const t4Pass = hraEx === 240000;
  if (!t4Pass) allPassed = false;
  results.push(`Test 4 (HRA Exemption calculation): ${t4Pass ? 'PASSED' : `FAILED (expected 240000, got ${hraEx})`}`);

  return { passed: allPassed, results };
}
