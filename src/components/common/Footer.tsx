/**
 * Persistent CAdesk Footer
 * Required statutory disclaimer, legal notices, and compliance statements.
 */

import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] text-xs py-6 mt-auto no-print">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Primary Disclaimer Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)]">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[var(--accent-copper)] shrink-0 mt-0.5" />
            <p className="text-[var(--text-secondary)] text-xs leading-relaxed font-sans">
              <strong className="text-[var(--text-primary)]">Decision Support Notice:</strong> CAdesk provides automated decision support,
              statutory extraction, and deterministic modeling; it does not replace the independent statutory advice and sign-off
              of a qualified Chartered Accountant.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--hairline)] text-[var(--text-secondary)]">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary-emerald)]" />
              DPDP 2023 Compliant
            </span>
          </div>
        </div>

        {/* Secondary statutory links & rules versioning */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[var(--text-muted)] font-mono">
          <div className="flex items-center gap-4">
            <span>Rules as of: Oct 2026 (FY 2025-26 / AY 2026-27)</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Deterministic Engine v2.4 (Active Slabs)</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/onboarding" className="hover:text-[var(--text-primary)] transition-colors">
              DPDP Consent
            </Link>
            <Link to="/settings" className="hover:text-[var(--text-primary)] transition-colors">
              Privacy & Retention
            </Link>
            <Link to="/reports/ind-arjun" className="hover:text-[var(--text-primary)] transition-colors">
              Working Paper Audit Trail
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
