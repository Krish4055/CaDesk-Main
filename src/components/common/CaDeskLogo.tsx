/**
 * CAdesk Brand Logo Component
 * Institutional private wealth logo mark + wordmark.
 * Supports collapsed (icon-only), standard, and custom size variants.
 */

import React from 'react';
import { Link } from 'react-router-dom';

interface CaDeskLogoProps {
  collapsed?: boolean;
  to?: string;
  className?: string;
}

export const CaDeskLogo: React.FC<CaDeskLogoProps> = ({
  collapsed = false,
  to = '/dashboard',
  className = '',
}) => {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 overflow-hidden group select-none ${className}`}
      title="CAdesk — Working Papers"
    >
      {/* Bespoke Emblem / Logo Mark */}
      <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#18231F] to-[#12161B] border border-[#27B58A]/30 flex items-center justify-center shadow-sm shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:border-[#C9A66B]/50">
        {/* Working Papers Foliage / Monogram SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
        >
          {/* Outer subtle shield ledger */}
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="4"
            className="stroke-[#1F9D77]"
            strokeWidth="1.5"
            strokeDasharray="24 4"
          />
          {/* Balance / Ledger paper lines */}
          <path
            d="M7 8H17"
            stroke="#C9A66B"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M7 12H14"
            stroke="#F3EFE6"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M7 16H11"
            stroke="#1F9D77"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* CA Verified Stamp / Checkmark accent */}
          <circle cx="16" cy="15" r="2.5" fill="#1F9D77" />
          <path
            d="M15 15L15.7 15.7L17.2 14.3"
            stroke="#0B0D10"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Ambient subtle glow */}
        <div className="absolute inset-0 rounded-xl bg-[#1F9D77]/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>

      {/* Wordmark + Tagline (Hidden when collapsed) */}
      {!collapsed && (
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-serif text-lg font-semibold tracking-tight text-[var(--text-primary)] group-hover:text-white transition-colors">
              CAdesk
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)]" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mt-1 whitespace-nowrap leading-none group-hover:text-[var(--accent-gold)] transition-colors">
            Working Papers
          </span>
        </div>
      )}
    </Link>
  );
};
