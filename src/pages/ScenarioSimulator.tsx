/**
 * Screen 5: Scenario Simulator
 * Interactive sliders and toggles for "What-if" financial decisions:
 * - Invest 50k more in NPS (Sec 80CCD(1B))
 * - Buy a house (Housing loan interest Sec 24(b))
 * - Sell shares (Capital gains realization)
 * - Switch jobs (Salary hike or Corporate NPS restructuring)
 * Live Before vs After tax impact charts with Recharts.
 * Starts from live TaxInputs.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sliders,
  Sparkles,
  Home,
  Briefcase,
  TrendingUp,
  RotateCcw,
  Upload,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { compare, formatINR, TaxInputs } from '../lib/taxEngine';
import { CitationChip } from '../components/common/StatusBadges';
import { PageHeader } from '../components/common/PageHeader';
import { JourneyStepper } from '../components/common/JourneyStepper';
import { NextActionCard } from '../components/common/NextActionCard';
import { CountUpNumber } from '../components/common/CountUpNumber';

export const ScenarioSimulator: React.FC = () => {
  const { activeClient, taxInputs, documents, loadDemoData, isAnalyzing } = useApp();

  const baselineInputs: TaxInputs = {
    grossSalary: taxInputs.grossSalary || 1800000,
    basicSalary: taxInputs.basicSalary || 720000,
    hraReceived: taxInputs.hraReceived || 360000,
    rentPaidAnnual: taxInputs.rentPaidAnnual || 360000,
    isMetro: taxInputs.isMetro ?? true,
    section80C: taxInputs.section80C ?? 150000,
    section80D: taxInputs.section80D ?? 70000,
    section80DSelf: taxInputs.section80DSelf ?? 22000,
    section80DParents: taxInputs.section80DParents ?? 48000,
    section80CCD1B: taxInputs.section80CCD1B ?? 50000,
    section80CCD2: taxInputs.employerNps ?? taxInputs.section80CCD2 ?? 72000,
    employerNps: taxInputs.employerNps ?? 72000,
    homeLoanInterest24b: taxInputs.homeLoanInterest24b ?? 0,
    otherIncome: taxInputs.otherIncome ?? 85000,
    interestSavings: taxInputs.interestSavings ?? 18000,
    interestFd: taxInputs.interestFd ?? 42000,
    dividend: taxInputs.dividend ?? 25000,
    shortTermCapitalGains: taxInputs.shortTermCapitalGains ?? 60000,
    longTermCapitalGains: taxInputs.longTermCapitalGains ?? 210000,
    tdsCredit: taxInputs.tdsCredit ?? 201700,
  };

  const [salaryHikePercent, setSalaryHikePercent] = useState<number>(0);
  const [addNpsTier1, setAddNpsTier1] = useState<boolean>(true);
  const [addCorporateNps, setAddCorporateNps] = useState<boolean>(true);
  const [buyHouseLoanInterest, setBuyHouseLoanInterest] = useState<number>(180000);
  const [sellSharesLtcg, setSellSharesLtcg] = useState<number>(200000);

  // Empty state
  if (documents.length === 0 && !isAnalyzing) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="What-If Scenario Simulator"
          description="Simulate life transitions (job changes, real estate purchases, retirement funding) and preview live tax impacts."
          badge={
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--accent-gold)] border border-[var(--hairline)]">
              Interactive Modeling
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

        <JourneyStepper currentStepId="compute" />

        <div className="rounded-2xl border-2 border-dashed border-[var(--hairline)] p-12 text-center bg-[var(--surface)] space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface-raised)] flex items-center justify-center text-[var(--accent-gold)]">
            <Sliders className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-medium text-[var(--text-primary)]">
              Upload documents to begin
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              The scenario simulator initializes from your baseline tax inputs.
              Upload working papers or load the verified demo test-pack to start modeling.
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

  const baselineResult = compare(baselineInputs, baselineInputs.tdsCredit);

  const simulatedGrossSalary = Math.round(
    baselineInputs.grossSalary * (1 + salaryHikePercent / 100)
  );
  const simulatedBasic = Math.round(simulatedGrossSalary * 0.4);

  const simulatedInputs: TaxInputs = {
    ...baselineInputs,
    grossSalary: simulatedGrossSalary,
    basicSalary: simulatedBasic,
    section80CCD1B: addNpsTier1 ? 50000 : baselineInputs.section80CCD1B,
    section80CCD2: addCorporateNps ? Math.round(simulatedBasic * 0.1) : (baselineInputs.employerNps ?? 0),
    employerNps: addCorporateNps ? Math.round(simulatedBasic * 0.1) : (baselineInputs.employerNps ?? 0),
    homeLoanInterest24b: buyHouseLoanInterest,
    longTermCapitalGains: (baselineInputs.longTermCapitalGains || 0) + sellSharesLtcg,
  };

  const simulatedResult = compare(simulatedInputs, baselineInputs.tdsCredit);

  const baselineTax =
    baselineResult.recommended === 'new'
      ? baselineResult.new.total_tax
      : baselineResult.old.total_tax;

  const simulatedTax =
    simulatedResult.recommended === 'new'
      ? simulatedResult.new.total_tax
      : simulatedResult.old.total_tax;

  const netTaxImpact = simulatedTax - baselineTax;

  const chartData = [
    {
      scenario: 'Baseline Position',
      'Old Regime': baselineResult.old.total_tax,
      'New Regime': baselineResult.new.total_tax,
    },
    {
      scenario: 'Simulated What-If',
      'Old Regime': simulatedResult.old.total_tax,
      'New Regime': simulatedResult.new.total_tax,
    },
  ];

  const resetScenarios = () => {
    setSalaryHikePercent(0);
    setAddNpsTier1(false);
    setAddCorporateNps(false);
    setBuyHouseLoanInterest(0);
    setSellSharesLtcg(0);
  };

  return (
    <div className="space-y-8">
      {/* Standardized PageHeader */}
      <PageHeader
        title="What-If Scenario Simulator"
        description="Simulate life transitions (job changes, real estate purchases, retirement funding) and preview live tax impacts."
        badge={
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--accent-gold)] border border-[var(--hairline)]">
            Interactive Modeling
          </span>
        }
        actions={
          <button
            onClick={resetScenarios}
            className="px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono flex items-center gap-1.5 transition-colors border border-[var(--hairline)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Simulation</span>
          </button>
        }
      />

      {/* Guided Client Journey Stepper */}
      <JourneyStepper currentStepId="compute" />

      {/* Next Action Card */}
      <NextActionCard
        title={
          netTaxImpact <= 0
            ? `Simulation Yields Net Tax Reduction of ${formatINR(Math.abs(netTaxImpact))}`
            : `Simulation Increases Annual Tax Liability by ${formatINR(netTaxImpact)}`
        }
        description={
          netTaxImpact <= 0
            ? 'Your simulated deductions and capital allocation efficiently offset marginal tax liability under the statutory tax engine.'
            : 'Higher gross salary or capital gain realizations increase your tax bracket. Evaluate additional NPS under 80CCD(2) to mitigate.'
        }
        actionLabel="Review Working Papers"
        actionLink={`/reports/${activeClient.id}`}
        tone={netTaxImpact <= 0 ? 'emerald' : 'gold'}
        badge="Scenario Insight"
      />

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-1">
            Baseline Annual Tax
          </span>
          <div className="font-serif text-3xl font-semibold text-[var(--text-primary)]">
            <CountUpNumber value={baselineTax} />
          </div>
          <span className="text-xs text-[var(--text-muted)] font-mono mt-1 block">
            Optimal: {baselineResult.recommended.toUpperCase()} Regime
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-1">
            Simulated Annual Tax
          </span>
          <div className="font-serif text-3xl font-semibold text-[var(--text-primary)]">
            <CountUpNumber value={simulatedTax} />
          </div>
          <span className="text-xs text-[var(--primary-emerald)] font-mono mt-1 block">
            Optimal: {simulatedResult.recommended.toUpperCase()} Regime
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-gold)] block mb-1">
            Net Tax Impact (Difference)
          </span>
          <div
            className={`font-serif text-3xl font-semibold ${
              netTaxImpact <= 0 ? 'text-[var(--primary-emerald)]' : 'text-amber-400'
            }`}
          >
            {netTaxImpact <= 0 ? '-' : '+'}
            {formatINR(Math.abs(netTaxImpact))}
          </div>
          <span className="text-xs text-[var(--text-muted)] font-mono mt-1 block">
            {netTaxImpact <= 0 ? 'Tax saved via scenario' : 'Incremental tax payable'}
          </span>
        </div>
      </div>

      {/* Interactive Controls & Live Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sliders & Levers (Left 6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--primary-emerald)]" />
                <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                  Life Events & Decision Levers
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                Dynamic Modeling
              </span>
            </div>

            {/* Lever 1: Salary Hike / Job Transition */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-[var(--text-primary)]">
                  <Briefcase className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                  <span>Salary Hike / Promotion</span>
                </div>
                <span className="text-[var(--accent-gold)] font-semibold">
                  +{salaryHikePercent}% ({formatINR(simulatedGrossSalary)})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={salaryHikePercent}
                onChange={(e) => setSalaryHikePercent(Number(e.target.value))}
                className="w-full accent-[var(--accent-gold)] cursor-pointer"
              />
            </div>

            {/* Lever 2: Real Estate Loan Interest (Sec 24b) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-[var(--text-primary)]">
                  <Home className="w-3.5 h-3.5 text-[var(--primary-emerald)]" />
                  <span>Home Loan Interest (Sec 24b)</span>
                </div>
                <span className="text-[var(--primary-emerald)] font-semibold">
                  {formatINR(buyHouseLoanInterest)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="250000"
                step="10000"
                value={buyHouseLoanInterest}
                onChange={(e) => setBuyHouseLoanInterest(Number(e.target.value))}
                className="w-full accent-[var(--primary-emerald)] cursor-pointer"
              />
            </div>

            {/* Lever 3: Equity / Mutual Fund Capital Gain Realization */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-[var(--text-primary)]">
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-copper)]" />
                  <span>Realise LTCG Equity (Sec 112A)</span>
                </div>
                <span className="text-[var(--accent-copper)] font-semibold">
                  {formatINR(sellSharesLtcg)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1000000"
                step="50000"
                value={sellSharesLtcg}
                onChange={(e) => setSellSharesLtcg(Number(e.target.value))}
                className="w-full accent-[var(--accent-copper)] cursor-pointer"
              />
            </div>

            {/* Toggles: NPS Tier 1 and Corporate NPS */}
            <div className="pt-4 border-t border-[var(--border)] space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] cursor-pointer hover:border-[var(--accent-gold)]/40 transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={addNpsTier1}
                    onChange={(e) => setAddNpsTier1(e.target.checked)}
                    className="rounded accent-[var(--primary-emerald)]"
                  />
                  <span className="text-xs font-sans text-[var(--text-primary)]">
                    Contribute ₹50,000 to NPS Tier-1
                  </span>
                </div>
                <CitationChip section="80CCD(1B)" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] cursor-pointer hover:border-[var(--primary-emerald)]/40 transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={addCorporateNps}
                    onChange={(e) => setAddCorporateNps(e.target.checked)}
                    className="rounded accent-[var(--primary-emerald)]"
                  />
                  <span className="text-xs font-sans text-[var(--text-primary)]">
                    Structure 10% Employer NPS (Both Regimes)
                  </span>
                </div>
                <CitationChip section="80CCD(2)" />
              </label>
            </div>
          </div>
        </div>

        {/* Live Recharts Comparison (Right 6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)]">
            <h3 className="font-serif text-lg font-medium text-[var(--text-primary)] mb-1">
              Before vs After Tax Comparison
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-mono mb-6">
              Deterministic statutory calculation across baseline vs simulated parameters
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="scenario" stroke="#6F7782" fontSize={11} />
                  <YAxis
                    stroke="#6F7782"
                    fontSize={11}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatINR(val), 'Tax']}
                    contentStyle={{
                      backgroundColor: '#12161B',
                      borderColor: '#232A33',
                      borderRadius: 12,
                      fontSize: 12,
                      color: '#F3EFE6',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Bar dataKey="Old Regime" fill="#6F7782" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="New Regime" fill="#1F9D77" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--text-muted)]">Recommendation in What-If:</span>
              <span className="text-[var(--primary-emerald)] font-semibold">
                {simulatedResult.recommended.toUpperCase()} Regime (Saves {formatINR(simulatedResult.savings)})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
