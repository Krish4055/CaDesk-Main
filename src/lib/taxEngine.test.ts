/**
 * Self-contained Unit Tests for Deterministic Tax Engine
 * Validates FY 2025-26 statutory compliance without requiring external test frameworks.
 */

import { computeTaxComparison, calculateHRAExemption, runTaxEngineUnitTests } from './taxEngine';

export interface TestResult {
  title: string;
  passed: boolean;
  message?: string;
}

export function executeAllTaxEngineTests(): TestResult[] {
  const tests: TestResult[] = [];

  // Test 1: Core benchmarks
  try {
    const { passed, results } = runTaxEngineUnitTests();
    tests.push({
      title: 'Statutory Benchmark Assertions (12L zero tax, 75k std ded, 50k old std ded)',
      passed,
      message: results.join('; '),
    });
  } catch (err: any) {
    tests.push({
      title: 'Statutory Benchmark Assertions',
      passed: false,
      message: err.message,
    });
  }

  // Test 2: New Regime 12 Lakh rebate
  try {
    const res = computeTaxComparison({ grossSalary: 1200000 });
    const passed = res.newRegime.totalTaxLiability === 0;
    tests.push({
      title: 'New Regime FY 2025-26 zero tax rebate up to ₹12,00,000 u/s 87A',
      passed,
      message: passed ? 'Tax is ₹0 as expected' : `Expected ₹0, got ₹${res.newRegime.totalTaxLiability}`,
    });
  } catch (err: any) {
    tests.push({
      title: 'New Regime FY 2025-26 zero tax rebate',
      passed: false,
      message: err.message,
    });
  }

  // Test 3: HRA Exemption Math
  try {
    const hra = calculateHRAExemption(600000, 240000, 300000, true);
    const passed = hra === 240000;
    tests.push({
      title: 'HRA Exemption Rule 2A (50% Basic Metro factor check)',
      passed,
      message: passed ? 'Exemption is ₹2,40,000 as expected' : `Expected 240000, got ${hra}`,
    });
  } catch (err: any) {
    tests.push({
      title: 'HRA Exemption Rule 2A',
      passed: false,
      message: err.message,
    });
  }

  // Test 4: Sec 80CCD(2) Allowed in both regimes
  try {
    const res = computeTaxComparison({ grossSalary: 2000000, basicSalary: 1000000, section80CCD2: 100000 });
    const allowedInNew = res.newRegime.totalDeductions >= 175000; // 75k std ded + 100k 80CCD(2)
    tests.push({
      title: 'Sec 80CCD(2) employer contribution deduction allowed under New Regime',
      passed: allowedInNew,
      message: allowedInNew ? '100k Employer NPS allowed in New Regime' : 'Deduction was disallowed in New Regime',
    });
  } catch (err: any) {
    tests.push({
      title: 'Sec 80CCD(2) in New Regime',
      passed: false,
      message: err.message,
    });
  }

  return tests;
}
