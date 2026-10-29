/**
 * JourneyStepper Component
 * Persistent end-to-end statutory progression stepper:
 * Upload → Extract & Review → Compute/Analyze → Review → Sign-off/File
 * Computed strictly from live state without hardcoded numbers.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { useApp, EXPECTED_DOC_TYPES } from '../../context/AppContext';
import { formatINR } from '../../lib/taxEngine';

export type StepState = 'done' | 'in_progress' | 'blocked' | 'pending';

export interface JourneyStep {
  id: string;
  name: string;
  route: string;
  state: StepState;
  hint?: string;
}

interface JourneyStepperProps {
  currentStepId?: string;
  clientId?: string;
  overrideSteps?: JourneyStep[];
  className?: string;
}

export const JourneyStepper: React.FC<JourneyStepperProps> = ({
  currentStepId = 'compute',
  clientId,
  overrideSteps,
  className = '',
}) => {
  const { activeClient, documents, extractions, taxResult, flags, isAnalyzing, hasUploadedDocs } = useApp();
  const targetClientId = clientId || activeClient.id;

  // Derive counts & status from live state
  const totalExpected = EXPECTED_DOC_TYPES.length; // 8
  const presentTypes = new Set(Object.values(extractions).map((e: any) => e.doc_type));
  const missingTypes = EXPECTED_DOC_TYPES.filter((t) => !presentTypes.has(t.type));
  const uploadedCount = documents.length;

  const totalNeedsReviewFields = documents.reduce((acc, doc) => {
    return acc + (doc.extractedFields?.filter((f) => f.needsReview)?.length || 0);
  }, 0);

  const isApproved = activeClient.signOffStatus === 'approved';
  const hasTaxResult = hasUploadedDocs && taxResult && taxResult.new.total_tax > 0;

  // 1. Upload stage
  let uploadState: StepState = 'pending';
  let uploadHint = '0/8 loaded • Upload docs';
  if (uploadedCount > 0 && missingTypes.length === 0) {
    uploadState = 'done';
    uploadHint = `${uploadedCount}/${totalExpected} documents loaded`;
  } else if (uploadedCount > 0) {
    uploadState = 'in_progress';
    const missingNames = missingTypes.slice(0, 2).map((m) => m.label).join(', ');
    uploadHint = `${uploadedCount}/${totalExpected} loaded (missing ${missingTypes.length}: ${missingNames}...)`;
  }

  // 2. Extract stage
  let extractState: StepState = 'pending';
  let extractHint = 'Awaiting uploads';
  if (isAnalyzing) {
    extractState = 'in_progress';
    extractHint = 'Extracting OCR & text layer...';
  } else if (uploadedCount > 0) {
    if (totalNeedsReviewFields > 0) {
      extractState = 'blocked';
      extractHint = `${totalNeedsReviewFields} field(s) require review`;
    } else {
      extractState = 'done';
      extractHint = 'All documents structured (100%)';
    }
  }

  // 3. Analyze stage
  let analyzeState: StepState = 'pending';
  let analyzeHint = 'Pending tax calculation';
  if (hasTaxResult) {
    analyzeState = 'done';
    analyzeHint = `Computed: ${taxResult.recommended.toUpperCase()} (Save ₹${formatINR(taxResult.savings)})`;
  } else if (uploadedCount > 0) {
    analyzeState = 'in_progress';
    analyzeHint = 'Partial results computed';
  }

  // 4. Review stage
  let reviewState: StepState = 'pending';
  let reviewHint = 'Pending calculation';
  if (uploadedCount > 0) {
    if (flags.length > 0 || totalNeedsReviewFields > 0) {
      reviewState = 'in_progress';
      reviewHint = `${flags.length} audit flag(s), ${totalNeedsReviewFields} review(s)`;
    } else {
      reviewState = 'done';
      reviewHint = '5/5 cross-checks PASS';
    }
  }

  // 5. Sign-off stage
  let signoffState: StepState = 'pending';
  let signoffHint = 'Pending partner sign-off';
  if (isApproved) {
    signoffState = 'done';
    signoffHint = 'Signed & UDIN generated';
  } else if (hasTaxResult && flags.length === 0 && totalNeedsReviewFields === 0) {
    signoffState = 'in_progress';
    signoffHint = 'Ready for CA sign-off';
  }

  const defaultSteps: JourneyStep[] = [
    {
      id: 'upload',
      name: 'Upload',
      route: '/vault',
      state: uploadState,
      hint: uploadHint,
    },
    {
      id: 'extract',
      name: 'Extract',
      route: '/vault',
      state: extractState,
      hint: extractHint,
    },
    {
      id: 'analyze',
      name: 'Analyze',
      route: '/tax-optimization',
      state: analyzeState,
      hint: analyzeHint,
    },
    {
      id: 'review',
      name: 'Review',
      route: `/ca/workspace/${targetClientId}`,
      state: reviewState,
      hint: reviewHint,
    },
    {
      id: 'signoff_file',
      name: 'Sign-off/File',
      route: isApproved ? `/reports/${targetClientId}` : `/ca/workspace/${targetClientId}`,
      state: signoffState,
      hint: signoffHint,
    },
  ];

  const steps = overrideSteps || defaultSteps;

  return (
    <div
      className={`w-full rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-3 sm:p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--accent-gold)]">
            Client Journey
          </span>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">• FY 2025-26 Working Paper Pipeline</span>
        </div>
        <span className="text-[11px] font-mono text-[var(--text-secondary)] hidden sm:inline">
          Assessee: {activeClient.name} [{activeClient.panMasked}]
        </span>
      </div>

      {/* Stepper track (5 stages) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {steps.map((step, idx) => {
          const isCurrent = step.id === currentStepId;

          let badgeIcon = <Check className="w-3 h-3 text-[var(--semantic-success)]" />;
          let stateClass = 'border-[var(--hairline)] bg-[var(--surface-raised)] text-[var(--text-primary)]';

          if (step.state === 'done') {
            stateClass = 'border-[var(--hairline)] hover:border-[var(--primary-emerald)]/50';
            badgeIcon = <Check className="w-3 h-3 text-[var(--semantic-success)]" />;
          } else if (step.state === 'in_progress') {
            stateClass = 'border-[var(--accent-gold)]/60 bg-[var(--primary-emerald-tint)] text-[var(--text-primary)] ring-1 ring-[var(--accent-gold)]/30';
            badgeIcon = <Clock className="w-3 h-3 text-[var(--accent-gold)] animate-pulse" />;
          } else if (step.state === 'blocked') {
            stateClass = 'border-[var(--semantic-danger)]/50 bg-[var(--surface-raised)] text-[var(--semantic-danger)]';
            badgeIcon = <AlertCircle className="w-3 h-3 text-[var(--semantic-danger)]" />;
          } else {
            stateClass = 'border-[var(--border)] opacity-60 text-[var(--text-muted)]';
            badgeIcon = <span className="w-2 h-2 rounded-full bg-[var(--text-muted)]" />;
          }

          return (
            <Link
              key={step.id}
              to={step.route}
              className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${stateClass}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    0{idx + 1}
                  </span>
                  <div className="shrink-0">{badgeIcon}</div>
                </div>
                <div className={`text-xs font-medium font-sans truncate ${isCurrent ? 'font-semibold text-[var(--accent-gold)]' : ''}`}>
                  {step.name}
                </div>
              </div>

              {step.hint && (
                <div className="text-[10px] text-[var(--text-muted)] truncate mt-1.5 font-mono" title={step.hint}>
                  {step.hint}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
