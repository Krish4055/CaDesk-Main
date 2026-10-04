/**
 * Screen 11: CA Client Workspace / Working Papers (Flagship Reference Screen)
 * Comprehensive audit, reconciliation, and sign-off workspace for a specific client.
 * Features:
 * - Standardized PageHeader
 * - JourneyStepper showing current statutory progress
 * - NextActionCard guiding partner review
 * - 7 dedicated working paper tabs (Overview, Documents, Income & Deductions, Tax Computation, Agent Findings, Notes, Activity)
 * - Sign-Off panel with confirmation modal for irreversible audit freeze
 * - Immutable cryptographic audit trail with SHA-256 hashes
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FolderLock,
  Calculator,
  Cpu,
  FileText,
  Clock,
  Send,
  Lock,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Printer,
  History,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ClientProfile } from '../types';
import { clientService } from '../services/clientService';
import { documentService } from '../services/documentService';
import { formatINR } from '../lib/taxEngine';
import { StatusBadge, CitationChip } from '../components/common/StatusBadges';
import { PageHeader } from '../components/common/PageHeader';
import { JourneyStepper } from '../components/common/JourneyStepper';
import { NextActionCard } from '../components/common/NextActionCard';
import { CountUpNumber } from '../components/common/CountUpNumber';

type WorkspaceTab =
  | 'overview'
  | 'documents'
  | 'income_deductions'
  | 'computation'
  | 'findings'
  | 'notes'
  | 'activity';

export const CAClientWorkspace: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { activeClient, setActiveClientId, refreshClientData } = useApp();

  const [client, setClient] = useState<ClientProfile>(activeClient);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [clientDocs, setClientDocs] = useState<any[]>([]);

  // Sign-off panel state
  const [caName, setCaName] = useState('CA Ramesh Sharma');
  const [caMembershipNo, setCaMembershipNo] = useState('FCA-084920');
  const [reviewComment, setReviewComment] = useState('');
  const [signOffStatusMessage, setSignOffStatusMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // New Note state
  const [newNoteText, setNewNoteText] = useState('');
  const [isPrivateNote, setIsPrivateNote] = useState(true);

  useEffect(() => {
    if (clientId) {
      loadWorkspaceClient(clientId);
    }
  }, [clientId]);

  const loadWorkspaceClient = async (id: string) => {
    const loaded = await clientService.getClientById(id);
    if (loaded) {
      setClient(loaded);
      setActiveClientId(loaded.id);
    }
    const docs = await documentService.getDocuments(id);
    setClientDocs(docs);
  };

  const handleConfirmSignOff = async () => {
    if (!client) return;
    setShowConfirmModal(false);
    const updated = await clientService.signOffClient(
      client.id,
      caName,
      caMembershipNo,
      'approved',
      reviewComment || 'All working papers and deductions reconciled against 26AS/AIS.'
    );
    setClient(updated);
    await refreshClientData();
    setSignOffStatusMessage(
      'Working papers approved and cryptographically hashed for UDIN generation.'
    );
    setReviewComment('');
    setTimeout(() => setSignOffStatusMessage(null), 4000);
  };

  const handleRequestChanges = async () => {
    if (!client) return;
    const updated = await clientService.signOffClient(
      client.id,
      caName,
      caMembershipNo,
      'changes_requested',
      reviewComment || 'Clarification requested regarding co-ownership interest share.'
    );
    setClient(updated);
    await refreshClientData();
    setSignOffStatusMessage('Changes requested. Client notified in dashboard.');
    setReviewComment('');
    setTimeout(() => setSignOffStatusMessage(null), 4000);
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim() || !client) return;
    const updated = await clientService.addWorkingPaperNote(client.id, {
      author: caName,
      authorRole: 'Chartered Accountant',
      text: newNoteText,
      isPrivateToCA: isPrivateNote,
    });
    setClient(updated);
    setNewNoteText('');
  };

  if (!client || !client.taxResult) return null;

  const result = client.taxResult;

  const tabs: { id: WorkspaceTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: `Documents (${clientDocs.length})` },
    { id: 'income_deductions', label: 'Income & Deductions' },
    { id: 'computation', label: 'Tax Computation' },
    { id: 'findings', label: 'Agent Findings' },
    { id: 'notes', label: `Notes (${client.workingPaperNotes.length})` },
    { id: 'activity', label: `Audit Trail (${client.auditTrail.length})` },
  ];

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Standardized PageHeader */}
      <PageHeader
        title={client.name}
        description={`Digital Working Papers for FY ${client.financialYear} (AY 2026-27). Supervised by ${client.assignedStaff}.`}
        badge={
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--hairline)]">
              {client.panMasked}
            </span>
            <StatusBadge
              variant={client.signOffStatus === 'approved' ? 'ca_reviewed' : 'needs_attention'}
              label={client.signOffStatus === 'approved' ? 'CA Approved' : 'Review Required'}
            />
          </div>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              to="/ca/dashboard"
              className="px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono transition-colors border border-[var(--hairline)] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Client List</span>
            </Link>
            <Link
              to={`/reports/${client.id}`}
              className="px-4 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-primary)] text-xs font-mono flex items-center gap-2 transition-all border border-[var(--hairline)]"
            >
              <Printer className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
              <span>Print Working Papers</span>
            </Link>
          </div>
        }
      />

      {/* Guided Client Journey Stepper */}
      <JourneyStepper currentStepId={client.signOffStatus === 'approved' ? 'signoff_file' : 'review'} />

      {/* Persistent Mock Mode Amber Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>Demo data: no OCR model is loaded. Extracted values are sample data, not read from your document.</span>
      </div>

      {/* Dynamic Next Action Card */}
      <NextActionCard
        title={
          client.signOffStatus === 'approved'
            ? 'Working Papers Approved & Sealed'
            : 'Fiduciary Sign-Off Pending for Assessment Year 2026-27'
        }
        description={
          client.signOffStatus === 'approved'
            ? `Signed off by ${client.signedBy || caName} on ${client.signedAt || 'today'}. UDIN token verified. Working papers locked for filing.`
            : `AI Verifier has audited Form 16, CAMS capital gains, and Section 80C deductions. Review the computations and execute partner sign-off.`
        }
        actionLabel={client.signOffStatus === 'approved' ? 'View PDF Summary' : 'Review & Sign Off Below'}
        actionLink={client.signOffStatus === 'approved' ? `/reports/${client.id}` : undefined}
        onActionClick={
          client.signOffStatus !== 'approved'
            ? () => {
                setActiveTab('overview');
                const el = document.getElementById('sign-off-panel');
                el?.scrollIntoView({ behavior: 'smooth' });
              }
            : undefined
        }
        tone={client.signOffStatus === 'approved' ? 'emerald' : 'gold'}
        badge={client.signOffStatus === 'approved' ? 'Status: Approved' : 'Partner Decision'}
      />

      {signOffStatusMessage && (
        <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--primary-emerald)]/40 text-[var(--primary-emerald)] text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[var(--primary-emerald)]" />
          <span>{signOffStatusMessage}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-[var(--border)] overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all border ${
              activeTab === tab.id
                ? 'border-[var(--accent-gold)]/50 bg-[var(--primary-emerald-tint)] text-[var(--text-primary)] font-semibold'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)]">
                <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase block mb-1">
                  Gross Salary Income
                </span>
                <div className="font-serif text-2xl font-semibold text-[var(--text-primary)]">
                  <CountUpNumber value={client.taxInputs.grossSalary} />
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Form 16 Part B</span>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)]">
                <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase block mb-1">
                  Optimal Regime
                </span>
                <div className="font-serif text-2xl font-semibold text-[var(--primary-emerald)] uppercase">
                  {result.betterRegime} Regime
                </div>
                <span className="text-[10px] font-mono text-[var(--accent-gold)]">
                  Saves {formatINR(result.taxDifference)}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)]">
                <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase block mb-1">
                  Net Tax Liability
                </span>
                <div className="font-serif text-2xl font-semibold text-[var(--text-primary)]">
                  <CountUpNumber
                    value={
                      result.betterRegime === 'new'
                        ? result.newRegime.totalTaxLiability
                        : result.oldRegime.totalTaxLiability
                    }
                  />
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Inclusive of 4% Cess</span>
              </div>
            </div>

            {/* Fiduciary Assessment Summary */}
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--accent-gold)]" />
                <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                  AI Verifier & Fiduciary Assessment Summary
                </h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                The taxpayer qualifies for individual resident tax benefits for Assessment Year 2026-27.
                Under the revised New Tax Regime (Section 115BAC), standard deduction of ₹75,000 has been applied.
                Reconciliation against AIS/TIS confirms TDS match of ₹4,12,400 deposited by employer.
              </p>

              <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] text-xs font-mono text-[var(--text-secondary)] space-y-2">
                <div className="flex justify-between">
                  <span>Assigned Supervising Partner:</span>
                  <span className="text-[var(--text-primary)] font-semibold">{client.assignedStaff}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Sign-off State:</span>
                  <span className="text-[var(--accent-gold)] font-semibold uppercase">
                    {client.signOffStatus}
                  </span>
                </div>
                {client.signedBy && (
                  <div className="flex justify-between">
                    <span>Approved By:</span>
                    <span className="text-[var(--text-primary)]">
                      {client.signedBy} ({client.caMembershipNo})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Review & Sign-Off Panel */}
          <div id="sign-off-panel" className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] shadow-[var(--shadow-elevated)] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                <ShieldCheck className="w-5 h-5 text-[var(--accent-gold)]" />
                <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                  CA Review & Sign-Off Panel
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-[var(--text-muted)] mb-1">
                    Chartered Accountant Name
                  </label>
                  <input
                    type="text"
                    value={caName}
                    onChange={(e) => setCaName(e.target.value)}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl p-2 text-xs text-[var(--text-primary)] font-sans outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[var(--text-muted)] mb-1">
                    ICAI Membership / UDIN Prefix
                  </label>
                  <input
                    type="text"
                    value={caMembershipNo}
                    onChange={(e) => setCaMembershipNo(e.target.value)}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl p-2 text-xs text-[var(--text-primary)] font-mono outline-none focus:border-[var(--accent-gold)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[var(--text-muted)] mb-1">
                    Working Paper Sign-Off Note / Remarks
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter review remarks or modifications requested..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl p-2.5 text-xs text-[var(--text-primary)] font-sans outline-none resize-none focus:border-[var(--accent-gold)]"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full py-2.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-[var(--shadow-soft)]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent-gold)]" />
                    <span>Approve & Sign Off Working Papers</span>
                  </button>

                  <button
                    onClick={handleRequestChanges}
                    className="w-full py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-xs flex items-center justify-center gap-2 transition-colors border border-[var(--hairline)]"
                  >
                    <AlertTriangle className="w-4 h-4 text-[var(--semantic-warning)]" />
                    <span>Request Changes / Additional Docs</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Documents */}
      {activeTab === 'documents' && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
              Attached Client Working Paper Documents
            </h3>
            <Link to="/vault" className="text-xs font-mono text-[var(--primary-emerald)] hover:underline">
              Open Document Vault →
            </Link>
          </div>

          <div className="space-y-3">
            {clientDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[var(--primary-emerald)]" />
                  <div>
                    <span className="text-xs font-medium text-[var(--text-primary)]">{doc.fileName}</span>
                    <span className="block text-[11px] text-[var(--text-muted)] font-mono">
                      Category: {doc.category} • Confidence: {doc.overallConfidence}%
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono capitalize px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--hairline)]">
                  {doc.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Income & Deductions */}
      {activeTab === 'income_deductions' && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-6">
          <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
            Income Heads & Chapter VI-A Allowed Deductions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] space-y-3 font-mono text-xs">
              <span className="font-serif text-sm font-semibold text-[var(--text-primary)] block border-b border-[var(--hairline)] pb-2">
                Income Heads (FY 2025-26)
              </span>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Gross Salary (Sec 17):</span>
                <span className="text-[var(--text-primary)]">{formatINR(client.taxInputs.grossSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Other Sources (Savings/FD):</span>
                <span className="text-[var(--text-primary)]">{formatINR(client.taxInputs.otherIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">LTCG u/s 112A:</span>
                <span className="text-[var(--text-primary)]">{formatINR(client.taxInputs.longTermCapitalGains)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">STCG u/s 111A:</span>
                <span className="text-[var(--text-primary)]">{formatINR(client.taxInputs.shortTermCapitalGains)}</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] space-y-3 font-mono text-xs">
              <span className="font-serif text-sm font-semibold text-[var(--text-primary)] block border-b border-[var(--hairline)] pb-2">
                Allowed Deductions (Old Regime)
              </span>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Section 80C:</span>
                <span className="text-[var(--text-primary)]">{formatINR(client.taxInputs.section80C)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Section 80CCD(1B) NPS:</span>
                <span className="text-[var(--text-primary)]">{formatINR(client.taxInputs.section80CCD1B)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Section 80D Mediclaim:</span>
                <span className="text-[var(--text-primary)]">{formatINR(client.taxInputs.section80D)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Section 80CCD(2) Employer NPS:</span>
                <span className="text-[var(--primary-emerald)]">{formatINR(client.taxInputs.section80CCD2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Tax Computation */}
      {activeTab === 'computation' && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
              Deterministic Tax Math Breakdown (AY 2026-27)
            </h3>
            <CitationChip section="FY 2025-26" act="CBDT / Finance Act 2024" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old Regime Box */}
            <div className="p-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] space-y-2.5 font-mono text-xs">
              <div className="font-serif text-base text-[var(--text-primary)] font-semibold mb-2">
                Old Tax Regime
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Net Taxable Income:</span>
                <span className="text-[var(--text-primary)]">{formatINR(result.oldRegime.netTaxableIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Standard Deduction:</span>
                <span className="text-[var(--semantic-danger)]">-{formatINR(result.oldRegime.standardDeduction)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Slab Tax:</span>
                <span className="text-[var(--text-primary)]">{formatINR(result.oldRegime.slabTax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Cess (4%):</span>
                <span className="text-[var(--text-primary)]">{formatINR(result.oldRegime.cess)}</span>
              </div>
              <div className="border-t border-[var(--hairline)] pt-2 flex justify-between font-bold text-sm">
                <span className="text-[var(--text-primary)]">Total Tax:</span>
                <span className="text-[var(--text-primary)]">{formatINR(result.oldRegime.totalTaxLiability)}</span>
              </div>
            </div>

            {/* New Regime Box */}
            <div className="p-5 rounded-xl bg-[var(--primary-emerald-tint)] border border-[var(--primary-emerald)]/40 space-y-2.5 font-mono text-xs">
              <div className="font-serif text-base text-[var(--text-primary)] font-semibold mb-2 flex items-center justify-between">
                <span>New Tax Regime (FY26)</span>
                <span className="text-xs font-mono text-[var(--accent-gold)]">RECOMMENDED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Net Taxable Income:</span>
                <span className="text-[var(--text-primary)]">{formatINR(result.newRegime.netTaxableIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Standard Deduction:</span>
                <span className="text-[var(--primary-emerald)]">-{formatINR(result.newRegime.standardDeduction)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Slab Tax:</span>
                <span className="text-[var(--text-primary)]">{formatINR(result.newRegime.slabTax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Cess (4%):</span>
                <span className="text-[var(--text-primary)]">{formatINR(result.newRegime.cess)}</span>
              </div>
              <div className="border-t border-[var(--primary-emerald)]/40 pt-2 flex justify-between font-bold text-sm">
                <span className="text-[var(--text-primary)]">Total Tax:</span>
                <span className="text-[var(--primary-emerald)] font-bold">{formatINR(result.newRegime.totalTaxLiability)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Agent Findings */}
      {activeTab === 'findings' && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-4">
          <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
            Specialist Agent Diagnostic Traces
          </h3>
          <div className="space-y-3">
            {result.missedDeductions.map((f, i) => (
              <div key={i} className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-primary)]">{f.title}</span>
                  <CitationChip section={f.section} rulesAsOf={f.citationDate} />
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">{f.reasoning}</p>
                <div className="text-[11px] font-mono text-[var(--accent-gold)]">
                  Potential saving under Old Regime: {formatINR(f.potentialSavingOld)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Notes */}
      {activeTab === 'notes' && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
              Working Paper Notes & Statutory Remarks
            </h3>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              Peer-Review Working Paper Standard
            </span>
          </div>

          {/* Add Note Input */}
          <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] space-y-3">
            <textarea
              rows={2}
              placeholder="Add observation (e.g. verified 26AS TDS credits against TRACES portal)..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--hairline)] rounded-xl p-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] resize-none font-sans"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivateNote}
                  onChange={(e) => setIsPrivateNote(e.target.checked)}
                  className="accent-[var(--primary-emerald)] rounded"
                />
                <span>Private CA Internal Note</span>
              </label>

              <button
                onClick={handleAddNote}
                className="px-4 py-1.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white font-mono text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </button>
            </div>
          </div>

          {/* Notes History */}
          <div className="space-y-3">
            {client.workingPaperNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {note.author} ({note.authorRole})
                  </span>
                  <span className="text-[var(--text-muted)]">{note.timestamp}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">{note.text}</p>
                {note.isPrivateToCA && (
                  <span className="inline-block text-[10px] font-mono text-[var(--accent-copper)] bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--hairline)]">
                    Internal to Firm
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Immutable Audit Trail */}
      {activeTab === 'activity' && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[var(--accent-gold)]" />
              <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                Immutable Cryptographic Audit Trail
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              SHA-256 State Anchored
            </span>
          </div>

          <div className="space-y-3">
            {client.auditTrail.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-[var(--primary-emerald)] font-semibold">{entry.action}</span>
                    <span className="text-[var(--text-muted)]">•</span>
                    <span className="text-[var(--text-primary)]">{entry.actorName}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans">{entry.details}</p>
                </div>

                <div className="text-right shrink-0 font-mono text-[11px] text-[var(--text-muted)]">
                  <div>{entry.timestamp}</div>
                  <div className="text-[var(--accent-gold)] mt-0.5">Hash: {entry.immutableHash}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Irreversible Action Confirmation Modal (Sign-Off Lock) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] p-6 space-y-4 shadow-[var(--shadow-elevated)]">
            <div className="flex items-center gap-3 text-[var(--accent-gold)] pb-2 border-b border-[var(--border)]">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)]">
                Confirm Statutory Sign-Off
              </h3>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
              You are about to issue a formal statutory sign-off for <strong className="text-[var(--text-primary)]">{client.name}</strong> (FY 2025-26).
              This action creates an immutable cryptographic audit record, locks the working papers from further edits, and prepares the UDIN token for filing.
            </p>

            <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] text-xs font-mono space-y-1 text-[var(--text-secondary)]">
              <div>Assessee: {client.name} [{client.panMasked}]</div>
              <div>Recommended: {result.betterRegime.toUpperCase()} REGIME</div>
              <div>Estimated Savings: {formatINR(result.taxDifference)}</div>
              <div>Certifying CA: {caName} ({caMembershipNo})</div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-xs border border-[var(--hairline)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOff}
                className="px-5 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white font-mono text-xs font-semibold flex items-center gap-2 shadow-[var(--shadow-soft)]"
              >
                <CheckCircle2 className="w-4 h-4 text-[var(--accent-gold)]" />
                <span>Confirm & Lock Working Papers</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
