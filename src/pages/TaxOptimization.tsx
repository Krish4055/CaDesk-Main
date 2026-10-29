/**
 * Screen 4: Tax Optimization Engine
 * Evaluates Old vs New Tax Regime under statutory provisions (FY 2025-26):
 * - Math is strictly computed by deterministic tax engine (taxEngine.ts)
 * - Empty state: "Upload documents to begin" + "Load demo data" button
 * - Live dynamic comparison driven by TaxInputs & uploaded documents
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calculator,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { compare, computeTaxComparison, formatINR, TaxInputs } from '../lib/taxEngine';
import { StatusBadge, CitationChip } from '../components/common/StatusBadges';
import { clientService } from '../services/clientService';
import { PageHeader } from '../components/common/PageHeader';
import { JourneyStepper } from '../components/common/JourneyStepper';
import { NextActionCard } from '../components/common/NextActionCard';
import { CountUpNumber } from '../components/common/CountUpNumber';

export const TaxOptimization: React.FC = () => {
  const {
    activeClient,
    taxInputs,
    taxResult: appTaxResult,
    documents,
    loadDemoData,
    role,
    refreshClientData,
    isAnalyzing,
  } = useApp();

  const [inputs, setInputs] = useState<TaxInputs>({ ...taxInputs });
  const [showStepByStep, setShowStepByStep] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync inputs whenever global taxInputs change (from document uploads or edits)
  useEffect(() => {
    setInputs({ ...taxInputs });
  }, [taxInputs]);

  // Compute live with statutory deterministic engine
  const statutoryResult = compare(inputs, inputs.tdsCredit ?? appTaxResult.tds_credit);
  const legacyComparison = computeTaxComparison(inputs);

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

  // Empty state: no documents uploaded & no demo data
  if (documents.length === 0 && !isAnalyzing) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Tax Optimization Engine"
          description="Evaluating Old vs New Tax Regime under statutory provisions (FY 2025-26)."
          badge={
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--hairline)]">
              FY 2025-26
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadDemoData()}
                className="px-4 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--accent-gold)] border border-[var(--hairline)] text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Demo Data</span>
              </button>
              <Link
                to="/vault"
                className="px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-mono font-medium flex items-center gap-2 transition-all shadow-[var(--shadow-soft)]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Documents</span>
              </Link>
            </div>
          }
        />

        <JourneyStepper currentStepId="upload" />

        <div className="rounded-2xl border-2 border-dashed border-[var(--hairline)] p-12 text-center bg-[var(--surface)] space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface-raised)] flex items-center justify-center text-[var(--accent-gold)]">
            <Calculator className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-medium text-[var(--text-primary)]">
              Upload documents to begin
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              Tax optimization requires extracted salary, deduction, and capital gain figures.
              Upload working papers or load the benchmark demo data to view live statutory comparisons.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/vault"
              className="px-5 py-2.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-mono font-medium flex items-center gap-2 transition-all shadow-[var(--shadow-soft)]"
            >
              <Upload className="w-4 h-4" />
              <span>Go to Document Vault</span>
            </Link>
            <span className="text-xs text-[var(--text-muted)] font-mono">or</span>
            <button
              onClick={() => loadDemoData()}
              className="px-5 py-2.5 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--accent-gold)] border border-[var(--hairline)] text-xs font-mono font-medium flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Demo Data (8 PDFs)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const betterRegime = statutoryResult.recommended;
  const oldTax = statutoryResult.old.total_tax;
  const newTax = statutoryResult.new.total_tax;
  const savings = statutoryResult.savings;

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
        title={`Recommended Strategy: ${betterRegime === 'new' ? 'New Tax Regime (Sec 115BAC)' : 'Old Tax Regime'}`}
        description={`The ${betterRegime === 'new' ? 'New Tax Regime' : 'Old Tax Regime'} saves you ${formatINR(savings)} annually. Slabs, standard deduction (₹75k), and 80CCD(2) employer NPS are accounted for.`}
        actionLabel="Review Working Paper"
        actionLink={`/reports/${activeClient.id}`}
        tone="gold"
        badge="High-Impact Recommendation"
      />

      {/* Statutory Rules Notice Banner */}
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--hairline)] flex items-start gap-3">
        <Info className="w-5 h-5 text-[var(--accent-copper)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <span className="font-semibold text-[var(--text-primary)]">Statutory Notice (Finance Act FY 2025-26): </span>
          New regime allows no HRA exemption or 80C/80D deductions, but provides ₹75,000 standard deduction and 80CCD(2) employer NPS (capped at 10% of basic). Sec 87A rebate applies up to ₹12,00,000 with marginal relief. 111A taxed at 20%, 112A taxed at 12.5% on gains exceeding ₹1,25,000.
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
              The <span className="text-[var(--primary-emerald)] font-semibold">{betterRegime === 'new' ? 'New Tax Regime' : 'Old Tax Regime'}</span> saves you{' '}
              <span className="font-serif text-[var(--accent-gold)]">
                <CountUpNumber value={savings} />
              </span>
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              {betterRegime === 'new'
                ? `Under FY 2025-26 provisions, the New Regime incurs total tax of ${formatINR(newTax)} compared to ${formatINR(oldTax)} in the Old Regime.`
                : `Deductions claimed outweigh the lower slab rates, giving total tax of ${formatINR(oldTax)} in the Old Regime compared to ${formatINR(newTax)} in the New Regime.`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] text-center min-w-[130px]">
              <span className="text-[11px] font-mono text-[var(--text-muted)] block">Old Regime Tax</span>
              <span className="font-serif text-xl font-medium text-[var(--text-primary)]">
                {formatINR(oldTax)}
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)] block mt-0.5">
                Total Income: {formatINR(statutoryResult.old.total_income)}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[var(--primary-emerald-tint)] border border-[var(--primary-emerald)]/40 text-center min-w-[130px]">
              <span className="text-[11px] font-mono text-[var(--primary-emerald)] block font-semibold">New Regime Tax</span>
              <span className="font-serif text-xl font-semibold text-[var(--primary-emerald)]">
                {formatINR(newTax)}
              </span>
              <span className="text-[10px] font-mono text-[var(--accent-gold)] block mt-0.5">
                Total Income: {formatINR(statutoryResult.new.total_income)}
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
                  Gross Annual Salary
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

            {/* Chapter VI-A Deductions */}
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
                    Sec 80D (Self & Parents)
                  </label>
                  <input
                    type="number"
                    value={(inputs.section80DSelf || 0) + (inputs.section80DParents || 0) || inputs.section80D}
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
                    Sec 80CCD(2) (Employer NPS)
                  </label>
                  <input
                    type="number"
                    value={inputs.employerNps ?? inputs.section80CCD2}
                    onChange={(e) => handleInputChange('employerNps', Number(e.target.value))}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Capital Gains & Other Income */}
            <div className="pt-4 border-t border-[var(--border)] space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-gold)] block">
                Capital Gains & Other Income (AIS/TIS)
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                    STCG (111A) @ 20%
                  </label>
                  <input
                    type="number"
                    value={inputs.shortTermCapitalGains}
                    onChange={(e) => handleInputChange('shortTermCapitalGains', Number(e.target.value))}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                    LTCG (112A) @ 12.5%
                  </label>
                  <input
                    type="number"
                    value={inputs.longTermCapitalGains}
                    onChange={(e) => handleInputChange('longTermCapitalGains', Number(e.target.value))}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-[var(--text-muted)] mb-1">
                    Savings Interest
                  </label>
                  <input
                    type="number"
                    value={inputs.interestSavings}
                    onChange={(e) => handleInputChange('interestSavings', Number(e.target.value))}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[var(--text-muted)] mb-1">
                    FD Interest
                  </label>
                  <input
                    type="number"
                    value={inputs.interestFd}
                    onChange={(e) => handleInputChange('interestFd', Number(e.target.value))}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[var(--text-muted)] mb-1">
                    Dividend
                  </label>
                  <input
                    type="number"
                    value={inputs.dividend}
                    onChange={(e) => handleInputChange('dividend', Number(e.target.value))}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Computation Breakdown (7 Cols) */}
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
                <span>{showStepByStep ? 'Collapse Breakdown' : 'Expand Breakdown'}</span>
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
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">Gross Salary Income</td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(inputs.grossSalary)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(inputs.grossSalary)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">
                      Less: Standard Deduction [Sec 16(ia)]
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--semantic-danger)]">
                      -{formatINR(statutoryResult.old.standard_deduction)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--primary-emerald)] font-semibold">
                      -{formatINR(statutoryResult.new.standard_deduction)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">
                      Less: HRA Exemption [Sec 10(13A)]
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--semantic-danger)]">
                      -{formatINR(statutoryResult.old.hra_exemption)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-muted)]">Not Allowed</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">
                      Less: Professional Tax [Sec 16(iii)]
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--semantic-danger)]">
                      -{formatINR(statutoryResult.old.professional_tax)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-muted)]">Not Allowed</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans font-medium text-[var(--text-primary)]">
                      Net Salary Income
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-primary)]">
                      {formatINR(statutoryResult.old.salary_income)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-primary)] font-semibold">
                      {formatINR(statutoryResult.new.salary_income)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">
                      Capital Gains: STCG 111A (20%)
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(inputs.shortTermCapitalGains)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(inputs.shortTermCapitalGains)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">
                      Capital Gains: LTCG 112A (12.5% &gt; ₹1.25L)
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(inputs.longTermCapitalGains)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(inputs.longTermCapitalGains)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">
                      Other Income (Interest &amp; Dividends)
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR((inputs.interestSavings || 0) + (inputs.interestFd || 0) + (inputs.dividend || 0))}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR((inputs.interestSavings || 0) + (inputs.interestFd || 0) + (inputs.dividend || 0))}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">
                      Less: Deductions [80C, 80D, 80CCD(1B), 80TTA]
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--semantic-danger)]">
                      -{formatINR(
                        Math.min(inputs.section80C || 0, 150000) +
                        Math.min((inputs.section80DSelf || 0) + (inputs.section80DParents || 0) || inputs.section80D || 0, 100000) +
                        Math.min(inputs.section80CCD1B || 0, 50000) +
                        Math.min(inputs.interestSavings || 0, 10000)
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-muted)]">Not Allowed</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">
                      Less: Employer NPS [Sec 80CCD(2)]
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--primary-emerald)] font-semibold">
                      -{formatINR(Math.min(inputs.employerNps ?? inputs.section80CCD2 ?? 0, Math.round((inputs.basicSalary || 0) * 0.1)))}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--primary-emerald)] font-semibold">
                      -{formatINR(Math.min(inputs.employerNps ?? inputs.section80CCD2 ?? 0, Math.round((inputs.basicSalary || 0) * 0.1)))}
                    </td>
                  </tr>

                  <tr className="bg-[var(--surface-raised)]/70 font-semibold">
                    <td className="py-3 px-4 font-sans text-[var(--text-primary)]">Total Taxable Income</td>
                    <td className="py-3 px-4 text-right text-[var(--text-primary)]">
                      {formatINR(statutoryResult.old.total_income)}
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--text-primary)]">
                      {formatINR(statutoryResult.new.total_income)}
                    </td>
                  </tr>

                  {/* Tax Slices */}
                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">
                      Tax on Normal Income
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(statutoryResult.old.tax_on_normal)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(statutoryResult.new.tax_on_normal)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">
                      Tax on STCG 111A (20%)
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(statutoryResult.old.tax_stcg)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(statutoryResult.new.tax_stcg)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">
                      Tax on LTCG 112A (12.5%)
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(statutoryResult.old.tax_ltcg)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(statutoryResult.new.tax_ltcg)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-primary)]">
                      Health &amp; Education Cess (4%)
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(statutoryResult.old.cess)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(statutoryResult.new.cess)}
                    </td>
                  </tr>

                  <tr className="border-t-2 border-[var(--border)] bg-[var(--surface-raised)] font-bold text-sm">
                    <td className="py-3 px-4 font-sans text-[var(--text-primary)]">Total Tax Payable</td>
                    <td className="py-3 px-4 text-right text-[var(--text-secondary)]">
                      {formatINR(oldTax)}
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--primary-emerald)]">
                      {formatINR(newTax)}
                    </td>
                  </tr>

                  <tr className="bg-[var(--surface-raised)] font-mono text-xs text-[var(--text-secondary)]">
                    <td className="py-2.5 px-4 font-sans">Less: Reconciled TDS Credit</td>
                    <td className="py-2.5 px-4 text-right text-[var(--primary-emerald)]">
                      -{formatINR(statutoryResult.tds_credit)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[var(--primary-emerald)]">
                      -{formatINR(statutoryResult.tds_credit)}
                    </td>
                  </tr>

                  <tr className="bg-[var(--surface)] font-bold text-xs">
                    <td className="py-2.5 px-4 font-sans text-[var(--accent-gold)]">
                      {statutoryResult.net_payable_or_refund < 0 ? 'Net Refund Due' : 'Net Tax Payable'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {statutoryResult.old.total_tax - statutoryResult.tds_credit < 0
                        ? `Refund ${formatINR(Math.abs(statutoryResult.old.total_tax - statutoryResult.tds_credit))}`
                        : `Payable ${formatINR(statutoryResult.old.total_tax - statutoryResult.tds_credit)}`}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[var(--primary-emerald)]">
                      {statutoryResult.net_payable_or_refund < 0
                        ? `Refund ${formatINR(Math.abs(statutoryResult.net_payable_or_refund))}`
                        : `Payable ${formatINR(statutoryResult.net_payable_or_refund)}`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
