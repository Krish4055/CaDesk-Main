/**
 * Global CAdesk Application Header
 * Role Switcher, Profile Switcher, Command Palette Trigger, Notification Popover, Theme Toggle.
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FileSpreadsheet,
  Search,
  Bell,
  Sun,
  Moon,
  Users,
  ChevronDown,
  Check,
  Shield,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { MOCK_INDIVIDUAL_PROFILES } from '../../data/mockProfiles';

export const Header: React.FC = () => {
  const {
    role,
    setRole,
    activeClient,
    setActiveClientId,
    theme,
    toggleTheme,
    setIsCommandPaletteOpen,
    notifications,
    markNotificationAsRead,
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showClientMenu, setShowClientMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleLabels: Record<UserRole, { title: string; badge: string }> = {
    ca: { title: 'Chartered Accountant (Partner)', badge: 'CA Firm' },
    ca_staff: { title: 'CA Articled / Tax Staff', badge: 'Reviewer' },
    individual: { title: 'Assessee / Individual', badge: 'Client' },
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#121316]/95 backdrop-blur-md dark:border-zinc-800/80 dark:bg-[#121316]/95 light:bg-white/95 light:border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-tight text-zinc-100 group-hover:text-emerald-400 transition-colors">
                  CAdesk
                </span>
                <span className="text-[10px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                  Working Papers
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">AI Prepares • CAs Sign Off</p>
            </div>
          </Link>

          {/* Persona Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l border-zinc-800 text-sm">
            {role === 'individual' ? (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    location.pathname === '/dashboard'
                      ? 'bg-zinc-800/90 text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/tax-optimization"
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    location.pathname === '/tax-optimization'
                      ? 'bg-zinc-800/90 text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  Tax Optimization
                </Link>
                <Link
                  to="/simulator"
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    location.pathname === '/simulator'
                      ? 'bg-zinc-800/90 text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  Simulator
                </Link>
                <Link
                  to="/vault"
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    location.pathname === '/vault'
                      ? 'bg-zinc-800/90 text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  Vault
                </Link>
                <Link
                  to="/agent-chat"
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    location.pathname === '/agent-chat'
                      ? 'bg-zinc-800/90 text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  Agent Chat
                </Link>
                <Link
                  to="/deadlines"
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    location.pathname === '/deadlines'
                      ? 'bg-zinc-800/90 text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  Deadlines
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/ca/dashboard"
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    location.pathname === '/ca/dashboard'
                      ? 'bg-zinc-800/90 text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  CA Practice
                </Link>
                <Link
                  to={`/ca/workspace/${activeClient.id}`}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    location.pathname.startsWith('/ca/workspace')
                      ? 'bg-zinc-800/90 text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  Working Papers
                </Link>
                <Link
                  to="/ca/requests"
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    location.pathname === '/ca/requests'
                      ? 'bg-zinc-800/90 text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  Doc Requests
                </Link>
                <Link
                  to={`/reports/${activeClient.id}`}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    location.pathname.startsWith('/reports')
                      ? 'bg-zinc-800/90 text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  Reports
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Center / Search Trigger */}
        <div className="flex-1 max-w-md hidden lg:block">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 text-zinc-400 text-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-500" />
              <span>Search clients, sections, documents...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-400 bg-zinc-800 rounded border border-zinc-700">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Active Client Selector (for Quick Demo Context) */}
          <div className="relative">
            <button
              onClick={() => setShowClientMenu((p) => !p)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-300"
              title="Active Assessee"
            >
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span className="max-w-[110px] truncate">{activeClient.name}</span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {showClientMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-2 z-50">
                <div className="px-2 py-1.5 text-[11px] font-mono text-zinc-400 uppercase tracking-wider border-b border-zinc-800 mb-1">
                  Switch Active Client
                </div>
                {MOCK_INDIVIDUAL_PROFILES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveClientId(p.id);
                      setShowClientMenu(false);
                      if (role !== 'individual') {
                        navigate(`/ca/workspace/${p.id}`);
                      }
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-zinc-800/80 transition-colors ${
                      activeClient.id === p.id ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-zinc-200">{p.name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {p.panMasked} • {p.incomeType}
                      </div>
                    </div>
                    {activeClient.id === p.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Role Switcher Pill (CRITICAL DEMO REQUIREMENT) */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/40 text-emerald-300 text-xs font-mono transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Role: {roleLabels[role].badge}</span>
              <ChevronDown className="w-3 h-3 text-emerald-400/80" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 z-50">
                <div className="px-2 py-1 text-[11px] font-mono text-zinc-400 uppercase tracking-wider border-b border-zinc-800 mb-1">
                  Select Perspective
                </div>
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
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between hover:bg-zinc-800 transition-colors ${
                      role === r ? 'bg-zinc-800 text-emerald-400 font-medium' : 'text-zinc-300'
                    }`}
                  >
                    <div>
                      <div>{roleLabels[r].badge}</div>
                      <div className="text-[10px] text-zinc-400">{roleLabels[r].title}</div>
                    </div>
                    {role === r && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu((p) => !p)}
              className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#121316]" />
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
                  <span className="text-xs font-semibold text-zinc-200">Alerts & Verification</span>
                  <span className="text-[10px] font-mono text-zinc-400">{unreadCount} new</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.link) {
                          navigate(n.link);
                          setShowNotifMenu(false);
                        }
                      }}
                      className={`p-2 rounded-lg text-xs cursor-pointer transition-colors border ${
                        n.read
                          ? 'border-transparent text-zinc-400 hover:bg-zinc-800/40'
                          : 'border-zinc-800 bg-zinc-800/40 text-zinc-200 hover:bg-zinc-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-emerald-400">{n.title}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings Shortcut */}
          <Link
            to="/settings"
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
            title="Settings"
          >
            <Layers className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
