/**
 * CAdesk Statutory Tax Pipeline & Engine Test Suite
 * Asserts deterministic execution of mapper, cross-checks, and tax calculations
 * against Indian Tax benchmark fixtures (/test-pack/expected/*.json).
 * No network calls are made.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { buildTaxInputs } from './mapper';
import { runCrossChecks } from './crossChecks';
import { compare, compute } from './taxEngine';
import { analyzeDocument } from '../services/documentService';

if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function (fn: any, ...args: any[]) {
    return new Promise((resolve, reject) => {
      try {
        resolve(fn(...args));
      } catch (err) {
        reject(err);
      }
    });
  };
}

describe('CAdesk Tax Pipeline & Deterministic Engine (FY 2025-26)', () => {
  // Resolve paths to test fixtures
  const testPackDir = path.resolve(__dirname, '../../test-pack/expected');
  const extractionFixturePath = path.join(testPackDir, 'expected_extraction.json');
  const taxResultFixturePath = path.join(testPackDir, 'expected_tax_result.json');
  const simulatorCasesFixturePath = path.join(testPackDir, 'expected_simulator_cases.json');

  const expectedExtraction = JSON.parse(fs.readFileSync(extractionFixturePath, 'utf-8'));
  const expectedTaxResult = JSON.parse(fs.readFileSync(taxResultFixturePath, 'utf-8'));
  const expectedSimulatorCases = JSON.parse(fs.readFileSync(simulatorCasesFixturePath, 'utf-8'));

  it('correctly maps extracted document fields to unified TaxInputs', () => {
    const { inputs, sources } = buildTaxInputs(expectedExtraction);

    expect(inputs.grossSalary).toBe(1800000);
    expect(inputs.basicSalary).toBe(720000);
    expect(inputs.hraReceived).toBe(360000);
    expect(inputs.employerNps).toBe(72000);
    expect(inputs.rentPaidAnnual).toBe(360000);
    expect(inputs.professionalTax).toBe(2500);
    expect(inputs.interestSavings).toBe(18000);
    expect(inputs.interestFd).toBe(42000);
    expect(inputs.dividend).toBe(25000);
    expect(inputs.shortTermCapitalGains).toBe(60000);
    expect(inputs.longTermCapitalGains).toBe(210000);
    expect(inputs.section80C).toBe(150000);
    expect(inputs.section80DSelf).toBe(22000);
    expect(inputs.section80DParents).toBe(48000);
    expect(inputs.section80CCD1B).toBe(50000);
    expect(inputs.tdsCredit).toBe(201700);

    // Verify sources map for "why this number" tooltip
    expect(sources['gross_salary']).toBeDefined();
    expect(sources['sec_80c_total']).toBeDefined();
    expect(sources['total_tds']).toBeDefined();
  });

  it('runs all 5 statutory cross-checks and confirms all PASS', () => {
    const checks = runCrossChecks(expectedExtraction);

    expect(checks).toHaveLength(5);
    checks.forEach((c) => {
      expect(c.status).toBe('PASS');
    });

    expect(checks[0].check).toContain('Form 16 TDS == 26AS salary TDS');
    expect(checks[0].values).toEqual([195000, 195000]);

    expect(checks[1].check).toContain('Form 16 gross salary == AIS salary');
    expect(checks[1].values).toEqual([1800000, 1800000]);

    expect(checks[2].check).toContain('Payslip annualised');
    expect(checks[3].check).toContain('Capital gains statement');
    expect(checks[4].check).toContain('80C total capped at 150000');
  });

  it('computes exact tax liabilities and matches expected_tax_result.json benchmarks', () => {
    const { inputs } = buildTaxInputs(expectedExtraction);
    const result = compare(inputs, expectedTaxResult.tds_credit);

    // Assert exact tax figures
    expect(result.new.total_tax).toBe(177034);
    expect(result.old.total_tax).toBe(200590);
    expect(result.new.total_income).toBe(1883000);
    expect(result.old.total_income).toBe(1337500);
    expect(result.recommended).toBe('new');
    expect(result.savings).toBe(23556);
    expect(result.tds_credit).toBe(201700);
    expect(result.net_payable_or_refund).toBe(-24666);

    // Detailed breakdown assertions
    expect(result.new.salary_income).toBe(1725000);
    expect(result.new.standard_deduction).toBe(75000);
    expect(result.new.normal_taxable_income).toBe(1738000);
    expect(result.new.tax_on_normal).toBe(147600);
    expect(result.new.tax_stcg).toBe(12000);
    expect(result.new.tax_ltcg).toBe(10625);
    expect(result.new.cess).toBe(6809);

    expect(result.old.salary_income).toBe(1459500);
    expect(result.old.hra_exemption).toBe(288000);
    expect(result.old.standard_deduction).toBe(50000);
    expect(result.old.professional_tax).toBe(2500);
    expect(result.old.normal_taxable_income).toBe(1192500);
    expect(result.old.tax_on_normal).toBe(170250);
    expect(result.old.cess).toBe(7715);
  });

  it('asserts every test case in expected_simulator_cases.json (87A rebate & marginal relief)', () => {
    expectedSimulatorCases.forEach((scenario: any, idx: number) => {
      const computed = compute(scenario.input, scenario.regime);
      expect(
        computed.total_tax,
        `Scenario ${idx + 1} (${scenario.why}) failed`
      ).toBe(scenario.expected_total_tax);
    });
  });

  it('processes all 8 actual PDF files in test-pack/documents and produces expected tax results and 5 PASS cross-checks', async () => {
    const docsDir = path.resolve(__dirname, '../../test-pack/documents');
    const pdfFiles = [
      '01_Form16_PartA.pdf',
      '02_Form16_PartB.pdf',
      '03_Salary_Slip_Mar2026.pdf',
      '04_Form26AS_Summary.pdf',
      '05_AIS_TIS.pdf',
      '06_Capital_Gains_Statement.pdf',
      '07_Rent_Receipts_HRA.pdf',
      '08_Investment_Proofs.pdf',
    ];

    const extractedDocs: Record<string, any> = {};
    for (const fileName of pdfFiles) {
      const filePath = path.join(docsDir, fileName);
      const buffer = fs.readFileSync(filePath);
      const res = await analyzeDocument({
        name: fileName,
        buffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
      });
      extractedDocs[fileName] = res;
    }
    const { inputs, flags } = buildTaxInputs(extractedDocs);
    const checks = runCrossChecks(extractedDocs);
    const result = compare(inputs, inputs.tdsCredit);

    // Assert all 5 cross checks pass
    expect(checks).toHaveLength(5);
    checks.forEach((c) => expect(c.status).toBe('PASS'));

    // Assert taxes match acceptance criteria
    expect(result.new.total_tax).toBe(177034);
    expect(result.old.total_tax).toBe(200590);
    expect(result.recommended).toBe('new');
    expect(result.savings).toBe(23556);
    expect(result.net_payable_or_refund).toBe(-24666);

    // Assert flags include other income not in Form 16
    const hasOtherIncomeFlag = flags.some((f) => f.flag.includes('Other income (FD interest'));
    expect(hasOtherIncomeFlag).toBe(true);
  }, 30000);
});
