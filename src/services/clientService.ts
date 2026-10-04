/**
 * Client Service Layer (Async API Interface)
 * Reads and persists in-memory/localStorage state for clients, sign-offs, and working papers.
 */

import { ClientProfile, AuditLogEntry, WorkingPaperNote, UserRole } from '../types';
import { MOCK_CA_CLIENTS } from '../data/mockClients';
import { computeTaxComparison, TaxInputs } from '../lib/taxEngine';

const STORAGE_KEY = 'cadesk_clients_data_v1';

class ClientService {
  private clients: ClientProfile[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.clients = JSON.parse(stored);
      } else {
        this.clients = [...MOCK_CA_CLIENTS];
        this.save();
      }
    } catch {
      this.clients = [...MOCK_CA_CLIENTS];
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.clients));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  public async getAllClients(): Promise<ClientProfile[]> {
    await new Promise((r) => setTimeout(r, 40));
    return [...this.clients];
  }

  public async getClientById(id: string): Promise<ClientProfile | undefined> {
    await new Promise((r) => setTimeout(r, 30));
    return this.clients.find((c) => c.id === id);
  }

  public async updateClientTaxInputs(id: string, inputs: TaxInputs, actorName: string, actorRole: UserRole): Promise<ClientProfile> {
    await new Promise((r) => setTimeout(r, 60));
    const idx = this.clients.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Client not found');

    const result = computeTaxComparison(inputs);
    const client = this.clients[idx];

    const auditEntry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      clientId: id,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorName,
      actorRole,
      action: 'UPDATE_TAX_INPUTS',
      details: `Updated tax inputs for FY ${inputs.financialYear || '2025-26'}. Gross: ₹${inputs.grossSalary.toLocaleString('en-IN')}`,
      immutableHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
    };

    client.taxInputs = inputs;
    client.taxResult = result;
    client.estimatedSavings = result.taxDifference;
    client.lastUpdated = 'Just now';
    client.auditTrail.unshift(auditEntry);

    this.clients[idx] = client;
    this.save();
    return { ...client };
  }

  public async signOffClient(
    id: string,
    caName: string,
    caMembershipNo: string,
    status: 'approved' | 'changes_requested',
    notes: string
  ): Promise<ClientProfile> {
    await new Promise((r) => setTimeout(r, 80));
    const idx = this.clients.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Client not found');

    const client = this.clients[idx];
    client.signOffStatus = status;
    client.signedBy = caName;
    client.signedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    client.caMembershipNo = caMembershipNo;
    client.status = status === 'approved' ? 'ready_for_filing' : 'action_required';

    if (notes) {
      client.workingPaperNotes.unshift({
        id: `wp-${Date.now()}`,
        author: caName,
        authorRole: 'Chartered Accountant',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        text: notes,
        isPrivateToCA: false,
      });
    }

    client.auditTrail.unshift({
      id: `aud-${Date.now()}`,
      clientId: id,
      timestamp: client.signedAt,
      actorName: caName,
      actorRole: 'ca',
      action: status === 'approved' ? 'CA_APPROVAL_SIGNOFF' : 'CA_CHANGES_REQUESTED',
      details: `${status === 'approved' ? 'Approved Working Papers and Tax Computation' : 'Requested Client Adjustments'}: ${notes}`,
      immutableHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
    });

    this.clients[idx] = client;
    this.save();
    return { ...client };
  }

  public async addWorkingPaperNote(id: string, note: Omit<WorkingPaperNote, 'id' | 'timestamp'>): Promise<ClientProfile> {
    const idx = this.clients.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Client not found');

    const newNote: WorkingPaperNote = {
      ...note,
      id: `wp-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    this.clients[idx].workingPaperNotes.unshift(newNote);
    this.save();
    return { ...this.clients[idx] };
  }
}

export const clientService = new ClientService();
