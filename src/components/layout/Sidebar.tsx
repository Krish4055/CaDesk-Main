/**
 * CAdesk Persistent Left Sidebar
 * Redesigned navigation structure:
 * - CA Role: PRACTICE, WORK, INSIGHTS, SYSTEM
 * - Individual Role: HOME, TAX, DATA, HELP
 * - CaDesk Logo in top left (expanded & collapsed states)
 * - Active state indicators (2.5px gold left bar, soft emerald tint, bold label, emerald icon)
 * - Collapsible behavior: 264px expanded, 72px collapsed (icon-only with rich tooltips)
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  Clock,
  FolderLock,
  Calculator,
  Sliders,
  Calendar,
  FileText,
  Settings,
  MessageSquare,
  ClipboardList,
  Target,
  FileSpreadsheet,
  ChevronDown,
  Check,
  Sun,
  Moon,
  LogOut,
  Building2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { MOCK_INDIVIDUAL_PROFILES } from '../../data/mockProfiles';
import { CaDeskLogo } from '../common/CaDeskLogo';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
  matchPrefix?: string;
  matchQuery?: string;
}

interface NavSection {
  category: string;
  items: NavItem[];
}

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const {
    role,
    setRole,
    activeClient,
    setActiveClientId,
    theme,
    toggleTheme,
    isSidebarCollapsed,
    toggleSidebarCollapse,
  } = useApp();

  const location = useLocation();
  const navigate = useNavigate();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [activeFirmOffice, setActiveFirmOffice] = useState('Sharma & Associates (Mumbai)');
  const [activeFY, setActiveFY] = useState('FY 2025-26 (AY 2026-27)');

  // Close mobile drawer on route change
  useEffect(() => {
    onMobileClose();
  }, [location.pathname]);

  // Section configs grouped strictly per requirements:
  // CA role: PRACTICE, WORK, INSIGHTS, SYSTEM
  const caSections: NavSection[] = [
    {
      category: 'PRACTICE',
      items: [
        {
          id: 'ca-dash',
          label: 'Dashboard',
          path: '/ca/dashboard',
          icon: LayoutDashboard,
          matchQuery: 'none',
        },
        {
          id: 'ca-clients',
          label: 'Clients',
          path: '/ca/dashboard?tab=clients',
          icon: Users,
          badge: 12,
          matchQuery: 'tab=clients',
        },
        {
          id: 'ca-review-queue',
          label: 'Review Queue',
          path: '/ca/dashboard?filter=in_review',
          icon: Clock,
          badge: 3,
          matchQuery: 'filter=in_review',
        },
      ],
    },
    {
      category: 'WORK',
      items: [
        {
          id: 'ca-working-papers',
          label: 'Working Papers',
          path: `/ca/workspace/${activeClient.id}`,
          icon: FileSpreadsheet,
          matchPrefix: '/ca/workspace',
        },
        {
          id: 'ca-requests',
          label: 'Document Requests',
          path: '/ca/requests',
          icon: ClipboardList,
          badge: 2,
          matchPrefix: '/ca/requests',
        },
        {
          id: 'ca-computation',
          label: 'Tax Computation',
          path: '/tax-optimization',
          icon: Calculator,
          matchPrefix: '/tax-optimization',
        },
      ],
    },
    {
      category: 'INSIGHTS',
      items: [
        {
          id: 'ca-deadlines',
          label: 'Deadlines',
          path: '/deadlines',
          icon: Calendar,
          badge: 'Q3',
          matchPrefix: '/deadlines',
        },
        {
          id: 'ca-scenarios',
          label: 'Scenarios',
          path: '/simulator',
          icon: Sliders,
          matchPrefix: '/simulator',
        },
        {
          id: 'ca-reports',
          label: 'Reports',
          path: `/reports/${activeClient.id}`,
          icon: FileText,
          matchPrefix: '/reports',
        },
      ],
    },
    {
      category: 'SYSTEM',
      items: [
        {
          id: 'ca-settings',
          label: 'Settings',
          path: '/settings',
          icon: Settings,
          matchPrefix: '/settings',
        },
      ],
    },
  ];

  // Individual role: HOME, TAX, DATA, HELP
  const individualSections: NavSection[] = [
    {
      category: 'HOME',
      items: [
        {
          id: 'ind-dash',
          label: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          matchPrefix: '/dashboard',
        },
      ],
    },
    {
      category: 'TAX',
      items: [
        {
          id: 'ind-opt',
          label: 'Optimization',
          path: '/tax-optimization',
          icon: Calculator,
          matchPrefix: '/tax-optimization',
        },
        {
          id: 'ind-sim',
          label: 'Scenarios',
          path: '/simulator',
          icon: Sliders,
          matchPrefix: '/simulator',
        },
        {
          id: 'ind-deadlines',
          label: 'Deadlines',
          path: '/deadlines',
          icon: Calendar,
          badge: 'Dec 15',
          matchPrefix: '/deadlines',
        },
      ],
    },
    {
      category: 'DATA',
      items: [
        {
          id: 'ind-vault',
          label: 'Document Vault',
          path: '/vault',
          icon: FolderLock,
          badge: activeClient.documentsCount,
          matchPrefix: '/vault',
        },
        {
          id: 'ind-plan',
          label: 'Planning',
          path: '/planning',
          icon: Target,
          matchPrefix: '/planning',
        },
      ],
    },
    {
      category: 'HELP',
      items: [
        {
          id: 'ind-chat',
          label: 'Agent Chat',
          path: '/agent-chat',
          icon: MessageSquare,
          badge: 'AI',
          matchPrefix: '/agent-chat',
        },
        {
          id: 'ind-settings',
          label: 'Settings',
          path: '/settings',
          icon: Settings,
          matchPrefix: '/settings',
        },
      ],
    },
  ];

  const sections = role === 'individual' ? individualSections : caSections;

  const roleLabelMap: Record<UserRole, { badge: string; title: string }> = {
    ca: { badge: 'CA Partner', title: 'CA Ramesh Sharma' },
    ca_staff: { badge: 'CA Staff', title: 'Kavita Joshi' },
    individual: { badge: 'Assessee', title: activeClient.name },
  };

  // Determine active state accurately with subroute & query param intelligence
  const isItemActive = (item: NavItem): boolean => {
    if (item.matchQuery === 'tab=clients') {
      return location.pathname === '/ca/dashboard' && location.search.includes('tab=clients');
    }
    if (item.matchQuery === 'filter=in_review') {
      return location.pathname === '/ca/dashboard' && location.search.includes('filter=in_review');
    }
    if (item.matchQuery === 'none') {
      return location.pathname === '/ca/dashboard' && (!location.search || location.search.includes('tab=overview'));
    }
    if (item.matchPrefix) {
      return location.pathname.startsWith(item.matchPrefix);
    }
    return location.pathname === item.path;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[var(--surface)] border-r border-[var(--border)] transition-all duration-200 ease-out select-none ${
          isSidebarCollapsed ? 'w-[72px]' : 'w-[264px]'
        } ${isMobileOpen ? 'translate-x-0 w-[264px]' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Left: CAdesk Logo & Wordmark */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--border)] shrink-0">
          <div className="flex items-center min-w-0">
            <CaDeskLogo
              collapsed={isSidebarCollapsed && !isMobileOpen}
              to={role === 'individual' ? '/dashboard' : '/ca/dashboard'}
            />
          </div>

          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace / Client Switcher (Sharma & Associates for CA; FY for Individual) */}
        {(!isSidebarCollapsed || isMobileOpen) && (
          <div className="px-3 pt-3 pb-2 border-b border-[var(--border)] relative shrink-0">
            <button
              onClick={() => setShowWorkspaceMenu((prev) => !prev)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] hover:border-[var(--accent-gold)]/40 text-left transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-[var(--bg-base)] flex items-center justify-center text-[var(--accent-gold)] shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] truncate">
                    {role === 'individual' ? 'Assessment Year' : 'Firm Workspace'}
                  </div>
                  <div className="text-xs font-semibold text-[var(--text-primary)] truncate font-sans">
                    {role === 'individual' ? activeFY : activeFirmOffice}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 ml-1" />
            </button>

            {/* Dropdown for workspace/client switch */}
            {showWorkspaceMenu && (
              <div className="absolute left-3 right-3 top-16 z-50 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] shadow-[var(--shadow-elevated)] p-1.5 space-y-1.5">
                {role === 'individual' ? (
                  <>
                    <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                      Select Financial Year
                    </div>
                    {[
                      { fy: 'FY 2025-26 (AY 2026-27)', tag: 'Active' },
                      { fy: 'FY 2024-25 (AY 2025-26)', tag: 'Filed' },
                      { fy: 'FY 2023-24 (AY 2024-25)', tag: 'Archived' },
                    ].map((item) => (
                      <button
                        key={item.fy}
                        onClick={() => {
                          setActiveFY(item.fy);
                          setShowWorkspaceMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          activeFY === item.fy
                            ? 'bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] font-semibold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                        }`}
                      >
                        <span>{item.fy}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--text-muted)]">
                          {item.tag}
                        </span>
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                      Sharma & Associates Branches
                    </div>
                    {[
                      'Sharma & Associates (Mumbai)',
                      'Sharma & Associates (Bengaluru)',
                      'Sharma & Associates (Delhi NCR)',
                    ].map((office) => (
                      <button
                        key={office}
                        onClick={() => {
                          setActiveFirmOffice(office);
                          setShowWorkspaceMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          activeFirmOffice === office
                            ? 'bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] font-semibold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                        }`}
                      >
                        <span className="truncate">{office}</span>
                        {activeFirmOffice === office && (
                          <Check className="w-3 h-3 text-[var(--primary-emerald)]" />
                        )}
                      </button>
                    ))}

                    <div className="pt-1 border-t border-[var(--hairline)]">
                      <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                        Active Client Working Papers
                      </div>
                      {MOCK_INDIVIDUAL_PROFILES.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActiveClientId(p.id);
                            setShowWorkspaceMenu(false);
                            navigate(`/ca/workspace/${p.id}`);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            activeClient.id === p.id
                              ? 'bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] font-semibold'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                          }`}
                        >
                          <span className="truncate">{p.name}</span>
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">
                            {p.panMasked}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation Sections Grouped Strictly by Category */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {sections.map((section, secIdx) => (
            <div key={section.category} className="space-y-1">
              {/* Category Label in Expanded View */}
              {(!isSidebarCollapsed || isMobileOpen) ? (
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] font-semibold">
                  {section.category}
                </div>
              ) : (
                /* Subtle category separator line in Collapsed View */
                secIdx > 0 && <div className="w-6 h-[1px] bg-[var(--hairline)] mx-auto my-2" />
              )}

              {/* Items in Category */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item);

                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all group ${
                        active
                          ? 'bg-[var(--primary-emerald-tint)] text-[var(--text-primary)] font-semibold shadow-sm ring-1 ring-[var(--accent-gold)]/20'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]/70 hover:translate-x-0.5'
                      } ${isSidebarCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
                    >
                      {/* Active State 2.5px Gold Left Indicator */}
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] rounded-r bg-[var(--accent-gold)]" />
                      )}

                      {/* Icon */}
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          active
                            ? 'text-[var(--primary-emerald)]'
                            : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                        }`}
                      />

                      {/* Item Label (Expanded mode) */}
                      {(!isSidebarCollapsed || isMobileOpen) && (
                        <span className="truncate flex-1 font-sans">{item.label}</span>
                      )}

                      {/* Badge (Expanded mode) */}
                      {(!isSidebarCollapsed || isMobileOpen) && item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0 ${
                            active
                              ? 'bg-[var(--surface)] text-[var(--primary-emerald)] font-bold border border-[var(--primary-emerald)]/30'
                              : 'bg-[var(--surface-raised)] text-[var(--text-muted)]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Collapsed Mode Floating Hover Tooltip */}
                      {isSidebarCollapsed && !isMobileOpen && (
                        <div className="hidden lg:flex flex-col gap-0.5 absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] text-xs text-[var(--text-primary)] shadow-[var(--shadow-elevated)] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--accent-gold)] font-bold">
                              {section.category}
                            </span>
                            {item.badge !== undefined && (
                              <span className="text-[9px] font-mono px-1 rounded bg-[var(--surface)] text-[var(--primary-emerald)] font-semibold">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span className="font-sans font-medium text-[var(--text-primary)]">
                            {item.label}
                          </span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer: User Profile, Role Switcher Menu & Collapse Toggle */}
        <div className="border-t border-[var(--border)] p-2 space-y-1 relative shrink-0">
          {/* User Profile Pill with Role Menu */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu((prev) => !prev)}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[var(--surface-raised)] transition-all text-left ${
                isSidebarCollapsed && !isMobileOpen ? 'justify-center p-2' : ''
              }`}
              title={isSidebarCollapsed && !isMobileOpen ? `${roleLabelMap[role].title} (${roleLabelMap[role].badge})` : undefined}
            >
              <div className="w-8 h-8 rounded-full bg-[var(--surface-raised)] border border-[var(--hairline)] flex items-center justify-center text-xs font-serif font-bold text-[var(--accent-gold)] shrink-0">
                {roleLabelMap[role].title.slice(0, 2).toUpperCase()}
              </div>

              {(!isSidebarCollapsed || isMobileOpen) && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {roleLabelMap[role].title}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--primary-emerald)]" />
                    <span className="text-[10px] font-mono text-[var(--accent-gold)] truncate">
                      {roleLabelMap[role].badge}
                    </span>
                  </div>
                </div>
              )}

              {(!isSidebarCollapsed || isMobileOpen) && (
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              )}
            </button>

            {/* Role & Account Menu Dropdown */}
            {showRoleMenu && (
              <div className="absolute left-1 right-1 bottom-14 z-50 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] shadow-[var(--shadow-elevated)] p-2 space-y-2">
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]">
                  Switch Role / Persona
                </div>

                <div className="space-y-0.5">
                  {(['ca', 'ca_staff', 'individual'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRole(r);
                        setShowRoleMenu(false);
                        if (r === 'individual') {
                          navigate('/dashboard');
                        } else {
                          navigate('/ca/dashboard');
                        }
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        role === r
                          ? 'bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                      }`}
                    >
                      <div className="font-sans">
                        <div>{roleLabelMap[r].badge}</div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">
                          {roleLabelMap[r].title}
                        </div>
                      </div>
                      {role === r && <Check className="w-3.5 h-3.5 text-[var(--primary-emerald)]" />}
                    </button>
                  ))}
                </div>

                <div className="border-t border-[var(--border)] pt-1 space-y-0.5">
                  <button
                    onClick={toggleTheme}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      navigate('/');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[var(--semantic-danger)] hover:bg-[var(--surface)] flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Return to Landing</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Expand Toggle Button */}
          <button
            onClick={toggleSidebarCollapse}
            className="w-full hidden lg:flex items-center justify-center p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors text-xs font-mono"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2 text-[11px]">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
