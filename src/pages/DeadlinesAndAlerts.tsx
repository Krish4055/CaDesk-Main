/**
 * Screen 9: Deadlines & Statutory Alerts
 * Calendar and list views for advance tax, ITR due dates, 80C cutoffs, and GST dates.
 * Priority levels, snooze, and notification preferences (Email, WhatsApp, SMS toggles).
 */

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  List,
  Clock,
  Bell,
  CheckCircle2,
  Mail,
  MessageSquare,
  Smartphone,
  Check,
} from 'lucide-react';
import { MOCK_DEADLINES } from '../data/mockGoals';
import { ComplianceDeadline } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { JourneyStepper } from '../components/common/JourneyStepper';
import { NextActionCard } from '../components/common/NextActionCard';

export const DeadlinesAndAlerts: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>(MOCK_DEADLINES);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'advance_tax' | 'itr' | '80c_cutoff' | 'gst'>('all');

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    whatsapp: true,
    sms: false,
    daysInAdvance: 7,
  });

  const [snoozeMessage, setSnoozeMessage] = useState<string | null>(null);

  const handleSnooze = (id: string) => {
    setDeadlines((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, snoozedUntil: 'Snoozed for 3 days' } : d
      )
    );
    setSnoozeMessage('Deadline alert snoozed for 3 days.');
    setTimeout(() => setSnoozeMessage(null), 3000);
  };

  const handleMarkDone = (id: string) => {
    setDeadlines((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, isCompleted: !d.isCompleted } : d
      )
    );
  };

  const filteredDeadlines = deadlines.filter((d) => {
    if (selectedFilter === 'all') return true;
    return d.category === selectedFilter;
  });

  return (
    <div className="space-y-8">
      {/* Standardized PageHeader */}
      <PageHeader
        title="Statutory Deadlines & Compliance Alerts"
        description="Tracking advance tax installments, Section 80C investment cutoffs, and ITR statutory return due dates for FY 2025-26."
        badge={
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--accent-gold)] border border-[var(--hairline)]">
            AY 2026-27 Compliance
          </span>
        }
        actions={
          <div className="flex items-center gap-2 bg-[var(--surface-raised)] border border-[var(--hairline)] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--surface)] text-[var(--primary-emerald)] font-semibold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-[var(--surface)] text-[var(--primary-emerald)] font-semibold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar View</span>
            </button>
          </div>
        }
      />

      {/* Guided Client Journey Stepper */}
      <JourneyStepper currentStepId="compute" />

      {/* Next Action Card */}
      <NextActionCard
        title="Advance Tax Q3 Installment Due on 15-Dec-2026"
        description="75% of cumulative net tax liability must be deposited by December 15th to prevent statutory interest penalty under Section 234C (1% per month on shortfall)."
        actionLabel="Verify Net Tax Liability"
        actionLink="/tax-optimization"
        tone="amber"
        badge="Urgent Compliance Deadline"
      />

      {snoozeMessage && (
        <div className="p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--primary-emerald)]/40 text-[var(--primary-emerald)] text-xs font-mono">
          {snoozeMessage}
        </div>
      )}

      {/* Main Grid: Deadlines Left (8 cols) & Notification Preferences Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All Statutory Dates' },
              { id: 'advance_tax', label: 'Advance Tax' },
              { id: '80c_cutoff', label: '80C / NPS Cutoff' },
              { id: 'itr', label: 'ITR Filing' },
              { id: 'gst', label: 'GST GSTR-3B' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-colors border ${
                  selectedFilter === f.id
                    ? 'border-[var(--primary-emerald)]/50 bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] font-semibold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]/60'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {viewMode === 'list' ? (
            <div className="space-y-4">
              {filteredDeadlines.map((d) => (
                <div
                  key={d.id}
                  className={`p-6 rounded-2xl bg-[var(--surface)] border transition-all ${
                    d.isCompleted
                      ? 'border-[var(--border)] opacity-60'
                      : d.priority === 'urgent'
                      ? 'border-[var(--semantic-danger)]/50 ring-1 ring-[var(--semantic-danger)]/30'
                      : 'border-[var(--border)] shadow-[var(--shadow-soft)]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg font-medium text-[var(--text-primary)]">{d.title}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                          d.priority === 'urgent'
                            ? 'bg-[var(--surface-raised)] text-[var(--semantic-danger)] border border-[var(--semantic-danger)]/40'
                            : d.priority === 'high'
                            ? 'bg-[var(--surface-raised)] text-[var(--semantic-warning)] border border-[var(--semantic-warning)]/40'
                            : 'bg-[var(--surface-raised)] text-[var(--text-muted)] border border-[var(--hairline)]'
                        }`}
                      >
                        {d.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-primary)]">
                      <CalendarIcon className="w-3.5 h-3.5 text-[var(--primary-emerald)]" />
                      <span>Due: {d.dueDate}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3 font-sans">{d.description}</p>

                  <div className="p-2.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] text-[11px] font-mono text-[var(--text-secondary)] mb-4">
                    <span className="text-[var(--semantic-danger)] font-semibold">Statutory Consequence: </span>
                    {d.penaltyNote}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs">
                    <div className="text-[11px] font-mono text-[var(--text-muted)]">
                      {d.snoozedUntil ? (
                        <span className="text-[var(--semantic-warning)]">{d.snoozedUntil}</span>
                      ) : (
                        <span>Applicable: {d.applicableTo}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSnooze(d.id)}
                        className="px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-secondary)] text-[11px] font-mono transition-colors border border-[var(--hairline)]"
                      >
                        Snooze 3d
                      </button>
                      <button
                        onClick={() => handleMarkDone(d.id)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1 transition-colors ${
                          d.isCompleted
                            ? 'bg-[var(--surface-raised)] text-[var(--text-muted)]'
                            : 'bg-[var(--primary-emerald)] text-white hover:bg-[var(--primary-emerald-hover)]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{d.isCompleted ? 'Mark Pending' : 'Mark Deposited'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)]">
              <h3 className="font-serif text-lg font-medium text-[var(--text-primary)] mb-4">
                Statutory Compliance Timeline (FY 2025-26)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {deadlines.map((d) => (
                  <div key={d.id} className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] space-y-2">
                    <div className="text-xs font-mono text-[var(--primary-emerald)] font-semibold">{d.dueDate}</div>
                    <div className="font-serif text-base text-[var(--text-primary)]">{d.title}</div>
                    <div className="text-xs text-[var(--text-secondary)] leading-snug font-sans">{d.penaltyNote}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Notification Preferences (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
              <Bell className="w-4 h-4 text-[var(--accent-gold)]" />
              <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                Notification Channels
              </h3>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
              Automated reminders before advance tax interest penalty triggers under Section 234B/234C.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)]">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[var(--primary-emerald)]" />
                  <div>
                    <span className="text-xs font-medium text-[var(--text-primary)] block">Email Reminders</span>
                    <span className="text-[11px] text-[var(--text-muted)]">Verified primary address</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.email}
                  onChange={(e) =>
                    setNotificationSettings((p) => ({ ...p, email: e.target.checked }))
                  }
                  className="accent-[var(--primary-emerald)] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)]">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-[var(--primary-emerald)]" />
                  <div>
                    <span className="text-xs font-medium text-[var(--text-primary)] block">WhatsApp Alerts</span>
                    <span className="text-[11px] text-[var(--text-muted)]">Challan links directly</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.whatsapp}
                  onChange={(e) =>
                    setNotificationSettings((p) => ({ ...p, whatsapp: e.target.checked }))
                  }
                  className="accent-[var(--primary-emerald)] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)]">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-[var(--primary-emerald)]" />
                  <div>
                    <span className="text-xs font-medium text-[var(--text-primary)] block">SMS Alerts</span>
                    <span className="text-[11px] text-[var(--text-muted)]">Critical statutory cutoff</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.sms}
                  onChange={(e) =>
                    setNotificationSettings((p) => ({ ...p, sms: e.target.checked }))
                  }
                  className="accent-[var(--primary-emerald)] cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Advance Notice Lead Time:
              </label>
              <select
                value={notificationSettings.daysInAdvance}
                onChange={(e) =>
                  setNotificationSettings((p) => ({ ...p, daysInAdvance: Number(e.target.value) }))
                }
                className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl p-2 text-xs text-[var(--text-primary)] font-mono outline-none"
              >
                <option value="3">3 Days Prior</option>
                <option value="7">7 Days Prior (Recommended)</option>
                <option value="14">14 Days Prior</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
