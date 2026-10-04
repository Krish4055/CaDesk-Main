/**
 * Status Badges & Citation Chips
 * Institutional styling using refined design tokens:
 * Champagne gold for stamps/sign-offs, emerald for AI-prepared, hairpins, and subtle surfaces.
 */

import React from 'react';
import { ShieldCheck, Cpu, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export type StatusBadgeVariant =
  | 'ai_prepared'
  | 'ca_reviewed'
  | 'needs_attention'
  | 'ready_for_filing'
  | 'filed'
  | 'pending';

export const StatusBadge: React.FC<{
  variant: StatusBadgeVariant;
  label?: string;
  size?: 'sm' | 'md';
}> = ({ variant, label, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs font-medium';

  switch (variant) {
    case 'ca_reviewed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border border-[var(--accent-gold)]/40 bg-[var(--surface-raised)] text-[var(--accent-gold)] font-mono ${sizeClasses}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
          <span>{label || 'CA-Reviewed'}</span>
        </span>
      );
    case 'ai_prepared':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border border-[var(--primary-emerald)]/30 bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] font-mono ${sizeClasses}`}
        >
          <Cpu className="w-3.5 h-3.5 text-[var(--primary-emerald)]" />
          <span>{label || 'AI-Prepared'}</span>
        </span>
      );
    case 'needs_attention':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border border-[var(--semantic-warning)]/40 bg-[var(--surface-raised)] text-[var(--semantic-warning)] font-mono ${sizeClasses}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-[var(--semantic-warning)]" />
          <span>{label || 'Needs Attention'}</span>
        </span>
      );
    case 'ready_for_filing':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border border-[var(--primary-emerald)]/40 bg-[var(--surface-raised)] text-[var(--primary-emerald)] font-mono ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary-emerald)]" />
          <span>{label || 'Ready for Filing'}</span>
        </span>
      );
    case 'filed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--surface-raised)] text-[var(--text-muted)] font-mono ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span>{label || 'Filed & Ack'}</span>
        </span>
      );
    case 'pending':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--surface-raised)] text-[var(--text-muted)] font-mono ${sizeClasses}`}
        >
          <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span>{label || 'Pending'}</span>
        </span>
      );
  }
};

export const CitationChip: React.FC<{
  section: string;
  act?: string;
  rulesAsOf?: string;
  onClick?: () => void;
}> = ({ section, act = 'ITA 1961', rulesAsOf, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={rulesAsOf ? `Applicable as of: ${rulesAsOf}` : undefined}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono tracking-tight bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--hairline)] transition-colors cursor-pointer"
    >
      <span className="text-[var(--primary-emerald)] font-semibold">{section}</span>
      <span className="text-[var(--text-muted)]">|</span>
      <span className="text-[var(--text-muted)]">{act}</span>
    </button>
  );
};
