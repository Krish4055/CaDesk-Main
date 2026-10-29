/**
 * Screen 11: CA Client Workspace / Working Papers (Flagship Reference Screen)
 * Comprehensive audit, reconciliation, and sign-off workspace for a specific client.
 * Built dynamically from:
 * - Extracted document fields (extractions)
 * - 5 statutory cross-checks (crossChecks)
 * - Conflict & audit flags (flags)
 * - Deterministic tax math (taxResult & taxInputs)
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
  Upload,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ClientProfile } from '../types';
import { clientService } from '../services/clientService';
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
  const {
    activeClient,
    setActiveClientId,
    refreshClientData,
    signOffActiveClient,
    taxResult,
    taxInputs,
    crossChecks,
    flags,
    extractions,
    documents,
    loadDemoData,
    hasUploadedDocs,
    isAnalyzing,
  } = useApp();

  const [client, setClient] = useState<ClientProfile>(activeClient);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');

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
    if (clientId && clientId !== activeClient.id && clientId !== 'ind-rohan') {
      loadWorkspaceClient(clientId);
    } else {
      setClient(activeClient);
    }
  }, [clientId, activeClient]);

  const displayClient = (hasUploadedDocs || documents.length > 0 || !clientId || clientId === activeClient.id || clientId === 'ind-rohan') ? activeClient : client;

  const loadWorkspaceClient = async (id: string) => {
    const loaded = await clientService.getClientById(id);
    if (loaded) {
      setClient(loaded);
      setActiveClientId(loaded.id);
    }
  };

  const handleConfirmSignOff = async () => {
    setShowConfirmModal(false);
    const targetId = displayClient.id || client.id || 'ind-rohan';
    const noteText = reviewComment || 'Form 16 TDS reconciled with 26AS. All 5 statutory cross-checks verified.';
    
    try {
      const updated = await signOffActiveClient(caName, caMembershipNo, noteText);
      setClient(updated);
      await refreshClientData();
      setSignOffStatusMessage(
        'Working papers approved and cryptographically hashed for UDIN generation. Opening generated report...'
      );
      setReviewComment('');

      // Open the generated report page immediately
      navigate(`/reports/${targetId}`);
    } catch (err: any) {
      console.error('Sign-off failed:', err);
      setSignOffStatusMessage(`Sign-off error: ${err.message || 'Unknown error'}`);
    }
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

  // Empty state
  if (documents.length === 0 && !isAnalyzing) {
    return (
      <div className="space-y-8">
        <PageHeader
          title={displayClient.name}
          description={`Digital Working Papers for FY ${displayClient.financialYear || '2025-26'} (AY 2026-27). Supervised by ${displayClient.assignedStaff || 'CA Ramesh Sharma'}.`}
          badge={
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--hairline)]">
              {displayClient.panMasked}
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

        <JourneyStepper currentStepId="review" />

        <div className="rounded-2xl border-2 border-dashed border-[var(--hairline)] p-12 text-center bg-[var(--surface)] space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface-raised)] flex items-center justify-center text-[var(--accent-gold)]">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-medium text-[var(--text-primary)]">
              Upload documents to begin
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              CA Client Workspace requires working paper extractions and statutory cross-checks.
              Upload working papers or load the verified demo test-pack to inspect.
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

  const allPassed = crossChecks.length > 0 && crossChecks.every((c) => c.status === 'PASS');

  const tabs: { id: WorkspaceTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: `Documents (${documents.length})` },
    { id: 'income_deductions', label: 'Income & Deductions' },
    { id: 'computation', label: 'Tax Computation' },
    { id: 'findings', label: `Cross-Checks & Flags (${crossChecks.length + flags.length})` },
    { id: 'notes', label: `Notes (${client.workingPaperNotes.length})` },
    { id: 'activity', label: `Audit Trail (${client.auditTrail.length})` },
  ];

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Standardized PageHeader */}
      <PageHeader
        title={displayClient.name}
        description={`Digital Working Papers for FY ${displayClient.financialYear || '2025-26'} (AY 2026-27). Supervised by ${displayClient.assignedStaff || 'CA Ramesh Sharma'}.`}
        badge={
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--hairline)]">
              {displayClient.panMasked}
            </span>
            <StatusBadge
              variant={allPassed ? 'ca_reviewed' : 'needs_attention'}
              label={allPassed ? '5/5 Cross-Checks PASS' : 'Review Required'}
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
              to={`/reports/${displayClient.id}`}
              className="px-4 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-primary)] text-xs font-mono flex items-center gap-2 transition-all border border-[var(--hairline)]"
            >
              <Printer className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
              <span>Print Working Papers</span>
            </Link>
          </div>
        }
      />

      {/* Guided Client Journey Stepper */}
      <JourneyStepper currentStepId={displayClient.signOffStatus === 'approved' ? 'signoff_file' : 'review'} />

      {/* Dynamic Next Action Card */}
      <NextActionCard
        title={
          displayClient.signOffStatus === 'approved'
            ? 'Working Papers Approved & Sealed'
            : 'Fiduciary Sign-Off Pending for Assessment Year 2026-27'
        }
        description={
          displayClient.signOffStatus === 'approved'
            ? `Signed off by ${displayClient.signedBy || caName} on ${displayClient.signedAt || 'today'}. UDIN token verified. Working papers locked for filing.`
            : `AI Verifier has executed all 5 statutory cross-checks against Form 16, 26AS, AIS/TIS, and salary slips. Review the working paper and execute partner sign-off.`
        }
        actionLabel={displayClient.signOffStatus === 'approved' ? 'View Generated Working Papers Report' : 'Review & Sign Off Below'}
        actionLink={displayClient.signOffStatus === 'approved' ? `/reports/${displayClient.id || 'ind-rohan'}` : undefined}
        onActionClick={
          displayClient.signOffStatus !== 'approved'
            ? () => {
                setActiveTab('overview');
                const el = document.getElementById('sign-off-panel');
                el?.scrollIntoView({ behavior: 'smooth' });
              }
            : undefined
        }
        tone={displayClient.signOffStatus === 'approved' ? 'emerald' : 'gold'}
        badge={displayClient.signOffStatus === 'approved' ? 'Status: Approved' : 'Partner Decision'}
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
          {/* Working Papers Summary & Regime Comparison (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                    Statutory Tax Position & Comparison
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                    Evaluated under Section 115BAC vs Old Regime with Chapter VI-A deductions
                  </p>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] font-semibold border border-[var(--primary-emerald)]/40">
                  Optimal: {taxResult.recommended.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)]">
                  <span className="text-[var(--text-muted)] block mb-1">New Regime Tax</span>
                  <span className="font-serif text-2xl font-bold text-[var(--primary-emerald)]">
                    {formatINR(taxResult.new.total_tax)}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] block mt-1">
                    GTI: {formatINR(taxResult.new.total_income)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)]">
                  <span className="text-[var(--text-muted)] block mb-1">Old Regime Tax</span>
                  <span className="font-serif text-2xl font-bold text-[var(--text-primary)]">
                    {formatINR(taxResult.old.total_tax)}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] block mt-1">
                    GTI: {formatINR(taxResult.old.total_income)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)]">
                  <span className="text-[var(--accent-gold)] font-semibold block mb-1">Net Savings</span>
                  <span className="font-serif text-2xl font-bold text-[var(--accent-gold)]">
                    {formatINR(taxResult.savings)}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] block mt-1">
                    {taxResult.net_payable_or_refund < 0
                      ? `Refund ${formatINR(Math.abs(taxResult.net_payable_or_refund))}`
                      : `Payable ${formatINR(taxResult.net_payable_or_refund)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Sign-off Panel */}
            <div id="sign-off-panel" className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[var(--accent-gold)]" />
                  <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                    Statutory CA Sign-Off Block
                  </h3>
                </div>
                <span className="text-xs font-mono text-[var(--text-muted)]">ICAI SQC-1 Compliant</span>
              </div>

              {displayClient.signOffStatus === 'approved' ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-semibold text-emerald-300 font-sans text-sm block">
                          Working Papers Certified &amp; Sealed
                        </span>
                        <span className="text-xs font-mono text-[var(--text-muted)]">
                          Signed by {displayClient.signedBy || caName} ({displayClient.caMembershipNo || caMembershipNo}) on {displayClient.signedAt || 'today'}. UDIN: 26084920AAAAAX9912.
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/reports/${displayClient.id || 'ind-rohan'}`}
                      className="px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>View Generated Report</span>
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                    Signing Chartered Accountant
                  </label>
                  <input
                    type="text"
                    value={caName}
                    onChange={(e) => setCaName(e.target.value)}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                    ICAI Membership Number
                  </label>
                  <input
                    type="text"
                    value={caMembershipNo}
                    onChange={(e) => setCaMembershipNo(e.target.value)}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                  Partner Review Remarks / Sign-Off Note
                </label>
                <textarea
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Form 16 TDS reconciled with 26AS. All 5 statutory cross-checks verified."
                  className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl p-3 text-xs text-[var(--text-primary)] outline-none resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleRequestChanges}
                  className="px-4 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--semantic-warning)] border border-[var(--semantic-warning)]/40 text-xs font-mono transition-colors"
                >
                  Request Client Changes
                </button>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="px-5 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-[var(--shadow-soft)]"
                >
                  <ShieldCheck className="w-4 h-4 text-[var(--accent-gold)]" />
                  <span>{displayClient.signOffStatus === 'approved' ? 'Re-Certify & Open Report' : 'Execute Fiduciary Sign-Off'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Key Details & Documents Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-4">
              <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                Verification Summary
              </h3>
              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between p-2.5 rounded-lg bg-[var(--surface-raised)]">
                  <span className="text-[var(--text-muted)]">TDS Credit:</span>
                  <span className="text-[var(--primary-emerald)] font-semibold">{formatINR(taxResult.tds_credit)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-[var(--surface-raised)]">
                  <span className="text-[var(--text-muted)]">Cross-Checks:</span>
                  <span className="text-[var(--primary-emerald)] font-semibold">
                    {crossChecks.filter((c) => c.status === 'PASS').length}/{crossChecks.length} PASS
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-[var(--surface-raised)]">
                  <span className="text-[var(--text-muted)]">Active Flags:</span>
                  <span className="text-[var(--accent-gold)] font-semibold">{flags.length} Flags</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-lg bg-[var(--surface-raised)]">
                  <span className="text-[var(--text-muted)]">Working Papers:</span>
                  <span className="text-[var(--text-primary)]">{documents.length} Files</span>
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
              Attached Client Working Paper Documents ({documents.length})
            </h3>
            <Link to="/vault" className="text-xs font-mono text-[var(--primary-emerald)] hover:underline">
              Open Document Vault →
            </Link>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[var(--primary-emerald)]" />
                  <div>
                    <span className="text-xs font-medium text-[var(--text-primary)]">{doc.fileName}</span>
                    <span className="block text-[11px] text-[var(--text-muted)] font-mono">
                      Category: {doc.category} • Confidence: {doc.overallConfidence}% • {doc.extractedFields.length} fields extracted
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
            Income Heads &amp; Chapter VI-A Allowed Deductions (TaxInputs)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] space-y-3 font-mono text-xs">
              <span className="font-serif text-sm font-semibold text-[var(--text-primary)] block border-b border-[var(--hairline)] pb-2">
                Income Heads (FY 2025-26)
              </span>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Gross Salary (Sec 17):</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxInputs.grossSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Basic Salary:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxInputs.basicSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">HRA Received:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxInputs.hraReceived)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Annual Rent Paid:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxInputs.rentPaidAnnual)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Savings Bank Interest:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxInputs.interestSavings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">FD Interest:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxInputs.interestFd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Dividend:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxInputs.dividend)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">LTCG u/s 112A:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxInputs.longTermCapitalGains)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">STCG u/s 111A:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxInputs.shortTermCapitalGains)}</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] space-y-3 font-mono text-xs">
              <span className="font-serif text-sm font-semibold text-[var(--text-primary)] block border-b border-[var(--hairline)] pb-2">
                Allowed Deductions (Reconciled)
              </span>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Section 80C:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxInputs.section80C)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Section 80D (Self):</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxInputs.section80DSelf)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Section 80D (Parents):</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxInputs.section80DParents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Section 80CCD(1B) NPS:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxInputs.section80CCD1B)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Section 80CCD(2) Employer NPS:</span>
                <span className="text-[var(--primary-emerald)]">{formatINR(taxInputs.employerNps ?? taxInputs.section80CCD2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Professional Tax (Sec 16):</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxInputs.professionalTax)}</span>
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
            <CitationChip section="FY 2025-26" act="Finance Act 2024" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old Regime Box */}
            <div className="p-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] space-y-2.5 font-mono text-xs">
              <div className="font-serif text-base text-[var(--text-primary)] font-semibold mb-2">
                Old Tax Regime
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Total Taxable Income:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxResult.old.total_income)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Standard Deduction:</span>
                <span className="text-[var(--semantic-danger)]">-{formatINR(taxResult.old.standard_deduction)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">HRA Exemption:</span>
                <span className="text-[var(--semantic-danger)]">-{formatINR(taxResult.old.hra_exemption)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Tax on Normal Income:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxResult.old.tax_on_normal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Tax on STCG / LTCG:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxResult.old.tax_stcg + taxResult.old.tax_ltcg)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Cess (4%):</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxResult.old.cess)}</span>
              </div>
              <div className="border-t border-[var(--hairline)] pt-2 flex justify-between font-bold text-sm">
                <span className="text-[var(--text-primary)]">Total Tax:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxResult.old.total_tax)}</span>
              </div>
            </div>

            {/* New Regime Box */}
            <div className="p-5 rounded-xl bg-[var(--primary-emerald-tint)] border border-[var(--primary-emerald)]/40 space-y-2.5 font-mono text-xs">
              <div className="font-serif text-base text-[var(--text-primary)] font-semibold mb-2 flex items-center justify-between">
                <span>New Tax Regime (FY26)</span>
                <span className="text-xs font-mono text-[var(--accent-gold)]">RECOMMENDED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Total Taxable Income:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxResult.new.total_income)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Standard Deduction:</span>
                <span className="text-[var(--primary-emerald)]">-{formatINR(taxResult.new.standard_deduction)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Tax on Normal Income:</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxResult.new.tax_on_normal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Tax on STCG 111A (20%):</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxResult.new.tax_stcg)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Tax on LTCG 112A (12.5%):</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxResult.new.tax_ltcg)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Cess (4%):</span>
                <span className="text-[var(--text-primary)]">{formatINR(taxResult.new.cess)}</span>
              </div>
              <div className="border-t border-[var(--primary-emerald)]/40 pt-2 flex justify-between font-bold text-sm">
                <span className="text-[var(--text-primary)]">Total Tax:</span>
                <span className="text-[var(--primary-emerald)] font-bold">{formatINR(taxResult.new.total_tax)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Findings (Statutory Cross-Checks & Flags) */}
      {activeTab === 'findings' && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
              Statutory Cross-Checks &amp; Audit Flags
            </h3>
            <span className="text-xs font-mono text-[var(--accent-gold)]">
              {crossChecks.filter((c) => c.status === 'PASS').length} of {crossChecks.length} Reconciled
            </span>
          </div>

          {/* 5 Statutory Cross-Checks */}
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--primary-emerald)] block">
              1. Statutory Cross-Checks (5 Reconciliations)
            </span>
            {crossChecks.map((check, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-between gap-4 font-mono text-xs"
              >
                <div>
                  <span className="text-[var(--text-primary)] font-semibold font-sans block mb-0.5">
                    {check.check}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {check.details}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg font-bold uppercase text-[11px] shrink-0 border ${
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

          {/* Audit Flags */}
          {flags.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[var(--border)]">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-gold)] block">
                2. Audit &amp; Reconciliation Flags ({flags.length})
              </span>
              {flags.map((f, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-xs font-mono ${
                    f.severity === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="font-semibold uppercase tracking-wider text-[11px]">
                      {(f.type || 'audit_flag').replace('_', ' ')}
                    </span>
                  </div>
                  <p className="font-sans leading-relaxed text-[11px]">{f.flag}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Notes */}
      {activeTab === 'notes' && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
              Working Paper Notes &amp; Statutory Remarks
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

      {/* Tab 7: Activity / Audit Trail */}
      {activeTab === 'activity' && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
              Immutable Cryptographic Audit Trail
            </h3>
            <span className="text-xs font-mono text-[var(--primary-emerald)]">
              SHA-256 Hashed
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {client.auditTrail.map((entry) => (
              <div
                key={entry.id}
                className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-primary)] font-semibold font-sans">
                      {entry.action}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--hairline)] uppercase text-[var(--text-muted)]">
                      {entry.actor}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {entry.details}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[var(--text-muted)] block">{entry.timestamp}</span>
                  <span className="text-[9px] text-[var(--accent-gold)]">{entry.hash?.substring(0, 14)}...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Audit Sign-Off */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[var(--primary-emerald)]" />
              <h4 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                Confirm Statutory Sign-Off
              </h4>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
              You are certifying working papers for <strong>{displayClient.name}</strong> for AY 2026-27 under ICAI standards.
              This locks the deterministic tax calculation, generates a cryptographic audit hash, and produces the statutory report.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-muted)] text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSignOff}
                className="px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-mono font-medium transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-[var(--accent-gold)]" />
                <span>Sign &amp; Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
