/**
 * CAdesk Universal Domain Types
 */

import { TaxInputs, TaxComparisonResult } from '../lib/taxEngine';

export type UserRole = 'individual' | 'ca' | 'ca_staff';

export type IncomeType = 'salaried' | 'freelancer' | 'business_owner';

export type DocumentCategory =
  | 'form16'
  | 'salary_slips'
  | 'bank_statements'
  | 'investments'
  | 'insurance'
  | 'loans';

export type DocumentPipelineStatus =
  | 'uploaded'
  | 'ocr'
  | 'classified'
  | 'extracted'
  | 'needs_review'
  | 'verified';

export interface ExtractedField {
  id: string;
  key: string;
  label: string;
  value: string | number;
  confidence: number; // 0 to 100
  needsReview: boolean;
  sectionReference?: string;
  sourceSnippet?: string;
  verifiedByUser?: boolean;
  isSample?: boolean;
}

export interface DocumentItem {
  id: string;
  clientId: string;
  fileName: string;
  fileSize: string;
  category: DocumentCategory;
  uploadDate: string;
  status: DocumentPipelineStatus;
  overallConfidence: number; // 0 to 100
  extractedFields: ExtractedField[];
  aiNotes?: string;
  ocrTextPreview?: string;
}

export type ClientStatus =
  | 'draft'
  | 'in_review'
  | 'action_required'
  | 'ready_for_filing'
  | 'filed';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface AuditLogEntry {
  id: string;
  clientId: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole | 'ai_agent';
  action: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  immutableHash: string;
}

export interface WorkingPaperNote {
  id: string;
  author: string;
  authorRole: string;
  timestamp: string;
  text: string;
  isPrivateToCA: boolean;
}

export interface ClientProfile {
  id: string;
  name: string;
  panMasked: string;
  email: string;
  phone: string;
  incomeType: IncomeType;
  financialYear: string;
  status: ClientStatus;
  riskFlag: RiskLevel;
  assignedStaff: string;
  estimatedSavings: number;
  taxInputs: TaxInputs;
  taxResult?: TaxComparisonResult;
  documentsCount: number;
  lastUpdated: string;
  netWorthEstimate?: number;
  regimePreference?: 'old' | 'new' | 'undecided';
  signOffStatus: 'pending' | 'approved' | 'changes_requested';
  signedBy?: string;
  signedAt?: string;
  caMembershipNo?: string;
  auditTrail: AuditLogEntry[];
  workingPaperNotes: WorkingPaperNote[];
}

export interface AgentStepTrace {
  step: string;
  agentName: string;
  status: 'running' | 'completed' | 'flagged';
  durationMs: number;
  confidence: number;
  description: string;
}

export interface AgentCitation {
  section: string;
  act: string;
  rulesAsOf: string;
  urlOrRef?: string;
}

export interface AgentStructuredResponse {
  answer: string;
  agentName: string;
  confidence: number; // 0 - 100
  requiresHumanReview: boolean;
  citations: AgentCitation[];
  stepTraces: AgentStepTrace[];
  taxEnginePayload?: TaxComparisonResult;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  agentName?: string;
  text: string;
  timestamp: string;
  structuredResponse?: AgentStructuredResponse;
  flaggedForCA?: boolean;
}

export interface FinancialGoal {
  id: string;
  title: string;
  category: 'retirement' | 'child_education' | 'house' | 'emergency_fund';
  targetAmount: number;
  currentAmount: number;
  targetYear: number;
  monthlySavingsRequired: number;
  suggestedInstruments: {
    name: string;
    type: string;
    taxAdvantage: string;
    allocationPercent: number;
  }[];
}

export interface ComplianceDeadline {
  id: string;
  title: string;
  category: 'advance_tax' | 'itr' | '80c_cutoff' | 'gst';
  dueDate: string;
  priority: 'urgent' | 'high' | 'normal';
  description: string;
  applicableTo: string;
  penaltyNote: string;
  isCompleted?: boolean;
  snoozedUntil?: string;
}

export interface DocumentChecklistItem {
  id: string;
  title: string;
  category: DocumentCategory;
  required: boolean;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  dueDate: string;
  notes?: string;
}
