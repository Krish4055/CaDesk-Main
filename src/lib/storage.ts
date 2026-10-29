/**
 * CAdesk IndexedDB Persistence Layer
 * Uses 'idb' to persist documents, extractions, tax state, and audit logs.
 * Includes schema versioning (v2) to purge stale mock data and prevent corruption.
 * Fallbacks safely to localStorage in non-browser / test environments.
 */

import { openDB, IDBPDatabase } from 'idb';
import { DocumentItem, AuditLogEntry } from '../types';
import { TaxInputs, TaxComparisonResult } from './taxEngine';
import { CrossCheckItem } from './crossChecks';
import { TaxFlag } from './mapper';

const DB_NAME = 'cadesk_persistent_db';
const DB_VERSION = 2;
export const CURRENT_SCHEMA_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

function getDb(): Promise<IDBPDatabase<any>> | null {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        // Clear old stores on version upgrade
        if (oldVersion < 2) {
          if (db.objectStoreNames.contains('documents')) db.deleteObjectStore('documents');
          if (db.objectStoreNames.contains('extractions')) db.deleteObjectStore('extractions');
          if (db.objectStoreNames.contains('tax_state')) db.deleteObjectStore('tax_state');
          if (db.objectStoreNames.contains('audit_log')) db.deleteObjectStore('audit_log');
        }
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('extractions')) {
          db.createObjectStore('extractions', { keyPath: 'fileName' });
        }
        if (!db.objectStoreNames.contains('tax_state')) {
          db.createObjectStore('tax_state', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('audit_log')) {
          db.createObjectStore('audit_log', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export interface StoredTaxState {
  schemaVersion: number;
  taxInputs: TaxInputs;
  taxResult: TaxComparisonResult;
  crossChecks: CrossCheckItem[];
  flags: TaxFlag[];
  sources: Record<string, any>;
  hasUploadedDocs: boolean;
  extractions?: Record<string, any>;
  assessee?: {
    name: string;
    pan: string;
    panMasked: string;
    employer?: string;
    assessmentYear?: string;
    financialYear?: string;
    signOffStatus?: 'pending' | 'approved' | 'changes_requested';
    signedBy?: string;
    signedAt?: string;
    caMembershipNo?: string;
  };
}

export async function savePersistentState(
  docs: DocumentItem[],
  extractions: Record<string, any>,
  taxState: Omit<StoredTaxState, 'schemaVersion'>,
  auditLog: AuditLogEntry[]
): Promise<void> {
  const stateToStore: StoredTaxState = {
    ...taxState,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    extractions,
  };

  try {
    const db = await getDb();
    if (db) {
      const tx = db.transaction(['documents', 'tax_state', 'extractions', 'audit_log'], 'readwrite');
      await tx.objectStore('documents').clear();
      for (const doc of docs) {
        await tx.objectStore('documents').put(doc);
      }

      await tx.objectStore('extractions').clear();
      for (const [fileName, ext] of Object.entries(extractions)) {
        await tx.objectStore('extractions').put({ fileName, data: ext });
      }

      await tx.objectStore('tax_state').put({ key: 'current', ...stateToStore });

      await tx.objectStore('audit_log').clear();
      for (const log of auditLog) {
        await tx.objectStore('audit_log').put(log);
      }
      await tx.done;
    }
  } catch (err) {
    console.warn('IndexedDB write warning:', err);
  }

  // Backup in localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cadesk_tax_state_v2', JSON.stringify(stateToStore));
      localStorage.setItem('cadesk_docs_v2', JSON.stringify(docs));
    }
  } catch {
    // Ignore quota issues
  }
}

export async function clearPersistentState(): Promise<void> {
  try {
    const db = await getDb();
    if (db) {
      const tx = db.transaction(['documents', 'tax_state', 'extractions', 'audit_log'], 'readwrite');
      await tx.objectStore('documents').clear();
      await tx.objectStore('tax_state').clear();
      await tx.objectStore('extractions').clear();
      await tx.objectStore('audit_log').clear();
      await tx.done;
    }
  } catch (err) {
    console.warn('IndexedDB clear warning:', err);
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('cadesk_tax_state');
      localStorage.removeItem('cadesk_docs');
      localStorage.removeItem('cadesk_tax_state_v2');
      localStorage.removeItem('cadesk_docs_v2');
      localStorage.removeItem('cadesk_documents');
    }
  } catch {
    // ignore
  }
}

export async function loadPersistentState(): Promise<{
  docs: DocumentItem[];
  extractions: Record<string, any>;
  taxState: StoredTaxState | null;
  auditLog: AuditLogEntry[];
}> {
  try {
    const db = await getDb();
    if (db) {
      const taxStateRecord = (await db.get('tax_state', 'current')) as StoredTaxState | undefined;
      // Schema validation
      if (taxStateRecord && taxStateRecord.schemaVersion === CURRENT_SCHEMA_VERSION) {
        const docs = await db.getAll('documents');
        const extList = await db.getAll('extractions');
        const auditLog = await db.getAll('audit_log');

        const extractionsMap: Record<string, any> = {};
        for (const item of extList) {
          if (item.fileName && item.data) {
            extractionsMap[item.fileName] = item.data;
          }
        }

        return {
          docs: docs || [],
          extractions: extractionsMap,
          taxState: taxStateRecord,
          auditLog: auditLog || [],
        };
      } else if (taxStateRecord && taxStateRecord.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        console.warn('Storage schema version mismatch. Clearing stale data.');
        await clearPersistentState();
        return { docs: [], extractions: {}, taxState: null, auditLog: [] };
      }
    }
  } catch (err) {
    console.warn('IndexedDB read warning:', err);
  }

  // Fallback to localStorage v2
  try {
    if (typeof localStorage !== 'undefined') {
      const storedDocs = localStorage.getItem('cadesk_docs_v2');
      const storedState = localStorage.getItem('cadesk_tax_state_v2');
      if (storedDocs && storedState) {
        const parsedState = JSON.parse(storedState) as StoredTaxState;
        if (parsedState.schemaVersion === CURRENT_SCHEMA_VERSION) {
          return {
            docs: JSON.parse(storedDocs),
            extractions: parsedState.extractions || {},
            taxState: parsedState,
            auditLog: [],
          };
        } else {
          await clearPersistentState();
        }
      }
    }
  } catch {
    // fallback
  }

  return { docs: [], extractions: {}, taxState: null, auditLog: [] };
}
