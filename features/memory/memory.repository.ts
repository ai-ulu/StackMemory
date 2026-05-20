import type { SupabaseClient } from '@supabase/supabase-js';
import type { Memory, CreateMemoryInput, UpdateMemoryInput, MemoryListOptions } from './memory.types';

/**
 * Memory Repository Interface
 * 
 * Veritabanı işlemlerini soyutlar.
 * Sadece interface tanımlar, implementasyon memory.supabase.ts'de olur.
 */

export interface IMemoryRepository {
  list(
    supabase: SupabaseClient,
    userId: string,
    options?: MemoryListOptions
  ): Promise<{ success: boolean; data?: Memory[]; error?: string }>;

  getById(
    supabase: SupabaseClient,
    userId: string,
    memoryId: string
  ): Promise<{ success: boolean; data?: Memory; error?: string }>;

  create(
    supabase: SupabaseClient,
    userId: string,
    input: CreateMemoryInput
  ): Promise<{ success: boolean; data?: Memory; error?: string }>;

  update(
    supabase: SupabaseClient,
    userId: string,
    memoryId: string,
    input: UpdateMemoryInput
  ): Promise<{ success: boolean; data?: Memory; error?: string }>;

  delete(
    supabase: SupabaseClient,
    userId: string,
    memoryId: string
  ): Promise<{ success: boolean; error?: string }>;

  search(
    supabase: SupabaseClient,
    userId: string,
    query: string,
    limit?: number
  ): Promise<{ success: boolean; data?: Memory[]; error?: string }>;
}

/**
 * Basit Repository Implementation
 * Gerçek implementasyon için memory.supabase.ts kullanılmalıdır.
 * Bu sadece interface'i export eder.
 */
export const memoryRepository: IMemoryRepository = {
  async list(supabase, userId, options) {
    // Gerçek implementasyon memory.supabase.ts'de
    throw new Error('Repository not implemented. Use memory.supabase.ts');
  },

  async getById(supabase, userId, memoryId) {
    throw new Error('Repository not implemented. Use memory.supabase.ts');
  },

  async create(supabase, userId, input) {
    throw new Error('Repository not implemented. Use memory.supabase.ts');
  },

  async update(supabase, userId, memoryId, input) {
    throw new Error('Repository not implemented. Use memory.supabase.ts');
  },

  async delete(supabase, userId, memoryId) {
    throw new Error('Repository not implemented. Use memory.supabase.ts');
  },

  async search(supabase, userId, query, limit) {
    throw new Error('Repository not implemented. Use memory.supabase.ts');
  }
};
