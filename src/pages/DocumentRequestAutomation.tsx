/**
 * Screen 12: Document Request Automation
 * CA builds a custom checklist for a client, sends automated ingestion requests,
 * tracks status per item (Pending, Submitted, Approved, Rejected),
 * and configures reminder schedules and escalations.
 */

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  X,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { documentService } from '../services/documentService';
import { DocumentChecklistItem, DocumentCategory } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { JourneyStepper } from '../components/common/JourneyStepper';
import { NextActionCard } from '../components/common/NextActionCard';

export const DocumentRequestAutomation: React.FC = () => {
  const { activeClient } = useApp();
  const [checklist, setChecklist] = useState<DocumentChecklistItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentCategory>('investments');
  const [newDueDate, setNewDueDate] = useState('2026-10-31');
  const [newRequired, setNewRequired] = useState(true);

  const [reminderConfig, setReminderConfig] = useState({
    frequency: 'every_3_days',
    channel: 'both',
    escalateToPartner: true,
  });

  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadChecklist();
  }, [activeClient.id]);

  const loadChecklist = async () => {
    const items = await documentService.getChecklist(activeClient.id);
    setChecklist(items);
  };

  const handleAddItem = async () => {
    if (!newTitle.trim()) return;
    await documentService.addChecklistItem(activeClient.id, {
      title: newTitle,
      category: newCategory,
      dueDate: newDueDate,
      required: newRequired,
      status: 'pending',
    });
    setNewTitle('');
    setShowAddModal(false);
    await loadChecklist();
  };

  const handleStatusChange = async (
    itemId: string,
    status: DocumentChecklistItem['status']
  ) => {
    await documentService.updateChecklistStatus(activeClient.id, itemId, status);
    await loadChecklist();
  };

  const handleSendChecklist = () => {
    setSendSuccessMsg(
      `Checklist dispatched to ${activeClient.name} (${activeClient.email}) via Email & WhatsApp Bot.`
    );
    setTimeout(() => setSendSuccessMsg(null), 4000);
  };

  const pendingCount = checklist.filter((i) => i.status === 'pending').length;
  const approvedCount = checklist.filter((i) => i.status === 'approved').length;

  return (
    <div className="space-y-8">
      {/* Standardized PageHeader */}
      <PageHeader
        title="Document Request Automation"
        description="Build tailored checklists, trigger automated email/WhatsApp reminders, and track document receipt status per item."
        badge={
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--accent-gold)] border border-[var(--hairline)]">
            Client: {activeClient.name}
          </span>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono flex items-center gap-1.5 transition-colors border border-[var(--hairline)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Checklist Item</span>
            </button>
            <button
              onClick={handleSendChecklist}
              className="px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-mono font-medium flex items-center gap-2 transition-all shadow-[var(--shadow-soft)]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Automated Checklist</span>
            </button>
          </div>
        }
      />

      {/* Guided Client Journey Stepper */}
      <JourneyStepper currentStepId="upload" />

      {/* Next Best Action Card */}
      <NextActionCard
        title={`${pendingCount} Working Paper Items Still Pending from ${activeClient.name}`}
        description="The Annual Information Statement (AIS) and landlord rent receipts remain unsubmitted. Dispatch the automated reminder cadence or follow up via WhatsApp."
        actionLabel="Send Automated Follow-up"
        onActionClick={handleSendChecklist}
        tone="amber"
        badge="Document Intake"
      />

      {sendSuccessMsg && (
        <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--primary-emerald)]/40 text-[var(--primary-emerald)] text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{sendSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Checklist Left (8 cols) & Automation Cadence Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
            <span>
              Total Items: {checklist.length} ({approvedCount} Approved, {pendingCount} Pending)
            </span>
            <span>Target Filing Date: 31-Oct-2026</span>
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.status === 'approved'
                          ? 'bg-[var(--primary-emerald)]'
                          : item.status === 'submitted'
                          ? 'bg-[var(--accent-gold)]'
                          : 'bg-[var(--text-muted)]'
                      }`}
                    />
                    <span className="font-serif text-base font-medium text-[var(--text-primary)]">
                      {item.title}
                    </span>
                    {item.required && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--semantic-danger)] border border-[var(--semantic-danger)]/40">
                        Mandatory
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono text-[var(--text-muted)]">Due: {item.dueDate}</span>
                </div>

                {item.notes && (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">{item.notes}</p>
                )}

                {/* Status action buttons */}
                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-muted)]">
                    Status: <strong className="text-[var(--text-primary)] uppercase">{item.status}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange(item.id, 'approved')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                        item.status === 'approved'
                          ? 'bg-[var(--surface-raised)] text-[var(--primary-emerald)] border border-[var(--primary-emerald)]/50'
                          : 'bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--hairline)]'
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, 'submitted')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                        item.status === 'submitted'
                          ? 'bg-[var(--surface-raised)] text-[var(--accent-gold)] border border-[var(--accent-gold)]/50'
                          : 'bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--hairline)]'
                      }`}
                    >
                      Submitted
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, 'rejected')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors ${
                        item.status === 'rejected'
                          ? 'bg-[var(--surface-raised)] text-[var(--semantic-danger)] border border-[var(--semantic-danger)]/50'
                          : 'bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--hairline)]'
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Automated Cadence & Schedule Settings */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
              <Clock className="w-4 h-4 text-[var(--accent-gold)]" />
              <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                Automated Nudge Cadence
              </h3>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Reminder Interval:</label>
                <select
                  value={reminderConfig.frequency}
                  onChange={(e) =>
                    setReminderConfig((p) => ({ ...p, frequency: e.target.value }))
                  }
                  className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl p-2 text-[var(--text-primary)] outline-none"
                >
                  <option value="every_2_days">Every 2 Days</option>
                  <option value="every_3_days">Every 3 Days (Standard)</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1">Delivery Channels:</label>
                <select
                  value={reminderConfig.channel}
                  onChange={(e) =>
                    setReminderConfig((p) => ({ ...p, channel: e.target.value }))
                  }
                  className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl p-2 text-[var(--text-primary)] outline-none"
                >
                  <option value="both">Email + WhatsApp Bot</option>
                  <option value="email">Email Only</option>
                  <option value="whatsapp">WhatsApp Only</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-[var(--text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderConfig.escalateToPartner}
                    onChange={(e) =>
                      setReminderConfig((p) => ({ ...p, escalateToPartner: e.target.checked }))
                    }
                    className="mt-0.5 accent-[var(--primary-emerald)] rounded"
                  />
                  <span className="leading-snug">
                    Escalate to CA Partner if mandatory schedules remain unsubmitted 5 days prior to statutory return cutoff.
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] p-6 space-y-4 shadow-[var(--shadow-elevated)]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                Add Document Requirement
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-[var(--text-secondary)] mb-1">Document Description</label>
                <input
                  type="text"
                  placeholder="e.g. Dividend warrant statements or Brokerage P&L"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl p-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)] font-sans"
                />
              </div>

              <div>
                <label className="block font-mono text-[var(--text-secondary)] mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl p-2 text-[var(--text-primary)] font-mono outline-none"
                >
                  <option value="form16">Form 16</option>
                  <option value="salary_slips">Salary Slips</option>
                  <option value="bank_statements">Bank Statements</option>
                  <option value="investments">Investments</option>
                  <option value="insurance">Insurance</option>
                  <option value="loans">Loans</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[var(--text-secondary)] mb-1">Due Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl p-2 text-[var(--text-primary)] font-mono outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 font-mono text-[var(--text-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRequired}
                    onChange={(e) => setNewRequired(e.target.checked)}
                    className="accent-[var(--primary-emerald)] rounded"
                  />
                  <span>Mark as Statutory Mandatory</span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-xs border border-[var(--hairline)]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white font-mono text-xs font-semibold"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
