/**
 * AI-ULU Local-First Memory Store
 * 
 * IndexedDB-based local storage for sensitive memories (identity, preference)
 * Implements Zero-Knowledge principle from Blueprint v2.0
 */

import { Memory, MEMORY_TYPES } from './types';

const DB_NAME = 'ai-ulu-local-memories';
const DB_VERSION = 1;
const STORE_NAME = 'memories';
const SETTINGS_STORE = 'settings';

// Check if IndexedDB is available
function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

// Open database connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create memories store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('user_id', 'user_id', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
      }

      // Create settings store
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };
  });
}

// Local memory interface
export interface LocalMemory {
  id: string;
  content: string;
  type: 'identity' | 'preference' | 'fact';
  user_id: string;
  created_at: string;
  embedding?: number[];
  confidence?: number;
  status?: string;
  synced?: boolean;
  encrypted?: boolean;
  stored_at?: string;
  imported_at?: string;
}

/**
 * Store a memory locally (for sensitive types)
 */
export async function storeLocalMemory(memory: LocalMemory): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const memoryWithMeta = {
      ...memory,
      synced: false,
      stored_at: new Date().toISOString(),
    };
    
    const request = store.put(memoryWithMeta);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get all local memories for a user
 */
export async function getLocalMemories(userId: string): Promise<LocalMemory[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('user_id');
    
    const request = index.getAll(userId);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
    
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get local memories by type
 */
export async function getLocalMemoriesByType(
  userId: string, 
  type: string
): Promise<LocalMemory[]> {
  const memories = await getLocalMemories(userId);
  return memories.filter(m => m.type === type);
}

/**
 * Get a single local memory
 */
export async function getLocalMemory(id: string): Promise<LocalMemory | null> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
    
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Delete a local memory
 */
export async function deleteLocalMemory(id: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Clear all local memories for a user
 */
export async function clearLocalMemories(userId: string): Promise<void> {
  const memories = await getLocalMemories(userId);
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    let deleted = 0;
    
    for (const memory of memories) {
      const request = store.delete(memory.id);
      request.onsuccess = () => {
        deleted++;
        if (deleted === memories.length) {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    }
    
    if (memories.length === 0) {
      resolve();
    }
    
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Check if memory should be stored locally based on type
 * Identity and Preference types are sensitive = local storage
 */
export function shouldStoreLocally(type: string): boolean {
  return type === MEMORY_TYPES.IDENTITY || type === MEMORY_TYPES.PREFERENCE;
}

/**
 * Export all local memories (for backup/transfer)
 */
export async function exportLocalMemories(userId: string): Promise<string> {
  const memories = await getLocalMemories(userId);
  
  const exportData = {
    version: 1,
    exported_at: new Date().toISOString(),
    user_id: userId,
    memories: memories.map(m => ({
      ...m,
      embedding: undefined, // Don't export embeddings (too large)
    })),
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import local memories from backup
 */
export async function importLocalMemories(
  jsonData: string, 
  userId: string
): Promise<number> {
  const data = JSON.parse(jsonData);
  
  if (!data.memories || !Array.isArray(data.memories)) {
    throw new Error('Invalid import data format');
  }
  
  let imported = 0;
  
  for (const memory of data.memories) {
    // Ensure user_id matches current user
    await storeLocalMemory({
      ...memory,
      user_id: userId,
      imported_at: new Date().toISOString(),
    });
    imported++;
  }
  
  return imported;
}

// Settings management
export interface LocalSettings {
  localFirstEnabled: boolean;
  encryptionEnabled: boolean;
  syncEnabled: boolean;
  lastSyncAt?: string;
}

const DEFAULT_SETTINGS: LocalSettings = {
  localFirstEnabled: false,
  encryptionEnabled: false,
  syncEnabled: true,
};

/**
 * Get local settings
 */
export async function getLocalSettings(): Promise<LocalSettings> {
  if (!isIndexedDBAvailable()) {
    return DEFAULT_SETTINGS;
  }
  
  try {
    const db = await openDB();
    
    return new Promise((resolve) => {
      const transaction = db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      
      const request = store.get('local-first-settings');
      
      request.onerror = () => resolve(DEFAULT_SETTINGS);
      request.onsuccess = () => {
        resolve(request.result?.value || DEFAULT_SETTINGS);
      };
      
      transaction.oncomplete = () => db.close();
    });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save local settings
 */
export async function saveLocalSettings(settings: Partial<LocalSettings>): Promise<void> {
  const db = await openDB();
  const current = await getLocalSettings();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SETTINGS_STORE], 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE);
    
    const request = store.put({
      key: 'local-first-settings',
      value: { ...current, ...settings },
    });
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get local storage stats
 */
export async function getLocalStorageStats(userId: string): Promise<{
  totalMemories: number;
  byType: Record<string, number>;
  totalSizeKB: number;
}> {
  const memories = await getLocalMemories(userId);
  
  const byType: Record<string, number> = {};
  let totalSize = 0;
  
  for (const memory of memories) {
    byType[memory.type] = (byType[memory.type] || 0) + 1;
    totalSize += JSON.stringify(memory).length;
  }
  
  return {
    totalMemories: memories.length,
    byType,
    totalSizeKB: Math.round(totalSize / 1024),
  };
}
