/**
 * Screen 4: Tax Optimization Engine
 * Old vs New Regime side-by-side comparison with interactive deterministic calculator,
 * step-by-step statutory computation breakdown, better regime highlighted,
 * and missed deductions list with citations and eligibility reasoning.
 */

import React, { useState } from 'react';
import {
  Calculator,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { computeTaxComparison, formatINR, TaxInputs } from '../lib/taxEngine';
import { StatusBadge, CitationChip } from '../components/common/StatusBadges';
import { clientService } from '../services/clientService';
import { PageHeader } from '../components/common/PageHeader';
import { JourneyStepper } from '../components/common/JourneyStepper';
import { NextActionCard } from '../components/common/NextActionCard';
import { CountUpNumber } from '../components/common/CountUpNumber';

export const TaxOptimization: React.FC = () => {
  const { activeClient, role, refreshClientData } = useApp();

  const [inputs, setInputs] = useState<TaxInputs>({
    grossSalary: activeClient.taxInputs.grossSalary || 2850000,
    basicSalary: activeClient.taxInputs.basicSalary || 1425000,
    hraReceived: activeClient.taxInputs.hraReceived || 420000,
    rentPaidAnnual: activeClient.taxInputs.rentPaidAnnual || 480000,
    isMetro: activeClient.taxInputs.isMetro ?? true,
    section80C: activeClient.taxInputs.section80C ?? 150000,
    section80D: activeClient.taxInputs.section80D ?? 25000,
    section80CCD1B: activeClient.taxInputs.section80CCD1B ?? 50000,
    section80CCD2: activeClient.taxInputs.section80CCD2 ?? 142500,
    homeLoanInterest24b: activeClient.taxInputs.homeLoanInterest24b ?? 0,
    otherIncome: activeClient.taxInputs.otherIncome ?? 65000,
    shortTermCapitalGains: activeClient.taxInputs.shortTermCapitalGains ?? 45000,
    longTermCapitalGains: activeClient.taxInputs.longTermCapitalGains ?? 180000,
  });

  const [showStepByStep, setShowStepByStep] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Compute live with deterministic engine
  const result = computeTaxComparison(inputs);

  const handleInputChange = (field: keyof TaxInputs, value: any) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveToClient = async () => {
    await clientService.updateClientTaxInputs(
      activeClient.id,
      inputs,
      role === 'ca' ? 'CA Ramesh Sharma' : activeClient.name,
      role
    );
    await refreshClientData();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Standardized PageHeader */}
      <PageHeader
        title="Tax Optimization Engine"
        description="Evaluating Old vs New Tax Regime under statutory provisions. Mathematical calculations executed by local deterministic engine."
        badge={
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--hairline)]">
              FY 2025-26
            </span>
            <StatusBadge variant="ai_prepared" label="Deterministic Verified" />
          </div>
        }
        actions={
          <button
            onClick={handleSaveToClient}
            className="px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-mono font-medium flex items-center gap-2 transition-all shadow-[var(--shadow-soft)]"
          >
            <CheckCircle2 className="w-4 h-4 text-[var(--accent-gold)]" />
            <span>{saveSuccess ? 'Saved to Working Papers!' : 'Save & Update Working Papers'}</span>
          </button>
        }
      />

      {/* Guided Client Journey Stepper */}
      <JourneyStepper currentStepId="analyze" />

      {/* Next Best Action Card */}
      <NextActionCard
        title="Restructure Employer NPS under Section 80CCD(2)"
        description={`Claiming employer NPS contribution of 10% of basic salary is exempt under BOTH Old and New Tax Regimes with no cap. Potential additional tax saving: ${formatINR(result.missedDeductions[0]?.potentialSavingOld || 45000)}.`}
        actionLabel="Apply 80CCD(2) Deduction"
        onActionClick={() => handleInputChange('section80CCD2', Math.round((inputs.basicSalary || 0) * 0.1))}
        tone="gold"
        badge="High-Impact Recommendation"
      />

      {/* Statutory Rules Notice Banner */}
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--hairline)] flex items-start gap-3">
        <Info className="w-5 h-5 text-[var(--accent-copper)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <span className="font-semibold text-[var(--text-primary)]">Statutory Notice ({result.rulesAsOf}): </span>
          {result.legalNotice} Standard deduction under the New Regime is ₹75,000 for salaried assessees with zero tax up to ₹12,00,000 via Sec 87A rebate.
        </div>
      </div>

      {/* Top Headline Winner Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] shadow-[var(--shadow-soft)] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--accent-gold)]">
              <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />
              <span>Recommended Tax Strategy</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--text-primary)] mt-2">
              The <span className="text-[var(--primary-emerald)] font-semibold">{result.betterRegime === 'new' ? 'New Tax Regime' : 'Old Tax Regime'}</span> saves you{' '}
              <span className="font-serif text-[var(--accent-gold)]">
                <CountUpNumber value={result.taxDifference} />
              </span>
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              {result.betterRegime === 'new'
                ? 'Under FY 2025-26 slabs, the New Regime provides a lower tax liability of ' +
                  formatINR(result.newRegime.totalTaxLiability) +
                  ' compared to ' +
                  formatINR(result.oldRegime.totalTaxLiability) +
                  ' in the Old Regime.'
                : 'With total deductions exceeding the breakeven threshold, the Old Regime provides a lower tax liability of ' +
                  formatINR(result.oldRegime.totalTaxLiability) +
                  ' compared to ' +
                  formatINR(result.newRegime.totalTaxLiability) +
                  ' in the New Regime.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] text-center min-w-[130px]">
              <span className="text-[11px] font-mono text-[var(--text-muted)] block">Old Regime Tax</span>
              <span className="font-serif text-xl font-medium text-[var(--text-primary)]">
                {formatINR(result.oldRegime.totalTaxLiability)}
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)] block mt-0.5">
                Effective: {result.oldRegime.effectiveTaxRate}%
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[var(--primary-emerald-tint)] border border-[var(--primary-emerald)]/40 text-center min-w-[130px]">
              <span className="text-[11px] font-mono text-[var(--primary-emerald)] block font-semibold">New Regime Tax</span>
              <span className="font-serif text-xl font-semibold text-[var(--primary-emerald)]">
                {formatINR(result.newRegime.totalTaxLiability)}
              </span>
              <span className="text-[10px] font-mono text-[var(--accent-gold)] block mt-0.5">
                Effective: {result.newRegime.effectiveTaxRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Layout: Inputs Left, Computations Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Inputs (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[var(--primary-emerald)]" />
                <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                  Tax Inputs & Salary Structure
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Live Engine</span>
            </div>

            {/* Income Streams */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                  Gross Annual Salary (CTC)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[var(--text-muted)] font-mono text-xs">₹</span>
                  <input
                    type="number"
                    value={inputs.grossSalary}
                    onChange={(e) => handleInputChange('grossSalary', Number(e.target.value))}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl pl-7 pr-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                    Basic Salary
                  </label>
                  <input
                    type="number"
                    value={inputs.basicSalary}
                    onChange={(e) => handleInputChange('basicSalary', Number(e.target.value))}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                    HRA Received
                  </label>
                  <input
                    type="number"
                    value={inputs.hraReceived}
                    onChange={(e) => handleInputChange('hraReceived', Number(e.target.value))}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                    Annual Rent Paid
                  </label>
                  <input
                    type="number"
                    value={inputs.rentPaidAnnual}
                    onChange={(e) => handleInputChange('rentPaidAnnual', Number(e.target.value))}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                    City Type (HRA)
                  </label>
                  <select
                    value={inputs.isMetro ? 'metro' : 'non-metro'}
                    onChange={(e) => handleInputChange('isMetro', e.target.value === 'metro')}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                  >
                    <option value="metro">Metro (50% Basic)</option>
                    <option value="non-metro">Non-Metro (40% Basic)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Statutory Chapter VI-A Deductions */}
            <div className="pt-4 border-t border-[var(--border)] space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--primary-emerald)] block">
                Chapter VI-A Deductions (Old Regime)
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                    Sec 80C (Cap ₹1.5L)
                  </label>
                  <input
                    type="number"
                    value={inputs.section80C}
                    onChange={(e) => handleInputChange('section80C', Number(e.target.value))}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                    Sec 80D (Health Ins.)
                  </label>
                  <input
                    type="number"
                    value={inputs.section80D}
                    onChange={(e) => handleInputChange('section80D', Number(e.target.value))}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                    Sec 80CCD(1B) (NPS 50k)
                  </label>
                  <input
                    type="number"
                    value={inputs.section80CCD1B}
                    onChange={(e) => handleInputChange('section80CCD1B', Number(e.target.value))}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                    Sec 24(b) (Home Loan)
                  </label>
                  <input
                    type="number"
                    value={inputs.homeLoanInterest24b}
                    onChange={(e) => handleInputChange('homeLoanInterest24b', Number(e.target.value))}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                  />
                </div>
              </div>

              {/* Employer NPS (Allowed in BOTH!) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-[var(--primary-emerald)] font-semibold">
                    Sec 80CCD(2) (Employer NPS - Both Regimes!)
                  </label>
                  <CitationChip section="80CCD(2)" />
                </div>
                <input
                  type="number"
                  value={inputs.section80CCD2}
                  onChange={(e) => handleInputChange('section80CCD2', Number(e.target.value))}
                  className="w-full bg-[var(--surface-raised)] border border-[var(--primary-emerald)]/40 rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Side-by-Side Breakdown & Slabs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] overflow-hidden">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                Detailed Computation Breakdown
              </h3>
              <button
                onClick={() => setShowStepByStep((p) => !p)}
                className="text-xs font-mono text-[var(--primary-emerald)] flex items-center gap-1 hover:underline"
              >
                <span>{showStepByStep ? 'Collapse Slabs' : 'Expand Slabs'}</span>
                {showStepByStep ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)] font-mono text-[var(--text-muted)]">
                    <th className="py-3 px-4">Statutory Head / Section</th>
                    <th className="py-3 px-4 text-right">Old Regime</th>
                    <th className="py-3 px-4 text-right">New Regime (FY26)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-mono">
                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">Gross Total Income</td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(result.oldRegime.grossTotalIncome)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(result.newRegime.grossTotalIncome)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">
                      Less: Standard Deduction [Sec 16(ia)]
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--semantic-danger)]">
                      -{formatINR(result.oldRegime.standardDeduction)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--primary-emerald)] font-semibold">
                      -{formatINR(result.newRegime.standardDeduction)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">
                      Less: HRA Exemption [Sec 10(13A)]
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--semantic-danger)]">
                      -{formatINR(result.oldRegime.hraExemption)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-muted)]">Not Applicable</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">
                      Less: Chapter VI-A (80C, 80D, 80CCD)
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--semantic-danger)]">
                      -{formatINR(
                        Math.min(inputs.section80C || 0, 150000) +
                          Math.min(inputs.section80CCD1B || 0, 50000) +
                          Math.min(inputs.section80D || 0, 75000) +
                          (inputs.section80CCD2 || 0)
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--primary-emerald)]">
                      -{formatINR(inputs.section80CCD2 || 0)} (80CCD2)
                    </td>
                  </tr>

                  <tr className="bg-[var(--surface-raised)] font-semibold text-[var(--text-primary)]">
                    <td className="py-3 px-4 font-sans">Net Taxable Income</td>
                    <td className="py-3 px-4 text-right">
                      {formatINR(result.oldRegime.netTaxableIncome)}
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--primary-emerald)]">
                      {formatINR(result.newRegime.netTaxableIncome)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">Normal Slab Tax</td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(result.oldRegime.slabTax)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(result.newRegime.slabTax)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">Health & Education Cess (4%)</td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      +{formatINR(result.oldRegime.cess)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      +{formatINR(result.newRegime.cess)}
                    </td>
                  </tr>

                  <tr className="bg-[var(--surface-raised)] text-sm font-bold">
                    <td className="py-4 px-4 font-serif text-[var(--text-primary)]">Total Tax Liability</td>
                    <td
                      className={`py-4 px-4 text-right ${
                        result.betterRegime === 'old' ? 'text-[var(--primary-emerald)] font-bold' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {formatINR(result.oldRegime.totalTaxLiability)}
                    </td>
                    <td
                      className={`py-4 px-4 text-right ${
                        result.betterRegime === 'new' ? 'text-[var(--primary-emerald)] font-bold' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {formatINR(result.newRegime.totalTaxLiability)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Expandable Slab Breakdown */}
            {showStepByStep && (
              <div className="p-4 bg-[var(--surface-raised)] border-t border-[var(--border)] text-xs">
                <span className="font-mono text-[var(--text-muted)] uppercase text-[11px] block mb-2">
                  New Regime Slab Tranches (FY 2025-26)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.newRegime.slabBreakdown.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--hairline)] flex justify-between font-mono"
                    >
                      <span className="text-[var(--text-secondary)]">
                        {s.slab} ({s.ratePercent}%):
                      </span>
                      <span className="text-[var(--text-primary)]">{formatINR(s.taxAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Missed Deductions */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--accent-gold)]" />
                <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                  Missed Deductions & Actionable Claims
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[var(--primary-emerald)]">
                Income-tax Act, 1961
              </span>
            </div>

            <div className="space-y-3">
              {result.missedDeductions.map((d, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] hover:border-[var(--accent-gold)]/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{d.title}</span>
                        <CitationChip section={d.section} rulesAsOf={d.citationDate} />
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed font-sans">{d.reasoning}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-serif text-base text-[var(--accent-gold)] font-semibold block">
                        +{formatINR(d.potentialSavingOld)}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">Tax Saving</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
