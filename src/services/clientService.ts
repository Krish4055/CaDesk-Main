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

  public upsertClient(client: ClientProfile): ClientProfile {
    const idx = this.clients.findIndex((c) => c.id === client.id);
    if (idx >= 0) {
      this.clients[idx] = { ...this.clients[idx], ...client };
    } else {
      this.clients.unshift({ ...client });
    }
    this.save();
    return idx >= 0 ? this.clients[idx] : this.clients[0];
  }

  public async getAllClients(): Promise<ClientProfile[]> {
    await new Promise((r) => setTimeout(r, 40));
    return [...this.clients];
  }

  public async getClientById(id: string): Promise<ClientProfile | undefined> {
    await new Promise((r) => setTimeout(r, 30));
    let found = this.clients.find((c) => c.id === id);
    if (!found && (id === 'ind-rohan' || id.includes('rohan'))) {
      const rohanProfile: ClientProfile = {
        id: 'ind-rohan',
        name: 'Rohan Mehta',
        pan: 'ABCPM1234K',
        panMasked: 'ABCPM*****K',
        email: 'rohan.mehta@techcorp.in',
        phone: '+91 98201 44552',
        incomeType: 'salaried',
        financialYear: '2025-26',
        status: 'in_review',
        riskFlag: 'low',
        assignedStaff: 'CA Ramesh Sharma (Partner)',
        estimatedSavings: 23556,
        taxInputs: {
          grossSalary: 1800000,
          basicSalary: 720000,
          hraReceived: 360000,
          rentPaidAnnual: 360000,
          isMetro: true,
          section80C: 150000,
          section80D: 22000,
          section80CCD1B: 50000,
          section80CCD2: 72000,
          employerNps: 72000,
          otherIncome: 85000,
          shortTermCapitalGains: 60000,
          longTermCapitalGains: 210000,
        },
        taxResult: computeTaxComparison({
          grossSalary: 1800000,
          basicSalary: 720000,
          hraReceived: 360000,
          rentPaidAnnual: 360000,
          isMetro: true,
          section80C: 150000,
          section80D: 22000,
          section80CCD1B: 50000,
          section80CCD2: 72000,
          employerNps: 72000,
          otherIncome: 85000,
          shortTermCapitalGains: 60000,
          longTermCapitalGains: 210000,
        }),
        documentsCount: 8,
        lastUpdated: 'Just now',
        netWorthEstimate: 12500000,
        regimePreference: 'new',
        signOffStatus: 'pending',
        auditTrail: [],
        workingPaperNotes: [],
      };
      this.clients.unshift(rohanProfile);
      this.save();
      return rohanProfile;
    }
    return found;
  }

  public async updateClientTaxInputs(id: string, inputs: TaxInputs, actorName: string, actorRole: UserRole): Promise<ClientProfile> {
    await new Promise((r) => setTimeout(r, 60));
    let idx = this.clients.findIndex((c) => c.id === id);
    if (idx === -1) {
      await this.getClientById(id);
      idx = this.clients.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Client not found');
    }

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
    let idx = this.clients.findIndex((c) => c.id === id);
    if (idx === -1) {
      await this.getClientById(id);
      idx = this.clients.findIndex((c) => c.id === id);
      if (idx === -1) {
        const fallbackClient: ClientProfile = {
          id,
          name: id === 'ind-rohan' ? 'Rohan Mehta' : 'Assessee',
          panMasked: 'ABCPM*****K',
          email: 'assessee@cadesk.internal',
          phone: '+91 98201 00000',
          incomeType: 'salaried',
          financialYear: '2025-26',
          status: status === 'approved' ? 'ready_for_filing' : 'action_required',
          riskFlag: 'low',
          assignedStaff: caName,
          estimatedSavings: 23556,
          taxInputs: {
            grossSalary: 1800000,
            basicSalary: 720000,
            hraReceived: 360000,
            rentPaidAnnual: 360000,
            isMetro: true,
          },
          taxResult: computeTaxComparison({
            grossSalary: 1800000,
            basicSalary: 720000,
            hraReceived: 360000,
            rentPaidAnnual: 360000,
            isMetro: true,
          }),
          documentsCount: 8,
          lastUpdated: 'Just now',
          netWorthEstimate: 10000000,
          regimePreference: 'new',
          signOffStatus: status,
          signedBy: caName,
          signedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          caMembershipNo,
          auditTrail: [],
          workingPaperNotes: [],
        };
        this.clients.unshift(fallbackClient);
        idx = 0;
      }
    }

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
    let idx = this.clients.findIndex((c) => c.id === id);
    if (idx === -1) {
      await this.getClientById(id);
      idx = this.clients.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Client not found');
    }

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
