/**
 * MobileTabBar Component
 * Fixed bottom bar on mobile screens featuring the 4 key destinations per role.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  ClipboardList,
  Settings,
  Calculator,
  FolderLock,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MobileTabBar: React.FC = () => {
  const { role, activeClient } = useApp();
  const location = useLocation();

  const caTabs = [
    { label: 'Dashboard', path: '/ca/dashboard', icon: LayoutDashboard },
    { label: 'Papers', path: `/ca/workspace/${activeClient.id}`, icon: FileSpreadsheet },
    { label: 'Requests', path: '/ca/requests', icon: ClipboardList },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const individualTabs = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Tax Opt', path: '/tax-optimization', icon: Calculator },
    { label: 'Vault', path: '/vault', icon: FolderLock },
    { label: 'Agent Chat', path: '/agent-chat', icon: MessageSquare },
  ];

  const tabs = role === 'individual' ? individualTabs : caTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] lg:hidden px-2 py-1.5 flex items-center justify-around shadow-[var(--shadow-elevated)] no-print">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;

        return (
          <Link
            key={tab.label}
            to={tab.path}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-mono transition-colors ${
              isActive
                ? 'text-[var(--primary-emerald)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--primary-emerald)]' : ''}`} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
