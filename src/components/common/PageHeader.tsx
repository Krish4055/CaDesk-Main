/**
 * PageHeader Component
 * Standardized institutional page header:
 * - Title in Newsreader serif
 * - One-line description
 * - Primary action(s) on the right
 * - Optional status badges or statutory tags
 */

import React from 'react';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border)] ${className}`}
    >
      <div className="space-y-1 max-w-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
