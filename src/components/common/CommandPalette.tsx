/**
 * Global Command Palette (Cmd+K / Ctrl+K)
 * Allows rapid keyboard navigation between screens, clients, and tax actions.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileSpreadsheet,
  Calculator,
  Sliders,
  FolderLock,
  MessageSquare,
  Calendar,
  Building,
  ClipboardList,
  FileText,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MOCK_CA_CLIENTS } from '../../data/mockClients';

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, role, setRole, setActiveClientId } = useApp();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isCommandPaletteOpen) {
      setQuery('');
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const navigationItems = [
    { label: 'Landing Page', path: '/', icon: FileSpreadsheet, category: 'General' },
    { label: 'Onboarding Flow', path: '/onboarding', icon: Users, category: 'General' },
    { label: 'Individual Dashboard', path: '/dashboard', icon: FileSpreadsheet, category: 'Assessee' },
    { label: 'Tax Optimization (Old vs New)', path: '/tax-optimization', icon: Calculator, category: 'Tax Engine' },
    { label: 'Scenario Simulator', path: '/simulator', icon: Sliders, category: 'Planning' },
    { label: 'Document Vault', path: '/vault', icon: FolderLock, category: 'Documents' },
    { label: 'Multi-Agent Chat', path: '/agent-chat', icon: MessageSquare, category: 'AI Support' },
    { label: 'Financial Planning & Goals', path: '/planning', icon: Sliders, category: 'Planning' },
    { label: 'Deadlines & Statutory Alerts', path: '/deadlines', icon: Calendar, category: 'Compliance' },
    { label: 'CA Firm Dashboard', path: '/ca/dashboard', icon: Building, category: 'CA Practice' },
    { label: 'Document Requests Automation', path: '/ca/requests', icon: ClipboardList, category: 'CA Practice' },
    { label: 'Working Papers Report (Print)', path: '/reports/ind-arjun', icon: FileText, category: 'Reporting' },
    { label: 'Workspace Settings', path: '/settings', icon: Settings, category: 'Configuration' },
  ];

  const filteredNav = navigationItems.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredClients = MOCK_CA_CLIENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.panMasked.toLowerCase().includes(query.toLowerCase()) ||
      c.incomeType.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const handleSelect = (path: string) => {
    setIsCommandPaletteOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-[var(--surface-raised)] border border-[var(--hairline)] shadow-[var(--shadow-elevated)] overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
          <Search className="w-5 h-5 text-[var(--accent-gold)]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a screen, client name, or command..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none font-sans"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Close command palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Quick Role Switch in Palette */}
          <div>
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Perspective Switcher
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-1 px-1">
              <button
                onClick={() => {
                  setRole('ca');
                  handleSelect('/ca/dashboard');
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono text-left border transition-all ${
                  role === 'ca'
                    ? 'border-[var(--primary-emerald)]/50 bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] font-semibold'
                    : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                CA Firm (Partner)
              </button>
              <button
                onClick={() => {
                  setRole('ca_staff');
                  handleSelect('/ca/dashboard');
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono text-left border transition-all ${
                  role === 'ca_staff'
                    ? 'border-[var(--primary-emerald)]/50 bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] font-semibold'
                    : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                CA Articled Staff
              </button>
              <button
                onClick={() => {
                  setRole('individual');
                  handleSelect('/dashboard');
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono text-left border transition-all ${
                  role === 'individual'
                    ? 'border-[var(--primary-emerald)]/50 bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] font-semibold'
                    : 'border-[var(--hairline)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Individual Assessee
              </button>
            </div>
          </div>

          {/* Client quick jump */}
          {filteredClients.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Clients & Working Papers
              </div>
              <div className="mt-1 space-y-1">
                {filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => {
                      setActiveClientId(client.id);
                      handleSelect(`/ca/workspace/${client.id}`);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                  >
                    <div>
                      <span className="font-medium text-[var(--text-primary)]">{client.name}</span>
                      <span className="ml-2 font-mono text-[var(--text-muted)]">[{client.panMasked}]</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--hairline)]">
                      {client.status.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div>
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              Workspace Screens
            </div>
            <div className="mt-1 space-y-1">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelect(item.path)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-[var(--primary-emerald)]" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{item.category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
          <span>Navigation • Esc to close</span>
          <span>FY 2025-26 Tax Engine Active</span>
        </div>
      </div>
    </div>
  );
};
