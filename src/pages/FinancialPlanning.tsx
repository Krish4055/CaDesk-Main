/**
 * Screen 8: Financial Planning & Goal Wealth Simulator
 * Goals (retirement, child education, house, emergency fund) with progress,
 * required monthly investment, projected corpus growth charts, and tax-efficient
 * instrument options presented as educational information (not investment advice).
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Target,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MOCK_GOALS } from '../data/mockGoals';
import { formatINR } from '../lib/taxEngine';
import { FinancialGoal } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { JourneyStepper } from '../components/common/JourneyStepper';
import { NextActionCard } from '../components/common/NextActionCard';
import { CountUpNumber } from '../components/common/CountUpNumber';

export const FinancialPlanning: React.FC = () => {
  const [goals] = useState<FinancialGoal[]>(MOCK_GOALS);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal>(MOCK_GOALS[0]);

  const yearsRemaining = Math.max(1, selectedGoal.targetYear - 2026);
  const currentCorpus = selectedGoal.currentAmount;
  const targetCorpus = selectedGoal.targetAmount;
  const monthlyInv = selectedGoal.monthlySavingsRequired;

  const projectionData = [];
  let corpus = currentCorpus;
  const assumedCagr = 0.11;

  for (let i = 0; i <= yearsRemaining; i++) {
    const year = 2026 + i;
    projectionData.push({
      year: String(year),
      ProjectedCorpus: Math.round(corpus),
      TargetLine: targetCorpus,
    });
    corpus = corpus * (1 + assumedCagr) + monthlyInv * 12;
  }

  return (
    <div className="space-y-8">
      {/* Standardized PageHeader */}
      <PageHeader
        title="Financial Planning & Goal Wealth Simulator"
        description="Simulate long-term asset accumulation, required monthly savings, and tax-exempt holding instruments."
        badge={
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--accent-gold)] border border-[var(--hairline)]">
            Educational Model
          </span>
        }
      />

      {/* Guided Client Journey Stepper */}
      <JourneyStepper currentStepId="compute" />

      {/* Next Action Card */}
      <NextActionCard
        title={`Accelerate ${selectedGoal.title} by Increasing Monthly SIP`}
        description={`Target corpus of ${formatINR(selectedGoal.targetAmount)} by year ${selectedGoal.targetYear} requires an estimated ${formatINR(selectedGoal.monthlySavingsRequired)} monthly disciplined savings across EEE tax-exempt instruments.`}
        actionLabel="Review Asset Allocation"
        onActionClick={() => {
          const el = document.getElementById('allocation-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        tone="gold"
        badge="Corpus Milestone"
      />

      {/* Mandatory SEBI / Advisory Educational Disclaimer */}
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--hairline)] flex items-start gap-3">
        <Info className="w-5 h-5 text-[var(--accent-copper)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
          <strong className="text-[var(--text-primary)]">Regulatory Disclaimer:</strong> The tax-efficient instruments and corpus projections
          displayed on this platform are for structured tax education and planning simulations only. They do not constitute
          personalized investment advice, SEBI-registered portfolio management, or a solicitation of financial securities.
        </div>
      </div>

      {/* Goals Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {goals.map((g) => {
          const isSelected = selectedGoal.id === g.id;
          const prog = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));

          return (
            <button
              key={g.id}
              onClick={() => setSelectedGoal(g)}
              className={`p-5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'border-[var(--accent-gold)]/60 bg-[var(--surface)] ring-1 ring-[var(--accent-gold)]/30'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--hairline)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-gold)]">
                  Target: {g.targetYear}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">{prog}% Funded</span>
              </div>
              <h3 className="font-serif text-lg font-medium text-[var(--text-primary)] mb-1">{g.title}</h3>
              <div className="font-mono text-sm text-[var(--text-primary)] font-semibold mb-3">
                {formatINR(g.currentAmount)} / <span className="text-[var(--text-muted)] font-normal">{formatINR(g.targetAmount)}</span>
              </div>

              <div className="w-full h-1.5 bg-[var(--surface-raised)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--primary-emerald)]" style={{ width: `${prog}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Goal Deep Dive: Projection Chart Left (7 cols), Instruments Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recharts Area Chart Projection */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-medium text-[var(--text-primary)]">
                Corpus Growth Projection ({selectedGoal.targetYear})
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Simulated @ 11% annual blended CAGR + ₹{selectedGoal.monthlySavingsRequired.toLocaleString('en-IN')}/mo
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-[var(--text-muted)] block">Target Corpus</span>
              <span className="font-serif text-lg font-semibold text-[var(--accent-gold)]">
                {formatINR(selectedGoal.targetAmount)}
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="corpusGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1F9D77" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#1F9D77" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#6F7782" fontSize={11} />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 10000000).toFixed(1)}Cr`}
                  stroke="#6F7782"
                  fontSize={11}
                />
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
                <Area type="monotone" dataKey="ProjectedCorpus" stroke="#1F9D77" strokeWidth={2} fillOpacity={1} fill="url(#corpusGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-secondary)]">Required Monthly Investment:</span>
            <span className="text-[var(--primary-emerald)] font-semibold text-sm">
              <CountUpNumber value={selectedGoal.monthlySavingsRequired} /> / month
            </span>
          </div>
        </div>

        {/* Right: Suggested Tax-Efficient Instruments */}
        <div id="allocation-section" className="lg:col-span-5 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />
              <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                Tax-Efficient Allocation
              </h3>
            </div>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Statutory asset vehicles structured to minimize capital gains friction and leverage statutory exemptions:
          </p>

          <div className="space-y-3">
            {selectedGoal.suggestedInstruments.map((inst, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-primary)]">{inst.name}</span>
                  <span className="text-xs font-mono text-[var(--primary-emerald)] font-semibold">
                    {inst.allocationPercent}%
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[var(--text-muted)]">{inst.type}</div>
                <div className="text-[11px] text-[var(--text-secondary)] leading-snug pt-1 border-t border-[var(--border)]">
                  <span className="text-[var(--accent-gold)] font-medium">Tax Status: </span>
                  {inst.taxAdvantage}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
