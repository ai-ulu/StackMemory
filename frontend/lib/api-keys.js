/**
 * AI-ULU API Key Management System
 * 
 * Features:
 * - Per-client API keys (CLI, Slack, Discord, Extension, etc.)
 * - Scoped permissions (read, write, admin)
 * - Rate limiting per key
 * - Key rotation and revocation
 * - Audit logging
 * 
 * Key Format: ulu_[scope]_[random32chars]
 * Examples:
 *   ulu_full_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 *   ulu_read_x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4
 */

import crypto from 'crypto';

// =============================================================================
// Key Scopes & Permissions
// =============================================================================

export const KEY_SCOPES = {
  // Read-only access
  read: {
    name: 'Read Only',
    description: 'Can search and query memories, but cannot create or modify',
    permissions: ['memory:read', 'search', 'query'],
    icon: '👁️',
  },
  
  // Read + Write access
  write: {
    name: 'Read & Write',
    description: 'Can create, read, and update memories',
    permissions: ['memory:read', 'memory:write', 'search', 'query', 'orchestrate'],
    icon: '✏️',
  },
  
  // Full access (default for most clients)
  full: {
    name: 'Full Access',
    description: 'Complete access to all features including deletion',
    permissions: ['memory:read', 'memory:write', 'memory:delete', 'search', 'query', 'orchestrate', 'export'],
    icon: '🔓',
  },
  
  // Admin access (for dashboard/settings)
  admin: {
    name: 'Admin',
    description: 'Full access plus key management and user settings',
    permissions: ['*'], // All permissions
    icon: '👑',
  },
};

// Client types for key categorization
export const CLIENT_TYPES = {
  cli: { name: 'CLI Tool', icon: '🖥️', defaultScope: 'full' },
  extension: { name: 'Browser Extension', icon: '🌐', defaultScope: 'full' },
  slack: { name: 'Slack Bot', icon: '💬', defaultScope: 'write' },
  discord: { name: 'Discord Bot', icon: '🎮', defaultScope: 'write' },
  telegram: { name: 'Telegram Bot', icon: '📱', defaultScope: 'write' },
  langchain: { name: 'LangChain/Agent', icon: '🦜', defaultScope: 'full' },
  chatgpt: { name: 'ChatGPT Action', icon: '🤖', defaultScope: 'write' },
  api: { name: 'Custom API', icon: '🔌', defaultScope: 'read' },
  webhook: { name: 'Webhook', icon: '🪝', defaultScope: 'write' },
  other: { name: 'Other', icon: '📦', defaultScope: 'read' },
};

// Rate limits per scope (requests per minute)
export const RATE_LIMITS = {
  read: { rpm: 60, daily: 1000 },
  write: { rpm: 30, daily: 500 },
  full: { rpm: 100, daily: 5000 },
  admin: { rpm: 200, daily: 10000 },
};

// =============================================================================
// Key Generation & Validation
// =============================================================================

/**
 * Generate a new API key
 * Format: ulu_[scope]_[32 random chars]
 */
export function generateApiKey(scope = 'full') {
  const randomPart = crypto.randomBytes(24).toString('base64url');
  return `ulu_${scope}_${randomPart}`;
}

/**
 * Parse an API key to extract scope
 */
export function parseApiKey(key) {
  if (!key || typeof key !== 'string') {
    return null;
  }
  
  const match = key.match(/^ulu_([a-z]+)_([A-Za-z0-9_-]+)$/);
  if (!match) {
    return null;
  }
  
  const [, scope, token] = match;
  
  if (!KEY_SCOPES[scope]) {
    return null;
  }
  
  return {
    scope,
    token,
    permissions: KEY_SCOPES[scope].permissions,
  };
}

/**
 * Check if a key has a specific permission
 */
export function hasPermission(key, permission) {
  const parsed = parseApiKey(key);
  if (!parsed) return false;
  
  const { permissions } = parsed;
  
  // Admin has all permissions
  if (permissions.includes('*')) return true;
  
  return permissions.includes(permission);
}

/**
 * Hash API key for storage (never store plain keys)
 */
export function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Generate key prefix for display (first 12 chars)
 */
export function getKeyPrefix(key) {
  return key.substring(0, 16) + '...';
}

// =============================================================================
// Database Operations (Supabase)
// =============================================================================

/**
 * Create a new API key in the database
 */
export async function createApiKey(supabase, userId, options = {}) {
  const {
    name = 'Unnamed Key',
    scope = 'full',
    clientType = 'api',
    expiresAt = null,
    metadata = {},
  } = options;

  // Generate the key
  const plainKey = generateApiKey(scope);
  const keyHash = hashApiKey(plainKey);
  const keyPrefix = getKeyPrefix(plainKey);

  // Insert into database
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      scope,
      client_type: clientType,
      expires_at: expiresAt,
      metadata,
      last_used_at: null,
      usage_count: 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create API key: ${error.message}`);
  }

  // Return the plain key (only time it's visible)
  return {
    ...data,
    key: plainKey, // Only returned on creation!
  };
}

/**
 * Validate an API key and return its details
 */
export async function validateApiKey(supabase, plainKey) {
  const parsed = parseApiKey(plainKey);
  if (!parsed) {
    return { valid: false, error: 'Invalid key format' };
  }

  const keyHash = hashApiKey(plainKey);

  // Find the key
  const { data: keyData, error } = await supabase
    .from('api_keys')
    .select('*, profiles(id, email, plan)')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (error || !keyData) {
    return { valid: false, error: 'Key not found or inactive' };
  }

  // Check expiration
  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    return { valid: false, error: 'Key expired' };
  }

  // Update last used
  await supabase
    .from('api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      usage_count: (keyData.usage_count || 0) + 1,
    })
    .eq('id', keyData.id);

  return {
    valid: true,
    key: keyData,
    user: keyData.profiles,
    scope: parsed.scope,
    permissions: parsed.permissions,
  };
}

/**
 * List all API keys for a user
 */
export async function listApiKeys(supabase, userId) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list API keys: ${error.message}`);
  }

  return data || [];
}

/**
 * Revoke (deactivate) an API key
 */
export async function revokeApiKey(supabase, userId, keyId) {
  const { data, error } = await supabase
    .from('api_keys')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
    })
    .eq('id', keyId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to revoke API key: ${error.message}`);
  }

  return data;
}

/**
 * Delete an API key permanently
 */
export async function deleteApiKey(supabase, userId, keyId) {
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete API key: ${error.message}`);
  }

  return true;
}

/**
 * Log API key usage for audit
 */
export async function logKeyUsage(supabase, keyId, action, metadata = {}) {
  await supabase.from('api_key_logs').insert({
    key_id: keyId,
    action,
    metadata,
    ip_address: metadata.ip || null,
    user_agent: metadata.userAgent || null,
  });
}

// =============================================================================
// Rate Limiting
// =============================================================================

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map();

/**
 * Check rate limit for a key
 */
export function checkRateLimit(keyHash, scope) {
  const limits = RATE_LIMITS[scope] || RATE_LIMITS.read;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  const key = `${keyHash}:${Math.floor(now / windowMs)}`;
  const current = rateLimitStore.get(key) || 0;
  
  if (current >= limits.rpm) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Math.ceil(now / windowMs) * windowMs),
    };
  }
  
  rateLimitStore.set(key, current + 1);
  
  // Clean old entries periodically
  if (rateLimitStore.size > 10000) {
    const cutoff = Math.floor(now / windowMs) - 1;
    for (const [k] of rateLimitStore) {
      const [, timestamp] = k.split(':');
      if (parseInt(timestamp) < cutoff) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  return {
    allowed: true,
    remaining: limits.rpm - current - 1,
    resetAt: new Date(Math.ceil(now / windowMs) * windowMs),
  };
}

// =============================================================================
// Exports
// =============================================================================

export default {
  KEY_SCOPES,
  CLIENT_TYPES,
  RATE_LIMITS,
  generateApiKey,
  parseApiKey,
  hasPermission,
  hashApiKey,
  getKeyPrefix,
  createApiKey,
  validateApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey,
  logKeyUsage,
  checkRateLimit,
};
