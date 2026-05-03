/**
 * AI-ULU Sync Engine
 * 
 * Bidirectional sync between PostgreSQL (Supabase) and SQLite (Local IndexedDB)
 * Implements Offline-First architecture from Blueprint v2.0
 * 
 * Key Features:
 * - Conflict resolution with "last-write-wins" or "merge" strategies
 * - Delta sync (only changed records)
 * - Background sync with retry
 * - Bandwidth optimization
 */

import { LocalMemory, getLocalMemories, storeLocalMemory, deleteLocalMemory, saveLocalSettings, getLocalSettings } from './local-store';

// Sync status types
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

// Sync event types
export type SyncEvent = 
  | { type: 'sync_started' }
  | { type: 'sync_completed'; synced: number; conflicts: number }
  | { type: 'sync_error'; error: string }
  | { type: 'conflict_detected'; localMemory: LocalMemory; remoteMemory: any };

// Sync options
export interface SyncOptions {
  strategy: 'last-write-wins' | 'local-priority' | 'remote-priority' | 'manual';
  syncInterval: number; // ms
  retryAttempts: number;
  retryDelay: number; // ms
}

const DEFAULT_OPTIONS: SyncOptions = {
  strategy: 'last-write-wins',
  syncInterval: 60000, // 1 minute
  retryAttempts: 3,
  retryDelay: 5000,
};

// Sync state
let syncStatus: SyncStatus = 'idle';
let lastSyncTime: Date | null = null;
let syncInterval: NodeJS.Timeout | null = null;
let syncListeners: ((event: SyncEvent) => void)[] = [];

/**
 * Subscribe to sync events
 */
export function onSyncEvent(listener: (event: SyncEvent) => void): () => void {
  syncListeners.push(listener);
  return () => {
    syncListeners = syncListeners.filter(l => l !== listener);
  };
}

function emitEvent(event: SyncEvent) {
  syncListeners.forEach(listener => listener(event));
}

/**
 * Get current sync status
 */
export function getSyncStatus(): { status: SyncStatus; lastSync: Date | null } {
  return { status: syncStatus, lastSync: lastSyncTime };
}

/**
 * Compare two memories and detect conflicts
 */
function detectConflict(local: LocalMemory, remote: any): boolean {
  // No conflict if content is same
  if (local.content === remote.content) return false;
  
  // Conflict if both modified after last sync
  const localTime = new Date(local.stored_at || local.created_at).getTime();
  const remoteTime = new Date(remote.updated_at || remote.created_at).getTime();
  const lastSync = lastSyncTime?.getTime() || 0;
  
  return localTime > lastSync && remoteTime > lastSync;
}

/**
 * Resolve conflict based on strategy
 */
function resolveConflict(
  local: LocalMemory, 
  remote: any, 
  strategy: SyncOptions['strategy']
): 'use-local' | 'use-remote' | 'merge' | 'manual' {
  switch (strategy) {
    case 'local-priority':
      return 'use-local';
    case 'remote-priority':
      return 'use-remote';
    case 'last-write-wins':
      const localTime = new Date(local.stored_at || local.created_at).getTime();
      const remoteTime = new Date(remote.updated_at || remote.created_at).getTime();
      return localTime > remoteTime ? 'use-local' : 'use-remote';
    case 'manual':
      return 'manual';
    default:
      return 'use-remote';
  }
}

/**
 * Sync local memories to remote (upload)
 */
async function syncToRemote(
  supabase: any, 
  userId: string, 
  options: SyncOptions
): Promise<{ uploaded: number; conflicts: number }> {
  const localMemories = await getLocalMemories(userId);
  const unsyncedMemories = localMemories.filter(m => !m.synced);
  
  let uploaded = 0;
  let conflicts = 0;

  for (const local of unsyncedMemories) {
    try {
      // Check if exists remotely
      const { data: existing } = await supabase
        .from('memories')
        .select('id, user_id, content, embedding, metadata, created_at, updated_at, access_count, last_accessed_at')
        .eq('id', local.id)
        .single();

      if (existing) {
        // Check for conflict
        if (detectConflict(local, existing)) {
          conflicts++;
          const resolution = resolveConflict(local, existing, options.strategy);
          
          if (resolution === 'manual') {
            emitEvent({ type: 'conflict_detected', localMemory: local, remoteMemory: existing });
            continue;
          }
          
          if (resolution === 'use-remote') {
            // Update local with remote
            await storeLocalMemory({ ...existing, synced: true });
            continue;
          }
        }
        
        // Update remote
        await supabase
          .from('memories')
          .update({
            content: local.content,
            type: local.type,
            confidence: local.confidence,
            updated_at: new Date().toISOString(),
          })
          .eq('id', local.id);
      } else {
        // Insert new
        await supabase
          .from('memories')
          .insert({
            id: local.id,
            user_id: userId,
            content: local.content,
            type: local.type,
            confidence: local.confidence || 0.8,
            status: 'active',
            scope: 'private',
            embedding: local.embedding,
          });
      }

      // Mark as synced
      await storeLocalMemory({ ...local, synced: true });
      uploaded++;
    } catch (error) {
      console.error('Sync to remote failed:', error);
    }
  }

  return { uploaded, conflicts };
}

/**
 * Sync remote memories to local (download)
 */
async function syncFromRemote(
  supabase: any, 
  userId: string,
  options: SyncOptions
): Promise<{ downloaded: number; conflicts: number }> {
  // Get memories updated since last sync
  let query = supabase
    .from('memories')
    .select('id, user_id, content, embedding, metadata, created_at, updated_at, access_count, last_accessed_at')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (lastSyncTime) {
    query = query.gte('updated_at', lastSyncTime.toISOString());
  }

  const { data: remoteMemories, error } = await query;
  if (error) throw error;

  let downloaded = 0;
  let conflicts = 0;

  for (const remote of remoteMemories || []) {
    try {
      const local = await getLocalMemoryById(remote.id);

      if (local) {
        // Check for conflict
        if (detectConflict(local, remote)) {
          conflicts++;
          const resolution = resolveConflict(local, remote, options.strategy);
          
          if (resolution === 'manual') {
            emitEvent({ type: 'conflict_detected', localMemory: local, remoteMemory: remote });
            continue;
          }
          
          if (resolution === 'use-local') {
            continue; // Keep local version
          }
        }
      }

      // Store/update locally
      await storeLocalMemory({
        id: remote.id,
        content: remote.content,
        type: remote.type,
        user_id: remote.user_id,
        confidence: remote.confidence,
        created_at: remote.created_at,
        embedding: remote.embedding,
        synced: true,
      });
      downloaded++;
    } catch (error) {
      console.error('Sync from remote failed:', error);
    }
  }

  return { downloaded, conflicts };
}

// Helper to get single local memory
async function getLocalMemoryById(id: string): Promise<LocalMemory | null> {
  const { getLocalMemory } = await import('./local-store');
  return getLocalMemory(id);
}

/**
 * Perform full bidirectional sync
 */
export async function performSync(
  supabase: any, 
  userId: string, 
  options: Partial<SyncOptions> = {}
): Promise<{ success: boolean; uploaded: number; downloaded: number; conflicts: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (syncStatus === 'syncing') {
    return { success: false, uploaded: 0, downloaded: 0, conflicts: 0 };
  }

  syncStatus = 'syncing';
  emitEvent({ type: 'sync_started' });

  try {
    // Check if online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      syncStatus = 'offline';
      return { success: false, uploaded: 0, downloaded: 0, conflicts: 0 };
    }

    // Upload local changes
    const uploadResult = await syncToRemote(supabase, userId, opts);
    
    // Download remote changes
    const downloadResult = await syncFromRemote(supabase, userId, opts);

    // Update last sync time
    lastSyncTime = new Date();
    await saveLocalSettings({ lastSyncAt: lastSyncTime.toISOString() });

    const totalConflicts = uploadResult.conflicts + downloadResult.conflicts;
    
    syncStatus = 'idle';
    emitEvent({ 
      type: 'sync_completed', 
      synced: uploadResult.uploaded + downloadResult.downloaded,
      conflicts: totalConflicts,
    });

    return { 
      success: true, 
      uploaded: uploadResult.uploaded, 
      downloaded: downloadResult.downloaded,
      conflicts: totalConflicts,
    };
  } catch (error) {
    syncStatus = 'error';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    emitEvent({ type: 'sync_error', error: errorMessage });
    return { success: false, uploaded: 0, downloaded: 0, conflicts: 0 };
  }
}

/**
 * Start background sync
 */
export function startBackgroundSync(
  supabase: any, 
  userId: string, 
  options: Partial<SyncOptions> = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Stop existing sync
  stopBackgroundSync();
  
  // Initial sync
  performSync(supabase, userId, opts);
  
  // Schedule periodic sync
  syncInterval = setInterval(() => {
    performSync(supabase, userId, opts);
  }, opts.syncInterval);

  // Listen for online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      performSync(supabase, userId, opts);
    });
  }
}

/**
 * Stop background sync
 */
export function stopBackgroundSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

/**
 * Force sync now (manual trigger)
 */
export async function forceSyncNow(supabase: any, userId: string): Promise<void> {
  await performSync(supabase, userId, { strategy: 'last-write-wins' });
}

/**
 * Get sync statistics
 */
export async function getSyncStats(userId: string): Promise<{
  localCount: number;
  unsyncedCount: number;
  lastSyncTime: string | null;
}> {
  const localMemories = await getLocalMemories(userId);
  const settings = await getLocalSettings();
  
  return {
    localCount: localMemories.length,
    unsyncedCount: localMemories.filter(m => !m.synced).length,
    lastSyncTime: settings.lastSyncAt || null,
  };
}

// ============================================================
// Cross-Device Sync Visibility
// ============================================================

export interface DeviceInfo {
  device_id: string;
  device_name: string;
  device_type: 'mobile' | 'tablet' | 'desktop' | 'browser' | 'cli' | 'unknown';
  platform?: string;
}

/**
 * Generate a stable device fingerprint for this browser/client
 */
export function getDeviceId(): string {
  const key = 'stackmemory_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

/**
 * Detect current device info from browser
 */
export function detectDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  const device_id = getDeviceId();

  let device_type: DeviceInfo['device_type'] = 'browser';
  let platform = 'Web';
  let device_name = 'Browser';

  if (/iPhone|iPad|iPod/.test(ua)) {
    device_type = /iPad/.test(ua) ? 'tablet' : 'mobile';
    platform = 'iOS';
    device_name = /iPad/.test(ua) ? 'iPad' : 'iPhone';
  } else if (/Android/.test(ua)) {
    device_type = /tablet|Tablet/.test(ua) ? 'tablet' : 'mobile';
    platform = 'Android';
    device_name = 'Android Device';
  } else if (/Macintosh/.test(ua)) {
    device_type = 'desktop';
    platform = 'macOS';
    device_name = 'Mac';
  } else if (/Windows/.test(ua)) {
    device_type = 'desktop';
    platform = 'Windows';
    device_name = 'Windows PC';
  } else if (/Linux/.test(ua)) {
    device_type = 'desktop';
    platform = 'Linux';
    device_name = 'Linux PC';
  }

  // Add browser name
  const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
  if (browserMatch) device_name += ;

  return { device_id, device_name, device_type, platform };
}

/**
 * Register or update this device in Supabase
 */
export async function registerDevice(supabase: any, userId: string): Promise<void> {
  const info = detectDeviceInfo();
  await supabase
    .from('user_devices')
    .upsert({
      user_id: userId,
      device_id: info.device_id,
      device_name: info.device_name,
      device_type: info.device_type,
      platform: info.platform,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'user_id,device_id' });
}

/**
 * Log a sync operation
 */
export async function logSyncOperation(
  supabase: any,
  userId: string,
  stats: {
    memories_pushed: number;
    memories_pulled: number;
    conflicts_resolved: number;
    duration_ms: number;
    status: 'success' | 'partial' | 'error';
    error_message?: string;
  }
): Promise<void> {
  const device_id = getDeviceId();
  await supabase.from('sync_log').insert({
    user_id: userId,
    device_id,
    ...stats,
  });
}

/**
 * Get sync summary for all devices
 */
export async function getDeviceSyncSummary(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc('get_device_sync_summary', {
    p_user_id: userId,
  });
  if (error) throw error;
  return data ?? [];
}
