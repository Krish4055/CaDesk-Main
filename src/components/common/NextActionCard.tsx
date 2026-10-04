/**
 * NextActionCard Component
 * Highlights the single highest-priority "Next Best Action" on every screen
 * ensuring users never encounter decision fatigue or dead-ends.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface NextActionCardProps {
  title: string;
  description: string;
  actionLabel: string;
  actionLink?: string;
  onActionClick?: () => void;
  tone?: 'gold' | 'emerald' | 'copper' | 'amber';
  badge?: string;
  className?: string;
}

export const NextActionCard: React.FC<NextActionCardProps> = ({
  title,
  description,
  actionLabel,
  actionLink,
  onActionClick,
  tone = 'gold',
  badge = 'Next Best Action',
  className = '',
}) => {
  let borderClass = 'border-[var(--hairline)] hover:border-[var(--accent-gold)]/50';
  let badgeColor = 'text-[var(--accent-gold)] bg-[var(--surface-raised)] border-[var(--hairline)]';
  let btnClass = 'bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white';

  if (tone === 'copper') {
    borderClass = 'border-[var(--hairline)] hover:border-[var(--accent-copper)]/60';
    badgeColor = 'text-[var(--accent-copper)] bg-[var(--surface-raised)] border-[var(--hairline)]';
    btnClass = 'bg-[var(--accent-copper)] hover:opacity-90 text-white';
  } else if (tone === 'amber') {
    borderClass = 'border-[var(--semantic-warning)]/40 hover:border-[var(--semantic-warning)]/70';
    badgeColor = 'text-[var(--semantic-warning)] bg-[var(--surface-raised)] border-[var(--semantic-warning)]/30';
  }

  const content = (
    <div
      className={`rounded-2xl bg-[var(--surface)] border ${borderClass} p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-[var(--shadow-soft)] ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColor}`}>
              {badge}
            </span>
            <h4 className="font-serif text-base font-medium text-[var(--text-primary)]">
              {title}
            </h4>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed max-w-xl">
            {description}
          </p>
        </div>
      </div>

      <div className="shrink-0 self-start sm:self-auto">
        {actionLink ? (
          <Link
            to={actionLink}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-medium transition-all shadow-sm ${btnClass}`}
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onActionClick}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-medium transition-all shadow-sm ${btnClass}`}
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  return content;
};
