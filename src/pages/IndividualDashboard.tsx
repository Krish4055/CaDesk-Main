/**
 * Screen 3: Individual Dashboard
 * Net-worth card, estimated tax liability, "Tax you could save" headline number,
 * regime comparison mini-chart, upcoming deadlines, recent AI insights, document completeness ring.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  FileCheck2,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Calculator,
  FolderLock,
  MessageSquare,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/taxEngine';
import { StatusBadge, CitationChip } from '../components/common/StatusBadges';
import { MOCK_DEADLINES } from '../data/mockGoals';
import { PageHeader } from '../components/common/PageHeader';
import { JourneyStepper } from '../components/common/JourneyStepper';
import { NextActionCard } from '../components/common/NextActionCard';
import { CountUpNumber } from '../components/common/CountUpNumber';

export const IndividualDashboard: React.FC = () => {
  const { activeClient } = useApp();
  const taxResult = activeClient.taxResult;

  if (!taxResult) return null;

  const betterRegime = taxResult.betterRegime;
  const betterTax =
    betterRegime === 'new'
      ? taxResult.newRegime.totalTaxLiability
      : taxResult.oldRegime.totalTaxLiability;
  const otherTax =
    betterRegime === 'new'
      ? taxResult.oldRegime.totalTaxLiability
      : taxResult.newRegime.totalTaxLiability;
  const taxYouCouldSave = Math.max(0, otherTax - betterTax);

  const chartData = [
    {
      name: 'Old Regime',
      tax: taxResult.oldRegime.totalTaxLiability,
      color: betterRegime === 'old' ? '#1F9D77' : '#6F7782',
    },
    {
      name: 'New Regime (FY26)',
      tax: taxResult.newRegime.totalTaxLiability,
      color: betterRegime === 'new' ? '#1F9D77' : '#6F7782',
    },
  ];

  const docCompletenessPercent = Math.round((activeClient.documentsCount / 6) * 100);

  return (
    <div className="space-y-8">
      {/* Standardized PageHeader */}
      <PageHeader
        title={activeClient.name}
        description={`FY 2025-26 (AY 2026-27) • Supervised by ${activeClient.assignedStaff}`}
        badge={
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--hairline)]">
              PAN: {activeClient.panMasked}
            </span>
            <StatusBadge
              variant={activeClient.signOffStatus === 'approved' ? 'ca_reviewed' : 'ai_prepared'}
              label={activeClient.signOffStatus === 'approved' ? 'CA Signed Off' : 'AI Working Paper Ready'}
            />
          </div>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              to="/agent-chat"
              className="px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors border border-[var(--hairline)] flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[var(--primary-emerald)]" />
              <span>Ask Agent</span>
            </Link>
            <Link
              to="/tax-optimization"
              className="px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-mono font-medium flex items-center gap-2 transition-all shadow-[var(--shadow-soft)]"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Optimize Regime</span>
            </Link>
          </div>
        }
      />

      {/* Persistent Journey Stepper */}
      <JourneyStepper currentStepId="analyze" />

      {/* Next Best Action Card */}
      <NextActionCard
        title="Lock Your FY 2025-26 Regime Choice Before December Advance Tax"
        description={`Our deterministic engine found that the ${betterRegime === 'new' ? 'New Tax Regime' : 'Old Tax Regime'} saves you ${formatINR(taxYouCouldSave)} compared to the alternative. Review your step-by-step breakdown.`}
        actionLabel="Review Regime Breakdown"
        actionLink="/tax-optimization"
        tone="emerald"
        badge="Tax Optimization"
      />

      {/* KPI Quad: Headline Savings, Estimated Tax, Net Worth, Completeness */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tax You Could Save (HEADLINE NUMBER) */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] shadow-[var(--shadow-soft)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-16 h-16 text-[var(--accent-gold)]" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent-gold)] block mb-1">
            Tax You Could Save
          </span>
          <div className="font-serif text-3xl sm:text-4xl text-[var(--accent-gold)] font-semibold tracking-tight">
            <CountUpNumber value={taxYouCouldSave} />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span className="text-[var(--primary-emerald)] font-medium font-mono">
              Via {betterRegime === 'new' ? 'New Regime (FY26)' : 'Old Regime'}
            </span>
          </div>
        </div>

        {/* Card 2: Estimated Tax Liability */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] relative">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-1">
            Estimated Tax Liability
          </span>
          <div className="font-serif text-3xl sm:text-4xl text-[var(--text-primary)] font-semibold tracking-tight">
            <CountUpNumber value={betterTax} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>
              Effective Rate:{' '}
              {betterRegime === 'new'
                ? taxResult.newRegime.effectiveTaxRate
                : taxResult.oldRegime.effectiveTaxRate}
              %
            </span>
            <CitationChip section={betterRegime === 'new' ? '115BAC' : 'Old'} />
          </div>
        </div>

        {/* Card 3: Net Worth Estimate */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] relative">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-1">
            Tracked Net Worth
          </span>
          <div className="font-serif text-3xl sm:text-4xl text-[var(--text-primary)] font-semibold tracking-tight">
            <CountUpNumber value={activeClient.netWorthEstimate || 14500000} />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <TrendingUp className="w-3.5 h-3.5 text-[var(--primary-emerald)]" />
            <span>Across MF, EPF, NPS & Property</span>
          </div>
        </div>

        {/* Card 4: Document Completeness */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              Document Completeness
            </span>
            <div className="font-serif text-3xl font-semibold text-[var(--text-primary)]">
              {docCompletenessPercent}%
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
              {activeClient.documentsCount} of 6 uploaded
            </p>
          </div>
          {/* Radial visual indicator */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[var(--hairline)]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[var(--primary-emerald)] transition-all duration-1000 ease-out"
                strokeDasharray={`${docCompletenessPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <FolderLock className="w-4 h-4 text-[var(--primary-emerald)] absolute" />
          </div>
        </div>
      </div>

      {/* Main Grid: Mini-Chart & Missed Deductions Left (8 cols) & Deadlines/CA Supervision Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Regime Comparison Box */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-xl font-medium text-[var(--text-primary)]">
                  Regime Comparison (FY 2025-26)
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Evaluated against standard deduction (₹75k) and Sec 87A rebate limits
                </p>
              </div>
              <Link
                to="/tax-optimization"
                className="text-xs font-mono text-[var(--primary-emerald)] hover:underline flex items-center gap-1"
              >
                <span>Full Calculator</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    stroke="#6F7782"
                    fontSize={11}
                  />
                  <YAxis type="category" dataKey="name" stroke="#A7AEB8" fontSize={12} width={110} />
                  <Tooltip
                    formatter={(val: any) => [formatINR(val), 'Tax Liability']}
                    contentStyle={{
                      backgroundColor: '#12161B',
                      borderColor: '#232A33',
                      borderRadius: 12,
                      fontSize: 12,
                      color: '#F3EFE6',
                    }}
                  />
                  <Bar dataKey="tax" radius={[0, 6, 6, 0]} barSize={26}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom summary highlight */}
            <div className="mt-4 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-[var(--text-primary)] font-semibold">
                  Recommended Position:
                </span>
                <p className="text-xs text-[var(--primary-emerald)] mt-0.5">
                  {betterRegime === 'new'
                    ? 'Opt for New Tax Regime. FY 2025-26 revised slabs save ₹' +
                      taxYouCouldSave.toLocaleString('en-IN')
                    : 'Opt for Old Tax Regime. Deductions (HRA + Home Loan) outweigh standard slabs.'}
                </p>
              </div>
              <Link
                to="/tax-optimization"
                className="px-3.5 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors border border-[var(--hairline)] shrink-0 self-start sm:self-auto"
              >
                Review Breakdown
              </Link>
            </div>
          </div>

          {/* Missed Deductions & Insights */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />
                <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                  AI-Identified Deductions & Adjustments
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {taxResult.missedDeductions.length} opportunities detected
              </span>
            </div>

            <div className="space-y-3">
              {taxResult.missedDeductions.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] hover:border-[var(--accent-gold)]/30 transition-colors flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[var(--text-primary)]">
                        {item.title}
                      </span>
                      <CitationChip section={item.section} />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      {item.reasoning}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-medium text-[var(--accent-gold)] block">
                      +{formatINR(item.potentialSavingOld)}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      Old Regime Save
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Deadlines & CA Supervision */}
        <div className="lg:col-span-4 space-y-6">
          {/* Statutory Deadlines */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--accent-copper)]" />
                <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                  Statutory Deadlines
                </h3>
              </div>
              <Link to="/deadlines" className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {MOCK_DEADLINES.slice(0, 3).map((dl) => (
                <div
                  key={dl.id}
                  className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--text-primary)]">{dl.title}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        dl.priority === 'urgent'
                          ? 'bg-[var(--surface)] text-[var(--semantic-danger)] border border-[var(--semantic-danger)]/40'
                          : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--hairline)]'
                      }`}
                    >
                      {dl.dueDate}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-snug">{dl.penaltyNote}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CA Supervision & Working Papers Log */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--accent-gold)]" />
                <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                  CA Working Paper Status
                </h3>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)]">
                <div className="flex items-center justify-between text-[var(--text-secondary)] font-mono text-[11px]">
                  <span>Supervising CA:</span>
                  <span className="text-[var(--text-primary)] font-semibold">{activeClient.assignedStaff}</span>
                </div>
                <div className="flex items-center justify-between text-[var(--text-secondary)] font-mono text-[11px] mt-1.5">
                  <span>Sign-off State:</span>
                  <span className="text-[var(--primary-emerald)] uppercase font-semibold">
                    {activeClient.signOffStatus}
                  </span>
                </div>
              </div>

              {activeClient.workingPaperNotes.length > 0 && (
                <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)]">
                  <div className="text-[11px] font-mono text-[var(--text-muted)] mb-1">
                    Latest Note ({activeClient.workingPaperNotes[0].author}):
                  </div>
                  <p className="text-[var(--text-secondary)] text-xs italic">
                    "{activeClient.workingPaperNotes[0].text}"
                  </p>
                </div>
              )}

              <Link
                to={`/reports/${activeClient.id}`}
                className="w-full py-2.5 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-primary)] font-mono text-xs flex items-center justify-center gap-2 transition-colors border border-[var(--hairline)]"
              >
                <FileCheck2 className="w-4 h-4 text-[var(--accent-gold)]" />
                <span>Working Paper Summary</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
