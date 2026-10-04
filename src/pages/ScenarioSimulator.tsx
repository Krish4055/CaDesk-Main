/**
 * Screen 5: Scenario Simulator
 * Interactive sliders and toggles for "What-if" financial decisions:
 * - Invest 50k more in NPS (Sec 80CCD(1B))
 * - Buy a house (Housing loan interest Sec 24(b))
 * - Sell shares (Capital gains realization)
 * - Switch jobs (Salary hike or Corporate NPS restructuring)
 * Live Before vs After tax impact charts with Recharts.
 */

import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Home,
  Briefcase,
  TrendingUp,
  RotateCcw,
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
import { computeTaxComparison, formatINR, TaxInputs } from '../lib/taxEngine';
import { CitationChip } from '../components/common/StatusBadges';
import { PageHeader } from '../components/common/PageHeader';
import { JourneyStepper } from '../components/common/JourneyStepper';
import { NextActionCard } from '../components/common/NextActionCard';
import { CountUpNumber } from '../components/common/CountUpNumber';

export const ScenarioSimulator: React.FC = () => {
  const { activeClient } = useApp();

  const baselineInputs: TaxInputs = {
    grossSalary: activeClient.taxInputs.grossSalary || 2850000,
    basicSalary: activeClient.taxInputs.basicSalary || 1425000,
    hraReceived: activeClient.taxInputs.hraReceived || 420000,
    rentPaidAnnual: activeClient.taxInputs.rentPaidAnnual || 480000,
    isMetro: true,
    section80C: activeClient.taxInputs.section80C ?? 150000,
    section80D: activeClient.taxInputs.section80D ?? 25000,
    section80CCD1B: activeClient.taxInputs.section80CCD1B ?? 0,
    section80CCD2: activeClient.taxInputs.section80CCD2 ?? 0,
    homeLoanInterest24b: activeClient.taxInputs.homeLoanInterest24b ?? 0,
    otherIncome: activeClient.taxInputs.otherIncome ?? 65000,
    shortTermCapitalGains: activeClient.taxInputs.shortTermCapitalGains ?? 0,
    longTermCapitalGains: activeClient.taxInputs.longTermCapitalGains ?? 0,
  };

  const [salaryHikePercent, setSalaryHikePercent] = useState<number>(0);
  const [addNpsTier1, setAddNpsTier1] = useState<boolean>(true);
  const [addCorporateNps, setAddCorporateNps] = useState<boolean>(true);
  const [buyHouseLoanInterest, setBuyHouseLoanInterest] = useState<number>(180000);
  const [sellSharesLtcg, setSellSharesLtcg] = useState<number>(200000);

  const baselineResult = computeTaxComparison(baselineInputs);

  const simulatedGrossSalary = Math.round(
    baselineInputs.grossSalary * (1 + salaryHikePercent / 100)
  );
  const simulatedBasic = Math.round(simulatedGrossSalary * 0.5);

  const simulatedInputs: TaxInputs = {
    ...baselineInputs,
    grossSalary: simulatedGrossSalary,
    basicSalary: simulatedBasic,
    section80CCD1B: addNpsTier1 ? 50000 : baselineInputs.section80CCD1B,
    section80CCD2: addCorporateNps ? Math.round(simulatedBasic * 0.1) : baselineInputs.section80CCD2,
    homeLoanInterest24b: buyHouseLoanInterest,
    longTermCapitalGains: (baselineInputs.longTermCapitalGains || 0) + sellSharesLtcg,
  };

  const simulatedResult = computeTaxComparison(simulatedInputs);

  const baselineTax =
    baselineResult.betterRegime === 'new'
      ? baselineResult.newRegime.totalTaxLiability
      : baselineResult.oldRegime.totalTaxLiability;

  const simulatedTax =
    simulatedResult.betterRegime === 'new'
      ? simulatedResult.newRegime.totalTaxLiability
      : simulatedResult.oldRegime.totalTaxLiability;

  const netTaxImpact = simulatedTax - baselineTax;

  const chartData = [
    {
      scenario: 'Baseline Position',
      'Old Regime': baselineResult.oldRegime.totalTaxLiability,
      'New Regime': baselineResult.newRegime.totalTaxLiability,
    },
    {
      scenario: 'Simulated What-If',
      'Old Regime': simulatedResult.oldRegime.totalTaxLiability,
      'New Regime': simulatedResult.newRegime.totalTaxLiability,
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
        title="Simulating a 20% Salary Hike or Corporate NPS Switch?"
        description="Adjust the sliders below to evaluate how your tax liability and regime preference shift before accepting a new offer letter."
        actionLabel="Apply 20% Hike Preset"
        onActionClick={() => setSalaryHikePercent(20)}
        tone="gold"
        badge="Simulation Tip"
      />

      {/* Main Grid: Controls Left (5 cols) & Live Visual Impact Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Scenario Toggles & Sliders */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Job Change & Salary Hike */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[var(--primary-emerald)]" />
                <span className="text-sm font-medium text-[var(--text-primary)] font-serif">
                  Switch Job / Salary Increment
                </span>
              </div>
              <span className="font-mono text-xs text-[var(--primary-emerald)] font-semibold">
                +{salaryHikePercent}%
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Simulated CTC: <span className="font-mono text-[var(--text-primary)] font-semibold">{formatINR(simulatedGrossSalary)}</span>
            </p>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={salaryHikePercent}
              onChange={(e) => setSalaryHikePercent(Number(e.target.value))}
              className="w-full accent-[var(--primary-emerald)] cursor-pointer"
            />
          </div>

          {/* Card 2: NPS Contributions */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />
              <span className="text-sm font-medium text-[var(--text-primary)] font-serif">
                NPS Pension Restructuring
              </span>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addNpsTier1}
                  onChange={(e) => setAddNpsTier1(e.target.checked)}
                  className="mt-1 accent-[var(--primary-emerald)] rounded"
                />
                <div>
                  <span className="text-xs text-[var(--text-primary)] font-medium block">
                    Invest ₹50,000 in NPS Tier-1 (Sec 80CCD(1B))
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-sans">
                    Additional exclusive deduction under Old Tax Regime.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addCorporateNps}
                  onChange={(e) => setAddCorporateNps(e.target.checked)}
                  className="mt-1 accent-[var(--primary-emerald)] rounded"
                />
                <div>
                  <span className="text-xs text-[var(--text-primary)] font-medium block">
                    Opt for Employer Corporate NPS (10% of Basic)
                  </span>
                  <span className="text-[11px] text-[var(--primary-emerald)] font-mono">
                    Sec 80CCD(2) • Exempt under BOTH Old & New Regimes!
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Card 3: Buy a House / Housing Loan */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-[var(--primary-emerald)]" />
                <span className="text-sm font-medium text-[var(--text-primary)] font-serif">
                  Buy House with Home Loan
                </span>
              </div>
              <CitationChip section="24(b)" />
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Annual Interest Payment:</span>
              <span className="font-mono text-[var(--text-primary)] font-semibold">{formatINR(buyHouseLoanInterest)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="200000"
              step="10000"
              value={buyHouseLoanInterest}
              onChange={(e) => setBuyHouseLoanInterest(Number(e.target.value))}
              className="w-full accent-[var(--primary-emerald)] cursor-pointer"
            />
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Capped at ₹2,00,000 for self-occupied property in Old Regime.
            </p>
          </div>

          {/* Card 4: Sell Equity Shares / LTCG */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--accent-copper)]" />
                <span className="text-sm font-medium text-[var(--text-primary)] font-serif">
                  Realize Listed Equity Gains
                </span>
              </div>
              <CitationChip section="112A" />
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>LTCG to Harvest:</span>
              <span className="font-mono text-[var(--text-primary)] font-semibold">{formatINR(sellSharesLtcg)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000000"
              step="50000"
              value={sellSharesLtcg}
              onChange={(e) => setSellSharesLtcg(Number(e.target.value))}
              className="w-full accent-[var(--primary-emerald)] cursor-pointer"
            />
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Taxed @ 12.5% on gains exceeding statutory threshold of ₹1,25,000.
            </p>
          </div>
        </div>

        {/* Right Column: Live Before vs After Impact & Visual Charts (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Net Impact Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                Net Annual Tax Difference vs Current
              </span>
              <div
                className={`font-serif text-3xl sm:text-4xl font-semibold tracking-tight ${
                  netTaxImpact <= 0 ? 'text-[var(--primary-emerald)]' : 'text-[var(--semantic-danger)]'
                }`}
              >
                {netTaxImpact <= 0 ? '-' : '+'}
                <CountUpNumber value={Math.abs(netTaxImpact)} />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Simulated optimal regime:{' '}
                <span className="text-[var(--primary-emerald)] font-semibold uppercase">
                  {simulatedResult.betterRegime} Regime
                </span>{' '}
                (Tax: {formatINR(simulatedTax)})
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] text-xs font-mono space-y-1.5 min-w-[200px]">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Current Tax:</span>
                <span className="text-[var(--text-primary)]">{formatINR(baselineTax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Simulated Tax:</span>
                <span className="text-[var(--text-primary)]">{formatINR(simulatedTax)}</span>
              </div>
              <div className="border-t border-[var(--hairline)] pt-1 flex justify-between font-semibold">
                <span className="text-[var(--text-secondary)]">Net Delta:</span>
                <span className={netTaxImpact <= 0 ? 'text-[var(--primary-emerald)]' : 'text-[var(--semantic-danger)]'}>
                  {netTaxImpact <= 0 ? '-' : '+'}
                  {formatINR(Math.abs(netTaxImpact))}
                </span>
              </div>
            </div>
          </div>

          {/* Bar Chart: Baseline vs Simulated */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)]">
            <h3 className="font-serif text-lg font-medium text-[var(--text-primary)] mb-1">
              Before vs After Tax Exposure (By Regime)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-6 font-sans">
              Shows how what-if parameters shift the breakeven point between regimes.
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="scenario" stroke="#6F7782" fontSize={12} />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} stroke="#6F7782" fontSize={11} />
                  <Tooltip
                    formatter={(val: any) => [formatINR(val)]}
                    contentStyle={{
                      backgroundColor: '#12161B',
                      borderColor: '#232A33',
                      borderRadius: 12,
                      fontSize: 12,
                      color: '#F3EFE6',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="Old Regime" fill="#B87333" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="New Regime" fill="#1F9D77" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Working Papers Advisory Note */}
          <div className="p-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
            <strong className="text-[var(--text-primary)]">CAdesk Planning Insight:</strong> Combining Corporate NPS (Sec 80CCD(2))
            with high CTC growth typically maximizes post-tax wealth because employer contributions bypass Section 80C caps
            and are completely deductible before slab rates.
          </div>
        </div>
      </div>
    </div>
  );
};
