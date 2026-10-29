/**
 * Screen 3: Individual Dashboard
 * Dynamic pipeline driven by uploaded documents:
 * - Headline "Tax you could save", Net Refund / Payable, TDS Credit
 * - Statutory cross-checks status & flags
 * - Old vs New Regime comparison chart
 * - Empty state: "Upload documents to begin" + "Load demo data" button
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
  Upload,
  CheckCircle2,
  AlertTriangle,
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
  const {
    activeClient,
    taxResult,
    taxInputs,
    crossChecks,
    flags,
    documents,
    loadDemoData,
    isAnalyzing,
  } = useApp();

  // Empty State: No uploaded documents and no demo data loaded
  if (documents.length === 0 && !isAnalyzing) {
    return (
      <div className="space-y-8">
        <PageHeader
          title={activeClient.name}
          description="FY 2025-26 (AY 2026-27) • Individual Tax Assessment"
          badge={
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--hairline)]">
              PAN: {activeClient.panMasked}
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
            <Upload className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-medium text-[var(--text-primary)]">
              Upload documents to begin
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              Please upload Form 16, Salary Slips, Form 26AS, or AIS/TIS to generate dynamic statutory tax calculations.
              All tax figures are computed deterministically.
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

  const betterRegime = taxResult.recommended;
  const betterTax =
    betterRegime === 'new' ? taxResult.new.total_tax : taxResult.old.total_tax;
  const otherTax =
    betterRegime === 'new' ? taxResult.old.total_tax : taxResult.new.total_tax;
  const taxYouCouldSave = taxResult.savings;
  const isRefund = taxResult.net_payable_or_refund < 0;
  const refundOrPayableAmount = Math.abs(taxResult.net_payable_or_refund);

  const chartData = [
    {
      name: 'Old Regime',
      tax: taxResult.old.total_tax,
      color: betterRegime === 'old' ? '#1F9D77' : '#6F7782',
    },
    {
      name: 'New Regime (FY26)',
      tax: taxResult.new.total_tax,
      color: betterRegime === 'new' ? '#1F9D77' : '#6F7782',
    },
  ];

  const allChecksPass = crossChecks.length > 0 && crossChecks.every((c) => c.status === 'PASS');

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
              variant={allChecksPass ? 'ca_reviewed' : 'ai_prepared'}
              label={allChecksPass ? '5/5 Cross-Checks PASS' : 'AI Working Paper Ready'}
            />
          </div>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadDemoData()}
              className="px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--accent-gold)] text-xs font-mono transition-colors border border-[var(--hairline)] flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Demo Data</span>
            </button>
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

      {/* Flags Alert Banner */}
      {flags.length > 0 && (
        <div className="space-y-2">
          {flags.map((f, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                f.severity === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-mono">{f.flag}</span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--surface)] border border-current uppercase">
                {f.type}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Next Best Action Card */}
      <NextActionCard
        title={`Lock Your FY 2025-26 Regime Choice: ${betterRegime === 'new' ? 'New Tax Regime' : 'Old Tax Regime'}`}
        description={`Our deterministic engine confirmed that the ${betterRegime === 'new' ? 'New Tax Regime (Sec 115BAC)' : 'Old Tax Regime'} saves you ${formatINR(taxYouCouldSave)} with a net ${isRefund ? 'refund' : 'payable'} of ${formatINR(refundOrPayableAmount)}. Review your full breakdown.`}
        actionLabel="Review Regime Breakdown"
        actionLink="/tax-optimization"
        tone="emerald"
        badge="Tax Optimization"
      />

      {/* KPI Quad: Headline Savings, Estimated Tax, TDS Credit, Net Refund / Payable */}
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
              Alt Regime: {formatINR(otherTax)}
            </span>
            <CitationChip section={betterRegime === 'new' ? '115BAC' : 'Old'} />
          </div>
        </div>

        {/* Card 3: TDS Credit Reconciled */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] relative">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-1">
            TDS Credit (Form 26AS)
          </span>
          <div className="font-serif text-3xl sm:text-4xl text-[var(--text-primary)] font-semibold tracking-tight">
            <CountUpNumber value={taxResult.tds_credit} />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary-emerald)]" />
            <span className="font-mono">Reconciled with TRACES</span>
          </div>
        </div>

        {/* Card 4: Net Refund Due / Payable */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block mb-1">
              {isRefund ? 'Net Refund Due' : 'Net Tax Payable'}
            </span>
            <div className={`font-serif text-3xl font-semibold tracking-tight ${isRefund ? 'text-[var(--primary-emerald)]' : 'text-amber-400'}`}>
              <CountUpNumber value={refundOrPayableAmount} />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
              {isRefund ? 'Direct credit to verified bank account' : 'Advance/Self-assessment required'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-[var(--primary-emerald)]" />
          </div>
        </div>
      </div>

      {/* Main Grid: Mini-Chart & Missed Deductions Left (8 cols) & Statutory Cross-Checks Right (4 cols) */}
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
                  Evaluated against standard deduction (₹75k), 111A/112A capital gains, and Sec 87A rebate limits
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
                    ? `Opt for New Tax Regime. FY 2025-26 statutory provisions save ₹${taxYouCouldSave.toLocaleString('en-IN')}`
                    : `Opt for Old Tax Regime. Deductions (HRA + 80C + 80D) save ₹${taxYouCouldSave.toLocaleString('en-IN')}`}
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

          {/* Statutory Cross-Checks Box */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--primary-emerald)]" />
                <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                  Statutory Cross-Checks ({crossChecks.filter((c) => c.status === 'PASS').length}/{crossChecks.length} PASS)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[var(--accent-gold)]">
                Automated Verification
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {crossChecks.map((check, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[var(--text-primary)] font-medium font-sans block">
                      {check.check}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {check.details}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wider shrink-0 border ${
                      check.status === 'PASS'
                        ? 'bg-[var(--surface)] text-[var(--primary-emerald)] border-[var(--primary-emerald)]/40'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    }`}
                  >
                    {check.status}
                  </span>
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
