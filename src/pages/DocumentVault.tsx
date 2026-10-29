/**
 * Screen 6: Document Vault
 * Dynamic pipeline driven by uploaded documents:
 * - Doc types: FORM_16_PART_A, FORM_16_PART_B, SALARY_SLIP, FORM_26AS, AIS_TIS, CAPITAL_GAINS, RENT_RECEIPTS, INVESTMENT_PROOFS
 * - Per-field value, confidence bar, needs-review edit box (re-runs pipeline)
 * - "Why this number" tooltip using sources
 * - Processing state & error state
 * - Empty state: "Upload documents to begin" + "Load demo data" button
 */

import React, { useState } from 'react';
import {
  Upload,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2,
  Check,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DocumentItem, DocumentCategory, ExtractedField } from '../types';
import { formatINR } from '../lib/taxEngine';
import { PageHeader } from '../components/common/PageHeader';
import { JourneyStepper } from '../components/common/JourneyStepper';
import { NextActionCard } from '../components/common/NextActionCard';

const CATEGORIES: { id: DocumentCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Documents' },
  { id: 'form16', label: 'Form 16' },
  { id: 'salary_slips', label: 'Salary Slips' },
  { id: 'bank_statements', label: '26AS & AIS/TIS' },
  { id: 'investments', label: 'Investments & 80C' },
  { id: 'insurance', label: 'Health Insurance (80D)' },
];

export const DocumentVault: React.FC = () => {
  const {
    activeClient,
    documents,
    uploadDocuments,
    fileStatuses,
    fileErrors,
    missingDocTypes,
    updateExtractedField,
    loadDemoData,
    clearData,
    isAnalyzing,
    analysisError,
    sources,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [tempFieldValue, setTempFieldValue] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTooltipField, setActiveTooltipField] = useState<string | null>(null);

  const filteredDocs = documents.filter((d) => {
    const matchesCat = selectedCategory === 'all' || d.category === selectedCategory;
    const matchesSearch =
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      await uploadDocuments(Array.from(files));
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleEditField = (field: ExtractedField) => {
    setEditingFieldId(field.id);
    setTempFieldValue(String(field.value));
  };

  const handleSaveField = async (docId: string, fieldKey: string) => {
    const parsedNum = Number(tempFieldValue);
    const finalVal = !isNaN(parsedNum) && tempFieldValue.trim() !== '' ? parsedNum : tempFieldValue;
    await updateExtractedField(docId, fieldKey, finalVal);
    setEditingFieldId(null);

    // Refresh selected doc
    const updated = documents.find((d) => d.id === docId);
    if (updated) setSelectedDoc(updated);
  };

  const reviewDoc = documents.find((d) => d.extractedFields.some((f) => f.needsReview));

  return (
    <div className="space-y-8">
      {/* Standardized PageHeader */}
      <PageHeader
        title="Document Vault"
        description="Encrypted working paper vault. Uploaded documents are classified and structured without hallucination; pure math runs in the statutory tax engine."
        badge={
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--hairline)]">
              Assessee: {activeClient.name} [{activeClient.panMasked}]
            </span>
            <span className="font-mono text-xs text-[var(--accent-gold)]">
              {documents.length} Files in Vault
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2.5">
            {documents.length > 0 && (
              <button
                onClick={() => clearData()}
                className="px-3 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-mono text-xs flex items-center gap-1.5 transition-colors border border-[var(--hairline)]"
                title="Clear current documents and reset pipeline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Vault</span>
              </button>
            )}
            <button
              onClick={() => loadDemoData()}
              disabled={isAnalyzing}
              className="px-3.5 py-2 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--accent-gold)] font-mono text-xs font-medium flex items-center gap-1.5 transition-colors border border-[var(--hairline)]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Demo Data</span>
            </button>
            <label className="cursor-pointer px-4 py-2 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white font-mono text-xs font-medium flex items-center gap-2 transition-all shadow-[var(--shadow-soft)]">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PDF</span>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                disabled={isAnalyzing}
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </label>
          </div>
        }
      />

      {/* Guided Client Journey Stepper */}
      <JourneyStepper currentStepId="extract" />

      {/* Batch Processing Queue Status */}
      {Object.keys(fileStatuses).length > 0 && isAnalyzing && (
        <div className="p-4 rounded-2xl bg-[var(--surface-raised)] border border-[var(--primary-emerald)]/40 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--accent-gold)]">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--primary-emerald)]" />
              Batch Document Extraction Queue
            </span>
            <span>
              {Object.values(fileStatuses).filter((s) => s === 'done').length} /{' '}
              {Object.keys(fileStatuses).length} Processed
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(fileStatuses).map(([fileName, status]) => (
              <div
                key={fileName}
                className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--hairline)] text-[11px] font-mono flex items-center justify-between"
              >
                <span className="truncate max-w-[130px]" title={fileName}>
                  {fileName}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                    status === 'done'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : status === 'extracting'
                      ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                      : status === 'reading'
                      ? 'bg-blue-500/20 text-blue-300 animate-pulse'
                      : status === 'failed'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Document Guidance Notice */}
      {documents.length > 0 && missingDocTypes.length > 0 && !isAnalyzing && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-amber-400 flex items-center gap-1.5 font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Missing {missingDocTypes.length} Expected Document Type(s) for Full Reconciled Audit:</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">
              {missingDocTypes.map((m) => m.label).join(' • ')}. Partial statutory calculations are active based on uploaded proofs.
            </p>
          </div>
          <label className="cursor-pointer shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-xs font-medium border border-amber-500/40 transition-colors">
            Upload Missing
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </label>
        </div>
      )}

      {/* Analysis Error Alert */}
      {analysisError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Document extraction error: {analysisError}</span>
          </div>
          <button
            onClick={() => loadDemoData()}
            className="underline font-mono text-xs hover:text-red-300 ml-4"
          >
            Load verified demo test-pack instead
          </button>
        </div>
      )}

      {/* Processing State Indicator (Single File fallback) */}
      {isAnalyzing && Object.keys(fileStatuses).length === 0 && (
        <div className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--primary-emerald)]/40 flex items-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 text-[var(--primary-emerald)] animate-spin" />
          <div className="text-xs font-mono">
            <span className="text-[var(--text-primary)] font-semibold block">
              Extracting text layer with pdfjs-dist & classifying document...
            </span>
            <span className="text-[var(--text-muted)]">
              Pure deterministic extraction with zero hallucinated figures.
            </span>
          </div>
        </div>
      )}

      {/* Next Best Action Card for Low Confidence / Needs Review */}
      {reviewDoc && (
        <NextActionCard
          title={`Verification Flag: Review Required in "${reviewDoc.fileName}"`}
          description="Document Agent flagged fields with confidence below 0.8. Confirm or override the value in the split view to re-run the statutory pipeline."
          actionLabel="Inspect & Confirm Field"
          onActionClick={() => setSelectedDoc(reviewDoc)}
          tone="amber"
          badge="Review Needed"
        />
      )}

      {/* Empty State: No Documents */}
      {documents.length === 0 && !isAnalyzing && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--hairline)] p-12 text-center bg-[var(--surface)] space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--surface-raised)] flex items-center justify-center text-[var(--accent-gold)]">
            <Upload className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-medium text-[var(--text-primary)]">
              Upload documents to begin
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              Drop Form 16 (Part A & B), Salary Slips, Form 26AS, AIS/TIS, or Capital Gains statements here.
              Values are extracted and cross-checked automatically.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white text-xs font-mono font-medium flex items-center gap-2 transition-all shadow-[var(--shadow-soft)]">
              <Upload className="w-4 h-4" />
              <span>Choose Files to Upload</span>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </label>
            <span className="text-xs text-[var(--text-muted)] font-mono">or</span>
            <button
              onClick={() => loadDemoData()}
              className="px-5 py-2.5 rounded-xl bg-[var(--surface-raised)] hover:bg-[var(--surface)] text-[var(--accent-gold)] border border-[var(--hairline)] text-xs font-mono font-medium flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Demo Data (8 PDFs)</span>
            </button>
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      {documents.length > 0 && (
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
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            isDragOver
              ? 'border-[var(--primary-emerald)] bg-[var(--primary-emerald-tint)]'
              : 'border-[var(--hairline)] hover:border-[var(--border)] bg-[var(--surface)]'
          }`}
        >
          <Upload className="w-6 h-6 text-[var(--primary-emerald)] mx-auto mb-1.5" />
          <p className="text-xs font-medium text-[var(--text-primary)]">
            Drag & drop additional working paper files to update calculations
          </p>
          <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
            Supports Form 16 Part A/B, Salary Slips, 26AS, AIS/TIS, Capital Gains, Rent Receipts, 80C/80D proofs
          </p>
        </div>
      )}

      {/* Category Tabs & Search Bar */}
      {documents.length > 0 && (
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
      )}

      {/* Documents Table */}
      {documents.length > 0 && (
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-soft)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)] font-mono text-[var(--text-muted)]">
                  <th className="py-3 px-4">Document Name</th>
                  <th className="py-3 px-4">Doc Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4 text-center">Extracted Fields</th>
                  <th className="py-3 px-4">Pipeline Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-mono">
                {filteredDocs.map((doc) => {
                  const hasLowConfidence = doc.extractedFields.some((f) => f.needsReview);
                  const docType = doc.aiNotes?.match(/AI classification:\s*([A-Z0-9_]+)/)?.[1] || doc.category.toUpperCase();

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

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--accent-gold)] border border-[var(--hairline)]">
                          {docType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[var(--text-secondary)] capitalize font-sans">
                        {doc.category.replace('_', ' ')}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[var(--hairline)] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                doc.overallConfidence >= 90
                                  ? 'bg-[var(--primary-emerald)]'
                                  : doc.overallConfidence >= 80
                                  ? 'bg-amber-400'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${doc.overallConfidence}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                            {doc.overallConfidence}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center text-[var(--text-secondary)]">
                        {doc.extractedFields.length} fields
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
                          {(doc.status === 'needs_review' || hasLowConfidence) && (
                            <AlertTriangle className="w-3 h-3 text-[var(--semantic-warning)]" />
                          )}
                          <span>{hasLowConfidence ? 'Needs Review' : doc.status.replace('_', ' ')}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDoc(doc);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] group-hover:bg-[var(--surface)] group-hover:text-[var(--accent-gold)] group-hover:border group-hover:border-[var(--accent-gold)]/40 text-[var(--text-secondary)] text-[11px] font-mono transition-all border border-[var(--hairline)]"
                        >
                          Inspect & Edit →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              {/* Left Column: OCR Preview & Findings */}
              <div className="p-6 overflow-y-auto bg-[var(--bg-base)]/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Document Text Layer Preview
                  </span>
                  <span className="text-[11px] font-mono text-[var(--primary-emerald)] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    pdfjs-dist Verified
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--hairline)] font-mono text-xs leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {selectedDoc.ocrTextPreview || 'Text layer parsed successfully.'}
                </div>

                {selectedDoc.aiNotes && (
                  <div className="p-3.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--hairline)] text-xs text-[var(--text-secondary)]">
                    <span className="font-mono text-[var(--primary-emerald)] font-semibold block mb-1">
                      Classification & Extraction Summary:
                    </span>
                    {selectedDoc.aiNotes}
                  </div>
                )}
              </div>

              {/* Right Column: Extracted Fields with Confidence Badges & "Why this number" Tooltip */}
              <div className="p-6 overflow-y-auto space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent-gold)]">
                    Extracted Fields ({selectedDoc.extractedFields.length})
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    Edits re-run pure tax engine
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedDoc.extractedFields.map((field) => {
                    const isEditing = editingFieldId === field.id;
                    const whyInfo = sources[field.key] || field.sourceSnippet;

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
                            {/* "Why this number" tooltip trigger */}
                            {whyInfo && (
                              <div className="relative inline-block">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveTooltipField(activeTooltipField === field.id ? null : field.id)
                                  }
                                  className="text-[var(--text-muted)] hover:text-[var(--accent-gold)] p-0.5 transition-colors"
                                  title="Why this number?"
                                >
                                  <HelpCircle className="w-3.5 h-3.5" />
                                </button>
                                {activeTooltipField === field.id && (
                                  <div className="absolute left-0 bottom-full mb-1 z-30 w-64 p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--accent-gold)]/40 shadow-xl text-[11px] font-mono text-[var(--text-secondary)]">
                                    <span className="text-[var(--accent-gold)] font-semibold block mb-1">
                                      Why this number:
                                    </span>
                                    <span>
                                      {typeof whyInfo === 'object'
                                        ? `${whyInfo.source || ''} - ${whyInfo.snippet || JSON.stringify(whyInfo)}`
                                        : whyInfo}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Visual Confidence Bar */}
                            <div className="w-12 h-1.5 rounded-full bg-[var(--hairline)] overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  field.confidence >= 90
                                    ? 'bg-[var(--primary-emerald)]'
                                    : field.confidence >= 80
                                    ? 'bg-amber-400'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${field.confidence}%` }}
                              />
                            </div>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                field.confidence >= 80
                                  ? 'bg-[var(--surface)] text-[var(--primary-emerald)] border border-[var(--primary-emerald)]/40'
                                  : 'bg-[var(--surface)] text-[var(--semantic-warning)] border border-[var(--semantic-warning)]/40'
                              }`}
                            >
                              {field.confidence}%
                            </span>
                            {field.needsReview && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                Needs Review
                              </span>
                            )}
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
                              placeholder="Enter corrected value"
                            />
                            <button
                              onClick={() => handleSaveField(selectedDoc.id, field.key)}
                              className="p-1.5 rounded-lg bg-[var(--primary-emerald)] hover:bg-[var(--primary-emerald-hover)] text-white"
                              title="Save & re-run tax pipeline"
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
                                : String(field.value)}
                            </span>
                            <button
                              onClick={() => handleEditField(field)}
                              className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-gold)] flex items-center gap-1 font-mono transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>{field.needsReview ? 'Verify / Edit' : 'Edit'}</span>
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
