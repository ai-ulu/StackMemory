/**
 * API Key System Tests
 */

import { describe, it, expect } from 'vitest';
import { 
  generateApiKey, 
  parseApiKey, 
  hasPermission, 
  hashApiKey, 
  getKeyPrefix,
  KEY_SCOPES,
  RATE_LIMITS,
} from '../lib/api-keys.js';

describe('API Key System', () => {
  describe('Key Generation', () => {
    it('should generate key with correct format', () => {
      const key = generateApiKey('full');
      expect(key).toMatch(/^ulu_full_[A-Za-z0-9_-]+$/);
    });

    it('should generate different keys each time', () => {
      const key1 = generateApiKey('read');
      const key2 = generateApiKey('read');
      expect(key1).not.toBe(key2);
    });

    it('should generate keys with different scopes', () => {
      const readKey = generateApiKey('read');
      const writeKey = generateApiKey('write');
      const fullKey = generateApiKey('full');
      const adminKey = generateApiKey('admin');
      
      expect(readKey).toContain('ulu_read_');
      expect(writeKey).toContain('ulu_write_');
      expect(fullKey).toContain('ulu_full_');
      expect(adminKey).toContain('ulu_admin_');
    });
  });

  describe('Key Parsing', () => {
    it('should parse valid key', () => {
      const key = generateApiKey('full');
      const parsed = parseApiKey(key);
      
      expect(parsed).not.toBeNull();
      expect(parsed.scope).toBe('full');
      expect(parsed.permissions).toEqual(KEY_SCOPES.full.permissions);
    });

    it('should return null for invalid key', () => {
      expect(parseApiKey('invalid_key')).toBeNull();
      expect(parseApiKey('')).toBeNull();
      expect(parseApiKey(null)).toBeNull();
    });

    it('should return null for invalid scope', () => {
      expect(parseApiKey('ulu_invalid_abcd1234')).toBeNull();
    });
  });

  describe('Permissions', () => {
    it('should check read permissions correctly', () => {
      const readKey = generateApiKey('read');
      
      // hasPermission takes the raw key, not parsed
      expect(hasPermission(readKey, 'memory:read')).toBe(true);
      expect(hasPermission(readKey, 'search')).toBe(true);
      expect(hasPermission(readKey, 'memory:write')).toBe(false);
    });

    it('should check write permissions correctly', () => {
      const writeKey = generateApiKey('write');
      
      expect(hasPermission(writeKey, 'memory:read')).toBe(true);
      expect(hasPermission(writeKey, 'memory:write')).toBe(true);
      expect(hasPermission(writeKey, 'memory:delete')).toBe(false);
    });

    it('should check full permissions correctly', () => {
      const fullKey = generateApiKey('full');
      
      expect(hasPermission(fullKey, 'memory:read')).toBe(true);
      expect(hasPermission(fullKey, 'memory:write')).toBe(true);
      expect(hasPermission(fullKey, 'memory:delete')).toBe(true);
    });

    it('should give admin all permissions via wildcard', () => {
      const adminKey = generateApiKey('admin');
      const parsed = parseApiKey(adminKey);
      
      // Admin has '*' which means all permissions
      expect(parsed.permissions).toContain('*');
      expect(hasPermission(adminKey, 'anything')).toBe(true);
    });
  });

  describe('Key Hashing', () => {
    it('should hash key consistently', () => {
      const key = generateApiKey('full');
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different keys', () => {
      const key1 = generateApiKey('full');
      const key2 = generateApiKey('full');
      
      expect(hashApiKey(key1)).not.toBe(hashApiKey(key2));
    });

    it('should produce 64 character SHA256 hash', () => {
      const key = generateApiKey('full');
      const hash = hashApiKey(key);
      
      expect(hash.length).toBe(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('Key Prefix', () => {
    it('should return first 16 chars with ellipsis', () => {
      const key = generateApiKey('full');
      const prefix = getKeyPrefix(key);
      
      expect(prefix.length).toBe(19); // 16 + ...
      expect(prefix.endsWith('...')).toBe(true);
    });
  });

  describe('Rate Limits', () => {
    it('should have rate limits for all scopes', () => {
      expect(RATE_LIMITS.read.rpm).toBe(60);
      expect(RATE_LIMITS.write.rpm).toBe(30);
      expect(RATE_LIMITS.full.rpm).toBe(100);
      expect(RATE_LIMITS.admin.rpm).toBe(200);
    });

    it('should have daily limits', () => {
      expect(RATE_LIMITS.read.daily).toBeDefined();
      expect(RATE_LIMITS.write.daily).toBeDefined();
      expect(RATE_LIMITS.full.daily).toBeDefined();
      expect(RATE_LIMITS.admin.daily).toBeDefined();
    });
  });
});
