/**
 * JourneyStepper Component
 * Persistent end-to-end statutory progression stepper:
 * Upload → Extract & Review → Compute → CA Review → Sign-off → Report
 * Each stage shows status (done / in_progress / blocked / pending) and links directly to the stage.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, AlertCircle, ChevronRight, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';

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
  const { role, activeClient } = useApp();
  const targetClientId = clientId || activeClient.id;

  // Determine stage progression dynamically based on active client state
  const isApproved = activeClient.signOffStatus === 'approved';
  const hasActionReq = activeClient.status === 'action_required';
  const isFiled = activeClient.status === 'filed';

  const defaultSteps: JourneyStep[] = [
    {
      id: 'upload',
      name: 'Upload',
      route: '/vault',
      state: 'done',
      hint: `${activeClient.documentsCount} documents loaded`,
    },
    {
      id: 'extract',
      name: 'Extract',
      route: '/vault',
      state: hasActionReq ? 'blocked' : 'done',
      hint: hasActionReq ? '1 low-confidence field' : 'OCR & fields parsed',
    },
    {
      id: 'analyze',
      name: 'Analyze',
      route: '/tax-optimization',
      state: currentStepId === 'analyze' || currentStepId === 'compute' ? 'in_progress' : 'done',
      hint: 'Regimes & deductions computed',
    },
    {
      id: 'review',
      name: 'Review',
      route: `/ca/workspace/${targetClientId}`,
      state: isApproved ? 'done' : currentStepId === 'review' || currentStepId === 'ca_review' ? 'in_progress' : 'in_progress',
      hint: isApproved ? 'Audited by partner' : 'CA review queue active',
    },
    {
      id: 'signoff_file',
      name: 'Sign-off/File',
      route: isApproved ? `/reports/${targetClientId}` : `/ca/workspace/${targetClientId}`,
      state: isApproved || isFiled ? 'done' : 'pending',
      hint: isApproved ? 'Signed & UDIN generated' : 'Pending partner sign-off',
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
          let indicatorColor = 'bg-[var(--semantic-success)]';

          if (step.state === 'done') {
            stateClass = 'border-[var(--hairline)] hover:border-[var(--primary-emerald)]/50';
            indicatorColor = 'bg-[var(--semantic-success)]';
            badgeIcon = <Check className="w-3 h-3 text-[var(--semantic-success)]" />;
          } else if (step.state === 'in_progress') {
            stateClass = 'border-[var(--accent-gold)]/60 bg-[var(--primary-emerald-tint)] text-[var(--text-primary)] ring-1 ring-[var(--accent-gold)]/30';
            indicatorColor = 'bg-[var(--accent-gold)]';
            badgeIcon = <Clock className="w-3 h-3 text-[var(--accent-gold)] animate-pulse" />;
          } else if (step.state === 'blocked') {
            stateClass = 'border-[var(--semantic-danger)]/50 bg-[var(--surface-raised)] text-[var(--semantic-danger)]';
            indicatorColor = 'bg-[var(--semantic-danger)]';
            badgeIcon = <AlertCircle className="w-3 h-3 text-[var(--semantic-danger)]" />;
          } else {
            stateClass = 'border-[var(--border)] opacity-60 text-[var(--text-muted)]';
            indicatorColor = 'bg-[var(--text-muted)]';
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
                <div className="text-[10px] text-[var(--text-muted)] truncate mt-1.5 font-mono">
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
