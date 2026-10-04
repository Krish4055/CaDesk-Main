/**
 * Document Service Layer
 * Supports document upload simulation, pipeline progression, confidence updates, and checklist tracking.
 */

import { DocumentItem, DocumentChecklistItem, ExtractedField, DocumentPipelineStatus } from '../types';
import { MOCK_DOCUMENTS } from '../data/mockDocuments';

const DOC_STORAGE_KEY = 'cadesk_documents_v1';
const CHECKLIST_STORAGE_KEY = 'cadesk_checklists_v1';

export const INITIAL_CHECKLIST: DocumentChecklistItem[] = [
  {
    id: 'chk-1',
    title: 'Form 16 (Part A and Part B) signed with TRACES watermark',
    category: 'form16',
    required: true,
    status: 'approved',
    dueDate: '2026-10-15',
    notes: 'Uploaded from HR portal. Digital signature verified.',
  },
  {
    id: 'chk-2',
    title: 'Annual Housing Loan Interest & Principal Certificate (Provisional/Final)',
    category: 'loans',
    required: true,
    status: 'submitted',
    dueDate: '2026-10-20',
    notes: 'HDFC Bank certificate uploaded, co-ownership share verification pending.',
  },
  {
    id: 'chk-3',
    title: 'Consolidated Mutual Fund Realised Capital Gain Statement (CAMS/KFintech)',
    category: 'investments',
    required: true,
    status: 'approved',
    dueDate: '2026-10-25',
    notes: 'LTCG and STCG classified with 31-Jan-2018 grandfathering NAV.',
  },
  {
    id: 'chk-4',
    title: 'Annual Information Statement (AIS) & Tax Information Summary (TIS) JSON/PDF',
    category: 'bank_statements',
    required: true,
    status: 'pending',
    dueDate: '2026-10-28',
    notes: 'Awaiting download from IT e-filing portal.',
  },
  {
    id: 'chk-5',
    title: 'Rent Receipts & Landlord PAN Declaration (if annual rent > ₹1,00,000)',
    category: 'salary_slips',
    required: false,
    status: 'pending',
    dueDate: '2026-11-05',
    notes: 'Required for HRA claim exemption in Old Regime.',
  },
];

class DocumentService {
  private docs: DocumentItem[] = [];
  private checklists: Record<string, DocumentChecklistItem[]> = {};

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(DOC_STORAGE_KEY);
      this.docs = stored ? JSON.parse(stored) : [...MOCK_DOCUMENTS];

      const storedChecklist = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      this.checklists = storedChecklist ? JSON.parse(storedChecklist) : { 'ind-arjun': INITIAL_CHECKLIST };
    } catch {
      this.docs = [...MOCK_DOCUMENTS];
      this.checklists = { 'ind-arjun': INITIAL_CHECKLIST };
    }
  }

  private save() {
    try {
      localStorage.setItem(DOC_STORAGE_KEY, JSON.stringify(this.docs));
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(this.checklists));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  public async getDocuments(clientId?: string): Promise<DocumentItem[]> {
    await new Promise((r) => setTimeout(r, 40));
    if (clientId) {
      return this.docs.filter((d) => d.clientId === clientId || d.clientId === 'ind-arjun');
    }
    return [...this.docs];
  }

  public async updateExtractedField(
    docId: string,
    fieldId: string,
    newValue: string | number
  ): Promise<DocumentItem> {
    const doc = this.docs.find((d) => d.id === docId);
    if (!doc) throw new Error('Document not found');

    const field = doc.extractedFields.find((f) => f.id === fieldId);
    if (!field) throw new Error('Field not found');

    field.value = newValue;
    field.confidence = 100;
    field.needsReview = false;
    field.verifiedByUser = true;

    // Check if all fields are confirmed
    const hasPendingReview = doc.extractedFields.some((f) => f.needsReview);
    if (!hasPendingReview && doc.status === 'needs_review') {
      doc.status = 'verified';
    }

    this.save();
    return { ...doc };
  }

  public async uploadDocument(
    file: { name: string; size: string; category: DocumentItem['category'] },
    clientId: string = 'ind-arjun'
  ): Promise<DocumentItem> {
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      clientId,
      fileName: file.name,
      fileSize: file.size,
      category: file.category,
      uploadDate: new Date().toISOString().substring(0, 10),
      status: 'uploaded',
      overallConfidence: 85,
      ocrTextPreview: `Preview extraction for ${file.name}...\nProcessing OCR layers via Document Agent.`,
      extractedFields: [
        {
          id: `f-${Date.now()}-1`,
          key: 'document_title',
          label: 'Document Identifier',
          value: file.name.replace(/\.[^/.]+$/, ''),
          confidence: 90,
          needsReview: false,
        },
      ],
      aiNotes: 'File uploaded into vault. Queued for OCR classification and statutory validation.',
    };

    this.docs.unshift(newDoc);
    this.save();

    // Trigger mock pipeline progression in background
    setTimeout(() => {
      newDoc.status = 'ocr';
      this.save();
      setTimeout(() => {
        newDoc.status = 'extracted';
        this.save();
      }, 1000);
    }, 800);

    return newDoc;
  }

  public async getChecklist(clientId: string = 'ind-arjun'): Promise<DocumentChecklistItem[]> {
    await new Promise((r) => setTimeout(r, 30));
    return this.checklists[clientId] || INITIAL_CHECKLIST;
  }

  public async addChecklistItem(clientId: string, item: Omit<DocumentChecklistItem, 'id'>): Promise<DocumentChecklistItem[]> {
    if (!this.checklists[clientId]) {
      this.checklists[clientId] = [...INITIAL_CHECKLIST];
    }
    const newItem: DocumentChecklistItem = {
      ...item,
      id: `chk-${Date.now()}`,
    };
    this.checklists[clientId].push(newItem);
    this.save();
    return [...this.checklists[clientId]];
  }

  public async updateChecklistStatus(
    clientId: string,
    itemId: string,
    status: DocumentChecklistItem['status']
  ): Promise<DocumentChecklistItem[]> {
    const items = this.checklists[clientId] || INITIAL_CHECKLIST;
    const item = items.find((i) => i.id === itemId);
    if (item) {
      item.status = status;
      this.checklists[clientId] = items;
      this.save();
    }
    return [...(this.checklists[clientId] || [])];
  }
}

export const documentService = new DocumentService();
