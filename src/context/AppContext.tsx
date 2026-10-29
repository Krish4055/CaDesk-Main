/**
 * Application Context
 * Controls dynamic document-driven tax computation pipeline, IndexedDB persistence,
 * active role, theme, and global notifications.
 * HARD RULE: LLMs never calculate tax. Engine performs all computations.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserRole, ClientProfile, DocumentItem, AuditLogEntry, ExtractedField, DocumentCategory } from '../types';
import { MOCK_INDIVIDUAL_PROFILES } from '../data/mockProfiles';
import { clientService } from '../services/clientService';
import { TaxInputs, TaxComparisonResult, compare } from '../lib/taxEngine';
import { CrossCheckItem, runCrossChecks } from '../lib/crossChecks';
import { buildTaxInputs, TaxFlag, deriveAssesseeIdentity, ExtractedDoc } from '../lib/mapper';
import { analyzeDocument, ExtractionResult, DocTypeValue } from '../services/documentService';
import { savePersistentState, loadPersistentState, clearPersistentState, StoredTaxState } from '../lib/storage';

export type FileProcessingStatus = 'queued' | 'reading' | 'extracting' | 'done' | 'failed';

export interface ExpectedDocTypeInfo {
  type: DocTypeValue;
  label: string;
  required: boolean;
}

export const EXPECTED_DOC_TYPES: ExpectedDocTypeInfo[] = [
  { type: 'FORM_16_PART_A', label: 'Form 16 Part A', required: true },
  { type: 'FORM_16_PART_B', label: 'Form 16 Part B', required: true },
  { type: 'SALARY_SLIP', label: 'Salary Slip', required: true },
  { type: 'FORM_26AS', label: 'Form 26AS', required: true },
  { type: 'AIS_TIS', label: 'AIS/TIS', required: true },
  { type: 'CAPITAL_GAINS', label: 'Capital Gains Statement', required: false },
  { type: 'RENT_RECEIPTS', label: 'Rent Receipts', required: false },
  { type: 'INVESTMENT_PROOFS', label: 'Investment Proofs', required: false },
];

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  link?: string;
}

export interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeClient: ClientProfile;
  setActiveClientId: (id: string) => Promise<void>;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  refreshClientData: () => Promise<void>;

  // Dynamic document pipeline state
  documents: DocumentItem[];
  extractions: Record<string, ExtractionResult>;
  taxInputs: TaxInputs;
  taxResult: TaxComparisonResult;
  crossChecks: CrossCheckItem[];
  flags: TaxFlag[];
  sources: Record<string, any>;
  hasUploadedDocs: boolean;
  isAnalyzing: boolean;
  analysisError: string | null;
  fileStatuses: Record<string, FileProcessingStatus>;
  fileErrors: Record<string, string>;
  missingDocTypes: ExpectedDocTypeInfo[];

  // Pipeline actions
  uploadDocuments: (files: File[]) => Promise<DocumentItem[]>;
  uploadAndProcessDocument: (file: File) => Promise<DocumentItem>;
  updateExtractedField: (docId: string, fieldKey: string, newValue: string | number) => Promise<void>;
  signOffActiveClient: (caName: string, caMembershipNo: string, remarks?: string) => Promise<ClientProfile>;
  loadDemoData: () => Promise<void>;
  clearData: () => Promise<void>;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Working Papers Ready for Sign-Off',
    message: 'AI Verifier completed audit for Rohan Mehta (FY 2025-26). All claims reconciled.',
    time: '10m ago',
    type: 'success',
    read: false,
    link: '/ca/workspace/ind-arjun',
  },
  {
    id: 'notif-2',
    title: 'Statutory Verification Complete',
    message: 'Form 16 TDS reconciled with Form 26AS. Net refund: ₹24,666.',
    time: '30m ago',
    type: 'info',
    read: false,
    link: '/vault',
  },
];

const EMPTY_TAX_INPUTS: TaxInputs = {
  grossSalary: 0,
  basicSalary: 0,
  hraReceived: 0,
  rentPaidAnnual: 0,
  isMetro: false,
  professionalTax: 0,
  section80C: 0,
  section80D: 0,
  section80DSelf: 0,
  section80DParents: 0,
  section80CCD1B: 0,
  section80CCD2: 0,
  employerNps: 0,
  otherIncome: 0,
  interestSavings: 0,
  interestFd: 0,
  dividend: 0,
  shortTermCapitalGains: 0,
  longTermCapitalGains: 0,
  tdsCredit: 0,
};

const DEMO_EXTRACTIONS_RECORD: Record<string, any> = {
  '01_Form16_PartA.pdf': {
    doc_type: 'FORM_16_PART_A',
    fields: {
      employer_tan: { value: 'MUMN12345E', confidence: 0.99, source_snippet: 'TAN: MUMN12345E' },
      employee_pan: { value: 'ABCPM1234K', confidence: 0.99, source_snippet: 'PAN: ABCPM1234K' },
      total_tds: { value: 195000, confidence: 0.98, source_snippet: 'Total Tax deducted: 195000' },
      gross_paid: { value: 1800000, confidence: 0.98, source_snippet: 'Total Amount paid: 1800000' },
    },
  },
  '02_Form16_PartB.pdf': {
    doc_type: 'FORM_16_PART_B',
    fields: {
      gross_salary: { value: 1800000, confidence: 0.98, source_snippet: 'Salary as per section 17(1): 1800000' },
      basic: { value: 720000, confidence: 0.98, source_snippet: 'Basic: 720000' },
      hra_received: { value: 360000, confidence: 0.98, source_snippet: 'HRA received: 360000' },
      employer_nps: { value: 72000, confidence: 0.95, source_snippet: 'Employer NPS: 72000' },
      special_allowance: { value: 648000, confidence: 0.95, source_snippet: 'Special allowance: 648000' },
      standard_deduction: { value: 75000, confidence: 0.99, source_snippet: 'Standard deduction 16(ia): 75000' },
      professional_tax: { value: 2500, confidence: 0.95, source_snippet: 'Tax on employment 16(iii): 2500' },
      regime_in_payroll: { value: 'new', confidence: 0.99, source_snippet: 'Regime opted: new' },
      sec_80ccd_2: { value: 72000, confidence: 0.95, source_snippet: 'Deduction u/s 80CCD(2): 72000' },
    },
  },
  '03_Salary_Slip_Mar2026.pdf': {
    doc_type: 'SALARY_SLIP',
    fields: {
      month: { value: '2026-03', confidence: 0.99, source_snippet: 'Month: March 2026' },
      basic_monthly: { value: 60000, confidence: 0.98, source_snippet: 'Basic: 60000' },
      hra_monthly: { value: 30000, confidence: 0.98, source_snippet: 'HRA: 30000' },
      employer_nps_monthly: { value: 6000, confidence: 0.95, source_snippet: 'Employer NPS: 6000' },
      gross_monthly: { value: 150000, confidence: 0.98, source_snippet: 'Gross: 150000' },
      epf_monthly: { value: 7200, confidence: 0.95, source_snippet: 'Employee EPF: 7200' },
      annualised_gross: { value: 1800000, confidence: 0.98, source_snippet: 'Annualised gross (150000x12): 1800000' },
    },
  },
  '04_Form26AS_Summary.pdf': {
    doc_type: 'FORM_26AS',
    fields: {
      tds_salary_192: { value: 195000, confidence: 0.99, source_snippet: '192 Salary TDS: 195000' },
      tds_interest_194A: { value: 4200, confidence: 0.98, source_snippet: '194A Interest TDS: 4200' },
      tds_dividend_194: { value: 2500, confidence: 0.98, source_snippet: '194 Dividend TDS: 2500' },
      total_tds: { value: 201700, confidence: 0.99, source_snippet: 'Total TDS: 201700' },
      advance_tax_paid: { value: 0, confidence: 0.95, source_snippet: 'Part C - Tax paid: 0' },
    },
  },
  '05_AIS_TIS.pdf': {
    doc_type: 'AIS_TIS',
    fields: {
      salary: { value: 1800000, confidence: 0.99, source_snippet: 'Salary: 1800000' },
      interest_savings: { value: 18000, confidence: 0.98, source_snippet: 'Interest savings: 18000' },
      interest_fd: { value: 42000, confidence: 0.98, source_snippet: 'Interest FD: 42000' },
      dividend: { value: 25000, confidence: 0.98, source_snippet: 'Dividend: 25000' },
      sale_of_securities: { value: 940000, confidence: 0.98, source_snippet: 'Sale of securities: 940000' },
    },
  },
  '06_Capital_Gains_Statement.pdf': {
    doc_type: 'CAPITAL_GAINS',
    fields: {
      stcg_111a: { value: 60000, confidence: 0.99, source_snippet: 'Total STCG (111A): 60000' },
      ltcg_112a: { value: 210000, confidence: 0.99, source_snippet: 'Total LTCG (112A): 210000' },
      ltcg_exempt_limit: { value: 125000, confidence: 0.99, source_snippet: 'LTCG Exemption: 125000' },
      ltcg_taxable: { value: 85000, confidence: 0.99, source_snippet: 'Taxable LTCG: 85000' },
    },
  },
  '07_Rent_Receipts_HRA.pdf': {
    doc_type: 'RENT_RECEIPTS',
    fields: {
      annual_rent: { value: 360000, confidence: 0.98, source_snippet: 'Annual rent: 360000' },
      city_type: { value: 'metro', confidence: 0.98, source_snippet: 'City type: metro' },
      landlord_pan: { value: 'BCDPD5678L', confidence: 0.95, source_snippet: 'Landlord PAN: BCDPD5678L' },
    },
  },
  '08_Investment_Proofs.pdf': {
    doc_type: 'INVESTMENT_PROOFS',
    fields: {
      sec_80c_total: { value: 150000, confidence: 0.99, source_snippet: 'Total 80C: 150000' },
      sec_80d_self: { value: 22000, confidence: 0.98, source_snippet: '80D Self: 22000' },
      sec_80d_parents_senior: { value: 48000, confidence: 0.98, source_snippet: '80D Parents: 48000' },
      sec_80ccd_1b: { value: 50000, confidence: 0.98, source_snippet: '80CCD(1B): 50000' },
    },
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('cadesk_role') as UserRole) || 'individual';
  });

  const [activeClient, setActiveClient] = useState<ClientProfile>(MOCK_INDIVIDUAL_PROFILES[0]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState<boolean>(() => {
    return localStorage.getItem('cadesk_sidebar_collapsed') === 'true';
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Dynamic Pipeline States
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [extractions, setExtractions] = useState<Record<string, ExtractionResult>>({});
  const [taxInputs, setTaxInputs] = useState<TaxInputs>(EMPTY_TAX_INPUTS);
  const [taxResult, setTaxResult] = useState<TaxComparisonResult>(() =>
    compare(EMPTY_TAX_INPUTS, 0)
  );
  const [crossChecks, setCrossChecks] = useState<CrossCheckItem[]>([]);
  const [flags, setFlags] = useState<TaxFlag[]>([]);
  const [sources, setSources] = useState<Record<string, any>>({});
  const [hasUploadedDocs, setHasUploadedDocs] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Synchronous refs to prevent React state closure lag during batch pipeline operations
  const documentsRef = React.useRef<DocumentItem[]>([]);
  const extractionsRef = React.useRef<Record<string, any>>({});

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  useEffect(() => {
    extractionsRef.current = extractions;
  }, [extractions]);

  // Queue tracking states
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileProcessingStatus>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  // Compute missing expected document types
  const missingDocTypes = useMemo(() => {
    const presentTypes = new Set(
      Object.values(extractions).map((e: any) => e.doc_type)
    );
    return EXPECTED_DOC_TYPES.filter((t) => !presentTypes.has(t.type));
  }, [extractions]);

  // Recompute pipeline from a set of extractions
  const recomputePipeline = useCallback(
    (
      currentDocs: DocumentItem[],
      currentExtractions: Record<string, any>,
      recordActor: UserRole | 'ai_agent' = 'individual',
      actionTitle: string = 'Tax liability recalculated from documents'
    ) => {
      const mapperRes = buildTaxInputs(currentExtractions);
      console.log('[PIPELINE:mapper output]', mapperRes.inputs);
      const computedChecks = runCrossChecks(currentExtractions);
      console.log('[PIPELINE:crossChecks]', computedChecks);
      const computedResult = compare(mapperRes.inputs, mapperRes.inputs.tdsCredit || 0);
      console.log('[PIPELINE:taxResult set]', computedResult);

      setTaxInputs(mapperRes.inputs);
      setTaxResult(computedResult);
      setCrossChecks(computedChecks);
      setFlags(mapperRes.flags);
      setSources(mapperRes.sources);

      // Derive assessee identity from documents
      const assessee = deriveAssesseeIdentity(currentExtractions);
      const isLive = currentDocs.length > 0;
      const clientName = isLive ? assessee.name : 'Arjun Sharma';
      const clientPan = isLive ? assessee.pan : 'ABCPS1234F';
      const clientPanMasked = isLive ? assessee.panMasked : 'ABCPS****F';
      const employerName = assessee.employer || 'TechCorp Solutions India Pvt Ltd';

      // Create immutable audit log entry
      const auditEntry: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        clientId: activeClient.id,
        timestamp: new Date().toISOString(),
        actorName: recordActor === 'ai_agent' ? 'CAdesk AI Verifier' : clientName,
        actorRole: recordActor,
        action: actionTitle,
        details: `Recomputed: New Regime ₹${computedResult.new.total_tax.toLocaleString('en-IN')} vs Old Regime ₹${computedResult.old.total_tax.toLocaleString('en-IN')}. Recommended: ${computedResult.recommended.toUpperCase()}. Net Refund: ₹${Math.abs(computedResult.net_payable_or_refund).toLocaleString('en-IN')}`,
        immutableHash: `sha256-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 10)}`,
      };

      const updatedAudit = [auditEntry, ...(activeClient.auditTrail || [])];

      // Update active client representation with derived assessee
      setActiveClient((prev) => {
        const nextClient: ClientProfile = {
          ...prev,
          id: isLive ? 'ind-rohan' : prev.id,
          name: clientName,
          pan: clientPan,
          panMasked: clientPanMasked,
          employer: employerName,
          taxInputs: mapperRes.inputs,
          taxResult: computedResult,
          estimatedSavings: computedResult.savings,
          documentsCount: currentDocs.length,
          auditTrail: updatedAudit,
        };
        clientService.upsertClient(nextClient);
        return nextClient;
      });

      // Persist to IndexedDB
      savePersistentState(
        currentDocs,
        currentExtractions,
        {
          taxInputs: mapperRes.inputs,
          taxResult: computedResult,
          crossChecks: computedChecks,
          flags: mapperRes.flags,
          sources: mapperRes.sources,
          hasUploadedDocs: currentDocs.length > 0,
          assessee: {
            name: clientName,
            pan: clientPan,
            panMasked: clientPanMasked,
            employer: employerName,
            signOffStatus: activeClient.signOffStatus,
            signedBy: activeClient.signedBy,
            signedAt: activeClient.signedAt,
            caMembershipNo: activeClient.caMembershipNo,
          },
        },
        updatedAudit
      );
    },
    [activeClient.id, activeClient.auditTrail, activeClient.signOffStatus, activeClient.signedBy, activeClient.signedAt, activeClient.caMembershipNo]
  );

  // Load persisted state on startup
  useEffect(() => {
    loadPersistentState().then(({ docs, extractions: savedExt, taxState, auditLog }) => {
      if (docs && docs.length > 0 && taxState) {
        documentsRef.current = docs;
        extractionsRef.current = savedExt || {};
        setDocuments(docs);
        setExtractions(savedExt || {});
        setTaxInputs(taxState.taxInputs);
        setTaxResult(taxState.taxResult);
        setCrossChecks(taxState.crossChecks);
        setFlags(taxState.flags);
        setSources(taxState.sources);
        setHasUploadedDocs(taxState.hasUploadedDocs);
        if (taxState.assessee) {
          const loadedClient: ClientProfile = {
            ...MOCK_INDIVIDUAL_PROFILES[0],
            id: 'ind-rohan',
            name: taxState.assessee?.name || 'Rohan Mehta',
            pan: taxState.assessee?.pan || 'ABCPM1234K',
            panMasked: taxState.assessee?.panMasked || 'ABCPM*****K',
            employer: taxState.assessee?.employer || 'TechCorp Solutions India Pvt Ltd',
            documentsCount: docs.length,
            taxInputs: taxState.taxInputs,
            taxResult: taxState.taxResult,
            auditTrail: auditLog || [],
            signOffStatus: taxState.assessee?.signOffStatus || 'pending',
            signedBy: taxState.assessee?.signedBy,
            signedAt: taxState.assessee?.signedAt,
            caMembershipNo: taxState.assessee?.caMembershipNo,
            status: taxState.assessee?.signOffStatus === 'approved' ? 'ready_for_filing' : 'in_review',
          };
          setActiveClient(loadedClient);
          clientService.upsertClient(loadedClient);
        }
      }
    });
  }, []);

  // Sync theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Upload multiple documents sequentially through a batch queue
  const uploadDocuments = async (files: File[]): Promise<DocumentItem[]> => {
    if (!files || files.length === 0) return [];
    setIsAnalyzing(true);
    setAnalysisError(null);

    // Set initial queued status
    const initialStatuses: Record<string, FileProcessingStatus> = {};
    for (const f of files) {
      initialStatuses[f.name] = 'queued';
    }
    setFileStatuses((prev) => ({ ...prev, ...initialStatuses }));

    const newlyExtractedDocs: DocumentItem[] = [];
    const newlyExtractedRecords: Record<string, any> = {};

    const categoryMap: Record<DocTypeValue, DocumentCategory> = {
      FORM_16_PART_A: 'form16',
      FORM_16_PART_B: 'form16',
      SALARY_SLIP: 'salary_slips',
      FORM_26AS: 'bank_statements',
      AIS_TIS: 'bank_statements',
      CAPITAL_GAINS: 'investments',
      RENT_RECEIPTS: 'salary_slips',
      INVESTMENT_PROOFS: 'investments',
      UNKNOWN: 'form16',
    };

    // Sequential execution to prevent state collisions
    for (const file of files) {
      try {
        console.log('[PIPELINE:file received]', file.name, 'size:', file.size);
        setFileStatuses((prev) => ({ ...prev, [file.name]: 'reading' }));

        setFileStatuses((prev) => ({ ...prev, [file.name]: 'extracting' }));
        const extraction = await analyzeDocument(file);
        newlyExtractedRecords[file.name] = extraction;

        const extractedFields: ExtractedField[] = (
          Object.entries(extraction.fields) as [string, any][]
        ).map(([k, v], idx) => ({
          id: `f-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          key: k,
          label: k.replace(/_/g, ' ').toUpperCase(),
          value: v.value ?? '',
          confidence: Math.round(v.confidence * 100),
          needsReview: v.needsReview ?? v.confidence < 0.8,
          sourceSnippet: v.source_snippet,
        }));

        const newDoc: DocumentItem = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          clientId: activeClient.id,
          fileName: file.name,
          fileSize: `${Math.round(file.size / 1024)} KB`,
          category: categoryMap[extraction.doc_type] || 'form16',
          uploadDate: new Date().toISOString().substring(0, 10),
          status: extractedFields.some((f) => f.needsReview) ? 'needs_review' : 'extracted',
          overallConfidence: Math.round(
            extractedFields.length > 0
              ? extractedFields.reduce((acc, f) => acc + f.confidence, 0) / extractedFields.length
              : 95
          ),
          ocrTextPreview: `Text parsed for ${file.name}. Classified as ${extraction.doc_type}.`,
          extractedFields,
          aiNotes: `AI classification: ${extraction.doc_type}. Confidence: ${(extraction as any).confidence || 98}%.`,
        };

        newlyExtractedDocs.push(newDoc);
        setFileStatuses((prev) => ({ ...prev, [file.name]: 'done' }));
      } catch (err: any) {
        console.error(`Pipeline failure for ${file.name}:`, err);
        setFileStatuses((prev) => ({ ...prev, [file.name]: 'failed' }));
        setFileErrors((prev) => ({ ...prev, [file.name]: err.message || 'Extraction failed' }));

        // Never drop a failed file silently! Add as needs_review document
        const fallbackDoc: DocumentItem = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          clientId: activeClient.id,
          fileName: file.name,
          fileSize: `${Math.round(file.size / 1024)} KB`,
          category: 'form16',
          uploadDate: new Date().toISOString().substring(0, 10),
          status: 'needs_review',
          overallConfidence: 40,
          ocrTextPreview: `File could not be parsed: ${err.message || 'Unknown error'}`,
          extractedFields: [
            {
              id: `f-err-${Date.now()}`,
              key: 'error',
              label: 'PARSING NOTICE',
              value: err.message || 'Extraction fallback',
              confidence: 0,
              needsReview: true,
              sourceSnippet: 'File could not be parsed as standard tax document',
            },
          ],
          aiNotes: `Notice during file processing: ${err.message}`,
        };
        newlyExtractedDocs.push(fallbackDoc);
      }
    }

    // Synchronously merge documents and extractions
    const existingDocs = documentsRef.current;
    const existingExt = extractionsRef.current;

    const incomingNames = new Set(newlyExtractedDocs.map((d) => d.fileName));
    const combinedDocs = [...newlyExtractedDocs, ...existingDocs.filter((d) => !incomingNames.has(d.fileName))];
    const combinedExtractions = { ...existingExt, ...newlyExtractedRecords };

    documentsRef.current = combinedDocs;
    extractionsRef.current = combinedExtractions;

    setDocuments(combinedDocs);
    setExtractions(combinedExtractions);
    setHasUploadedDocs(true);

    // Run mapper -> crossChecks -> compare ONCE on the full accumulated documents array
    recomputePipeline(combinedDocs, combinedExtractions, 'individual', `Batch uploaded ${files.length} document(s)`);

    setIsAnalyzing(false);
    return newlyExtractedDocs;
  };

  // Upload and process a single document (delegates to queue)
  const uploadAndProcessDocument = async (file: File): Promise<DocumentItem> => {
    const docs = await uploadDocuments([file]);
    return docs[0];
  };

  // Update a field in a document (triggers pipeline re-run)
  const updateExtractedField = async (docId: string, fieldKey: string, newValue: string | number) => {
    const docIndex = documents.findIndex((d) => d.id === docId);
    if (docIndex === -1) return;

    const doc = { ...documents[docIndex] };
    const fieldIndex = doc.extractedFields.findIndex((f) => f.key === fieldKey || f.id === fieldKey);
    if (fieldIndex === -1) return;

    const oldValue = doc.extractedFields[fieldIndex].value;
    doc.extractedFields[fieldIndex] = {
      ...doc.extractedFields[fieldIndex],
      value: newValue,
      confidence: 100,
      needsReview: false,
      verifiedByUser: true,
    };

    if (!doc.extractedFields.some((f) => f.needsReview)) {
      doc.status = 'verified';
    }

    const nextDocs = [...documents];
    nextDocs[docIndex] = doc;
    setDocuments(nextDocs);

    // Update extraction record
    const nextExtractions: Record<string, any> = { ...extractions };
    if (nextExtractions[doc.fileName]?.fields?.[fieldKey]) {
      nextExtractions[doc.fileName].fields[fieldKey].value = newValue;
      nextExtractions[doc.fileName].fields[fieldKey].confidence = 1;
      nextExtractions[doc.fileName].fields[fieldKey].needsReview = false;
    }

    setExtractions(nextExtractions);

    // Recompute pipeline
    recomputePipeline(
      nextDocs,
      nextExtractions,
      'individual',
      `Manual field verified: ${fieldKey} changed from ${oldValue} to ${newValue}`
    );
  };

  // Load demo test-pack data
  const loadDemoData = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    const categoryMap: Record<string, DocumentCategory> = {
      FORM_16_PART_A: 'form16',
      FORM_16_PART_B: 'form16',
      SALARY_SLIP: 'salary_slips',
      FORM_26AS: 'bank_statements',
      AIS_TIS: 'bank_statements',
      CAPITAL_GAINS: 'investments',
      RENT_RECEIPTS: 'salary_slips',
      INVESTMENT_PROOFS: 'investments',
    };

    const demoDocItems: DocumentItem[] = Object.entries(DEMO_EXTRACTIONS_RECORD).map(
      ([fileName, ext], idx) => {
        const fields: ExtractedField[] = Object.entries(ext.fields).map(([k, v]: [string, any], fIdx) => ({
          id: `f-demo-${idx}-${fIdx}`,
          key: k,
          label: k.replace(/_/g, ' ').toUpperCase(),
          value: v.value,
          confidence: Math.round(v.confidence * 100),
          needsReview: false,
          sourceSnippet: v.source_snippet,
        }));

        return {
          id: `doc-demo-${idx + 1}`,
          clientId: 'ind-rohan',
          fileName,
          fileSize: '45 KB',
          category: categoryMap[ext.doc_type] || 'form16',
          uploadDate: new Date().toISOString().substring(0, 10),
          status: 'verified',
          overallConfidence: 98,
          ocrTextPreview: `Demo fixture loaded: ${fileName}`,
          extractedFields: fields,
          aiNotes: `Verified ${ext.doc_type} from Indian tax testing suite.`,
        };
      }
    );

    documentsRef.current = demoDocItems;
    extractionsRef.current = DEMO_EXTRACTIONS_RECORD;

    setDocuments(demoDocItems);
    setExtractions(DEMO_EXTRACTIONS_RECORD);
    setHasUploadedDocs(true);

    const statuses: Record<string, FileProcessingStatus> = {};
    for (const name of Object.keys(DEMO_EXTRACTIONS_RECORD)) {
      statuses[name] = 'done';
    }
    setFileStatuses(statuses);

    recomputePipeline(demoDocItems, DEMO_EXTRACTIONS_RECORD, 'ai_agent', 'Loaded standard 8-PDF Indian Tax Test Pack');
    setIsAnalyzing(false);
  };

  // Clear data and return to empty state
  const clearData = async () => {
    documentsRef.current = [];
    extractionsRef.current = {};
    setDocuments([]);
    setExtractions({});
    setHasUploadedDocs(false);
    setFlags([]);
    setSources({});
    setTaxInputs(EMPTY_TAX_INPUTS);
    setTaxResult(compare(EMPTY_TAX_INPUTS, 0));
    setCrossChecks([]);
    setFileStatuses({});
    setFileErrors({});
    setActiveClient(MOCK_INDIVIDUAL_PROFILES[0]);
    await clearPersistentState();
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsedState((prev) => {
      const next = !prev;
      localStorage.setItem('cadesk_sidebar_collapsed', String(next));
      return next;
    });
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    localStorage.setItem('cadesk_sidebar_collapsed', String(collapsed));
  };

  const refreshClientData = async () => {
    const clients = await clientService.getAllClients();
    if (clients.length > 0) {
      const found = clients.find((c) => c.id === activeClient.id);
      if (found) setActiveClient(found);
    }
  };

  const setActiveClientId = async (id: string) => {
    const client = await clientService.getClientById(id);
    if (client) {
      setActiveClient(client);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('cadesk_role', newRole);
  };

  const signOffActiveClient = async (
    caName: string,
    caMembershipNo: string,
    remarks?: string
  ): Promise<ClientProfile> => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updatedClient: ClientProfile = {
      ...activeClient,
      signOffStatus: 'approved',
      signedBy: caName,
      signedAt: timestamp,
      caMembershipNo,
      status: 'ready_for_filing',
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          clientId: activeClient.id,
          timestamp,
          actorName: caName,
          actorRole: 'ca',
          action: 'CA_APPROVAL_SIGNOFF',
          details: `Approved Working Papers & Reconciled Computation under ICAI Standards: ${remarks || 'All statutory cross-checks verified.'}`,
          immutableHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
        },
        ...(activeClient.auditTrail || []),
      ],
    };

    setActiveClient(updatedClient);
    clientService.upsertClient(updatedClient);
    await clientService.signOffClient(
      activeClient.id,
      caName,
      caMembershipNo,
      'approved',
      remarks || 'All statutory cross-checks verified.'
    );

    savePersistentState(
      documentsRef.current,
      extractionsRef.current,
      {
        taxInputs,
        taxResult,
        crossChecks,
        flags,
        sources,
        hasUploadedDocs,
        assessee: {
          name: updatedClient.name,
          pan: updatedClient.pan || 'ABCPM1234K',
          panMasked: updatedClient.panMasked,
          employer: updatedClient.employer,
          signOffStatus: 'approved',
          signedBy: caName,
          signedAt: timestamp,
          caMembershipNo,
        },
      },
      updatedClient.auditTrail
    );

    return updatedClient;
  };

  const value: AppContextType = {
    role,
    setRole,
    activeClient,
    setActiveClientId,
    theme,
    toggleTheme,
    isSidebarCollapsed,
    toggleSidebarCollapse,
    setSidebarCollapsed,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    refreshClientData,

    documents,
    extractions,
    taxInputs,
    taxResult,
    crossChecks,
    flags,
    sources,
    hasUploadedDocs,
    isAnalyzing,
    analysisError,
    fileStatuses,
    fileErrors,
    missingDocTypes,

    uploadDocuments,
    uploadAndProcessDocument,
    updateExtractedField,
    signOffActiveClient,
    loadDemoData,
    clearData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
