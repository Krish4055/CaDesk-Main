/**
 * TopUtilityBar Component
 * Slim 56px utility bar positioned inside the content area.
 * Breadcrumbs on the left; search trigger (Cmd/Ctrl+K), notification bell,
 * and AI agent activity indicator on the right.
 * No navigation links.
 */

import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Cpu,
  Sparkles,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CaDeskLogo } from '../common/CaDeskLogo';

interface TopUtilityBarProps {
  onMobileMenuClick: () => void;
}

export const TopUtilityBar: React.FC<TopUtilityBarProps> = ({ onMobileMenuClick }) => {
  const {
    role,
    activeClient,
    setIsCommandPaletteOpen,
    notifications,
    markNotificationAsRead,
  } = useApp();

  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Generate clean readable breadcrumbs from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbMap: Record<string, string> = {
    ca: 'Practice',
    dashboard: 'Dashboard',
    workspace: 'Working Papers',
    requests: 'Document Requests',
    'tax-optimization': 'Tax Optimization',
    simulator: 'Scenario Simulator',
    vault: 'Document Vault',
    'agent-chat': 'Agent Chat',
    planning: 'Financial Planning',
    deadlines: 'Deadlines & Alerts',
    reports: 'Reports',
    settings: 'Settings',
    onboarding: 'Onboarding',
  };

  return (
    <header className="h-14 px-4 sm:px-8 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Mobile hamburger + Mobile Logo + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMobileMenuClick}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="lg:hidden shrink-0">
          <CaDeskLogo
            collapsed={true}
            to={role === 'individual' ? '/dashboard' : '/ca/dashboard'}
          />
        </div>

        {/* Breadcrumb Trail */}
        <nav className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] truncate">
          <Link
            to={role === 'individual' ? '/dashboard' : '/ca/dashboard'}
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            {role === 'individual' ? 'Assessee' : 'Sharma & Associates'}
          </Link>

          {pathSegments.length > 0 && (
            <ChevronRight className="w-3 h-3 text-[var(--hairline)] shrink-0" />
          )}

          {pathSegments.map((segment, idx) => {
            const isLast = idx === pathSegments.length - 1;
            const label =
              breadcrumbMap[segment] ||
              (segment.startsWith('ind-') || segment.startsWith('cli-')
                ? activeClient.name
                : segment);

            return (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <ChevronRight className="w-3 h-3 text-[var(--hairline)] shrink-0" />
                )}
                <span
                  className={
                    isLast
                      ? 'text-[var(--text-primary)] font-semibold truncate'
                      : 'hover:text-[var(--text-primary)] transition-colors truncate'
                  }
                >
                  {label}
                </span>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Search, Notification Bell, AI Swarm Status Indicator */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* AI Agent Activity Indicator */}
        <div
          onClick={() => navigate('/agent-chat')}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--surface-raised)] border border-[var(--hairline)] text-xs font-mono text-[var(--primary-emerald)] cursor-pointer hover:border-[var(--primary-emerald)]/40 transition-colors"
          title="AI Swarm Status: 6 Agents Synchronized"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-emerald)] animate-pulse" />
          <span className="text-[11px] text-[var(--text-secondary)] font-sans">
            AI Prepares • CA Reviews
          </span>
        </div>

        {/* Global Command Palette Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] hover:border-[var(--accent-gold)]/40 text-[var(--text-muted)] text-xs font-mono transition-all"
          aria-label="Open command search"
        >
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="hidden md:inline font-sans text-[var(--text-secondary)]">Search</span>
          <kbd className="hidden md:inline-block px-1 py-0.2 rounded bg-[var(--bg-base)] text-[10px] text-[var(--text-muted)] border border-[var(--hairline)]">
            ⌘K
          </kbd>
        </button>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors relative"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent-gold)] ring-2 ring-[var(--surface)]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[var(--surface-raised)] border border-[var(--hairline)] shadow-[var(--shadow-elevated)] p-3 z-50 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] mb-2 font-mono text-xs">
                <span className="font-semibold text-[var(--text-primary)]">Compliance Alerts</span>
                <span className="text-[10px] text-[var(--text-muted)]">{unreadCount} unread</span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationAsRead(n.id);
                      if (n.link) {
                        navigate(n.link);
                        setShowNotifications(false);
                      }
                    }}
                    className={`p-2.5 rounded-xl text-xs cursor-pointer transition-colors border ${
                      n.read
                        ? 'border-transparent text-[var(--text-muted)] hover:bg-[var(--surface)]'
                        : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[var(--primary-emerald)]">{n.title}</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
