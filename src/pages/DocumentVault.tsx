/**
 * Screen 6: Document Vault
 * Drag-and-drop upload, folders by category (Form 16, Salary slips, Bank statements, Investments, Insurance, Loans),
 * per-document status pipeline (Uploaded → OCR → Classified → Extracted → Needs Review → Verified),
 * Document Detail Drawer with split view: document OCR preview left, extracted fields with confidence badges right,
 * editable and confirmable low-confidence fields.
 */

import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  Upload,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DocumentItem, DocumentCategory, DocumentPipelineStatus, ExtractedField } from '../types';
import { documentService } from '../services/documentService';
import { StatusBadge, CitationChip } from '../components/common/StatusBadges';
import { formatINR } from '../lib/taxEngine';
import { PageHeader } from '../components/common/PageHeader';
import { JourneyStepper } from '../components/common/JourneyStepper';
import { NextActionCard } from '../components/common/NextActionCard';

const CATEGORIES: { id: DocumentCategory | 'all'; label: string; count?: number }[] = [
  { id: 'all', label: 'All Documents' },
  { id: 'form16', label: 'Form 16' },
  { id: 'salary_slips', label: 'Salary Slips' },
  { id: 'bank_statements', label: 'Bank Statements' },
  { id: 'investments', label: 'Investments & LTCG' },
  { id: 'insurance', label: 'Insurance (80D)' },
  { id: 'loans', label: 'Home Loans (24b)' },
];

export const DocumentVault: React.FC = () => {
  const { activeClient } = useApp();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [tempFieldValue, setTempFieldValue] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadDocs();
  }, [activeClient.id]);

  const loadDocs = async () => {
    const list = await documentService.getDocuments(activeClient.id);
    setDocuments(list);
  };

  const filteredDocs = documents.filter((d) => {
    const matchesCat = selectedCategory === 'all' || d.category === selectedCategory;
    const matchesSearch =
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const file = files[0];

    let category: DocumentCategory = 'bank_statements';
    const lower = file.name.toLowerCase();
    if (lower.includes('form16') || lower.includes('16')) category = 'form16';
    else if (lower.includes('salary') || lower.includes('payslip')) category = 'salary_slips';
    else if (lower.includes('loan') || lower.includes('interest')) category = 'loans';
    else if (lower.includes('cams') || lower.includes('equity') || lower.includes('mf')) category = 'investments';
    else if (lower.includes('insurance') || lower.includes('lic')) category = 'insurance';

    await documentService.uploadDocument(
      {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        category,
      },
      activeClient.id
    );

    await loadDocs();
    setIsUploading(false);
  };

  const handleEditField = (field: ExtractedField) => {
    setEditingFieldId(field.id);
    setTempFieldValue(String(field.value));
  };

  const handleSaveField = async (docId: string, fieldId: string) => {
    const updated = await documentService.updateExtractedField(docId, fieldId, tempFieldValue);
    setSelectedDoc(updated);
    setEditingFieldId(null);
    await loadDocs();
  };

  const reviewDoc = documents.find((d) => d.extractedFields.some((f) => f.needsReview));

  return (
    <div className="space-y-8">
      {/* Standardized PageHeader */}
      <PageHeader
        title="Document Vault"
        description="Encrypted working paper vault. Document Agent conducts OCR extraction, confidence scoring, and statutory schedule mapping."
        badge={
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--hairline)]">
              Assessee: {activeClient.name}
            </span>
            <span className="font-mono text-xs text-[var(--accent-gold)]">
              {documents.length} Files Uploaded
            </span>
          </div>
        }
        actions={
          <label className="cursor-pointer px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white font-mono text-xs font-medium flex items-center gap-2 transition-all shadow-[var(--shadow-soft)]">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </label>
        }
      />

      {/* Guided Client Journey Stepper */}
      <JourneyStepper currentStepId="extract" />

      {/* Next Best Action Card */}
      {reviewDoc && (
        <NextActionCard
          title={`Low Confidence Field Detected in "${reviewDoc.fileName}"`}
          description="Document Agent flagged co-ownership interest allocation as requiring human verification before statutory filing. Inspect the split view to confirm or override."
          actionLabel="Inspect & Confirm Field"
          onActionClick={() => setSelectedDoc(reviewDoc)}
          tone="amber"
          badge="Attention Required"
        />
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          isDragOver
            ? 'border-[var(--primary-emerald)] bg-[var(--primary-emerald-tint)]'
            : 'border-[var(--hairline)] hover:border-[var(--border)] bg-[var(--surface)]'
        }`}
      >
        <Upload className="w-8 h-8 text-[var(--primary-emerald)] mx-auto mb-2" />
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {isUploading ? 'Document Agent is extracting OCR layers...' : 'Drag & drop working paper files here'}
        </p>
        <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
          Supports Form 16 Part A/B, AIS/TIS JSON, CAMS Realised LTCG, Home Loan Certificates, Rent Receipts
        </p>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-colors border ${
                selectedCategory === c.id
                  ? 'border-[var(--primary-emerald)]/50 bg-[var(--primary-emerald-tint)] text-[var(--primary-emerald)] font-semibold'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]/60'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search vault documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--surface-raised)] border border-[var(--hairline)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[var(--text-primary)] font-sans outline-none focus:border-[var(--accent-gold)]"
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)] font-mono text-[var(--text-muted)]">
                <th className="py-3 px-4">Document Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4 text-center">Confidence</th>
                <th className="py-3 px-4 text-center">Fields Extracted</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] font-mono">
              {filteredDocs.map((doc) => {
                const hasLowConfidence = doc.extractedFields.some((f) => f.needsReview);

                return (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="hover:bg-[var(--surface-raised)]/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-sans font-medium text-[var(--text-primary)]">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-[var(--primary-emerald)] shrink-0" />
                        <div>
                          <span className="group-hover:text-[var(--accent-gold)] transition-colors">{doc.fileName}</span>
                          <span className="block text-[11px] text-[var(--text-muted)] font-mono">
                            {doc.fileSize} • Uploaded {doc.uploadDate}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[var(--text-secondary)] capitalize font-sans">
                      {doc.category.replace('_', ' ')}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono capitalize ${
                          doc.status === 'verified'
                            ? 'bg-[var(--surface-raised)] text-[var(--primary-emerald)] border border-[var(--primary-emerald)]/40'
                            : doc.status === 'needs_review' || hasLowConfidence
                            ? 'bg-[var(--surface-raised)] text-[var(--semantic-warning)] border border-[var(--semantic-warning)]/40'
                            : 'bg-[var(--surface-raised)] text-[var(--text-muted)] border border-[var(--hairline)]'
                        }`}
                      >
                        {doc.status === 'verified' && <CheckCircle2 className="w-3 h-3 text-[var(--primary-emerald)]" />}
                        {doc.status === 'needs_review' && <AlertTriangle className="w-3 h-3 text-[var(--semantic-warning)]" />}
                        <span>{doc.status.replace('_', ' ')}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-[var(--text-primary)]">
                      {doc.overallConfidence}%
                    </td>

                    <td className="py-3.5 px-4 text-center text-[var(--text-secondary)]">
                      {doc.extractedFields.length} fields
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoc(doc);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] group-hover:bg-[var(--surface)] group-hover:text-[var(--accent-gold)] group-hover:border group-hover:border-[var(--accent-gold)]/40 text-[var(--text-secondary)] text-[11px] font-mono transition-all border border-[var(--hairline)]"
                      >
                        Split View →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Detail Drawer (SPLIT VIEW MODAL) */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-5xl h-[85vh] rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] shadow-[var(--shadow-elevated)] flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 px-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-raised)]">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[var(--primary-emerald)]" />
                <div>
                  <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                    {selectedDoc.fileName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                    <span>Overall Confidence: {selectedDoc.overallConfidence}%</span>
                    <span>•</span>
                    <span className="capitalize">{selectedDoc.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                aria-label="Close split view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Split View Body */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border)] overflow-hidden">
              {/* Left Column: OCR Preview */}
              <div className="p-6 overflow-y-auto bg-[var(--bg-base)]/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Document OCR Layer Preview
                  </span>
                  <span className="text-[11px] font-mono text-[var(--primary-emerald)]">
                    Vision Model Extracted
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--hairline)] font-mono text-xs leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
                  {selectedDoc.ocrTextPreview || 'No OCR text available for this document.'}
                </div>

                {selectedDoc.aiNotes && (
                  <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] text-xs text-[var(--text-secondary)]">
                    <span className="font-mono text-[var(--primary-emerald)] font-semibold block mb-1">
                      Document Agent Finding:
                    </span>
                    {selectedDoc.aiNotes}
                  </div>
                )}
              </div>

              {/* Right Column: Extracted Fields with Confidence Badges */}
              <div className="p-6 overflow-y-auto space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-gold)]">
                    Extracted Fields ({selectedDoc.extractedFields.length})
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    Click field to edit & verify
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedDoc.extractedFields.map((field) => {
                    const isEditing = editingFieldId === field.id;

                    return (
                      <div
                        key={field.id}
                        className={`p-4 rounded-xl border transition-all ${
                          field.needsReview
                            ? 'border-[var(--semantic-warning)]/50 bg-[var(--surface-raised)] ring-1 ring-[var(--semantic-warning)]/30'
                            : 'border-[var(--hairline)] bg-[var(--surface-raised)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[var(--text-primary)]">
                              {field.label}
                            </span>
                            {field.sectionReference && (
                              <CitationChip section={field.sectionReference} />
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                field.confidence >= 90
                                  ? 'bg-[var(--surface)] text-[var(--primary-emerald)] border border-[var(--primary-emerald)]/40'
                                  : 'bg-[var(--surface)] text-[var(--semantic-warning)] border border-[var(--semantic-warning)]/40'
                              }`}
                            >
                              {field.confidence}% Confidence
                            </span>
                            {/* Sample Badge */}
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Sample
                            </span>
                            {field.verifiedByUser && (
                              <span className="text-[10px] font-mono text-[var(--primary-emerald)] flex items-center gap-0.5">
                                <Check className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Value Display / Edit Form */}
                        {isEditing ? (
                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="text"
                              autoFocus
                              value={tempFieldValue}
                              onChange={(e) => setTempFieldValue(e.target.value)}
                              className="flex-1 bg-[var(--surface)] border border-[var(--accent-gold)] rounded-lg px-2.5 py-1 text-xs text-[var(--text-primary)] font-mono outline-none"
                            />
                            <button
                              onClick={() => handleSaveField(selectedDoc.id, field.id)}
                              className="p-1.5 rounded-lg bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white"
                              title="Confirm Value"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingFieldId(null)}
                              className="p-1.5 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-muted)]"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-mono text-sm text-[var(--text-primary)] font-semibold">
                              {typeof field.value === 'number'
                                ? formatINR(field.value)
                                : field.value}
                            </span>
                            <button
                              onClick={() => handleEditField(field)}
                              className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-gold)] flex items-center gap-1 font-mono transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>{field.needsReview ? 'Confirm / Override' : 'Edit'}</span>
                            </button>
                          </div>
                        )}

                        {field.sourceSnippet && (
                          <div className="mt-2 text-[11px] text-[var(--text-muted)] font-mono truncate">
                            Source: "{field.sourceSnippet}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="px-5 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white font-mono text-xs font-medium transition-all shadow-sm"
                  >
                    Done Inspecting
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
