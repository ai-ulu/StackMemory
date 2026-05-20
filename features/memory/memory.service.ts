import type { IMemoryRepository } from './memory.repository';
import type { Memory, CreateMemoryInput, UpdateMemoryInput, MemoryListOptions } from './memory.types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Memory Service
 * 
 * İş mantığı katmanı.
 * Repository'leri kullanır, doğrudan veritabanına erişmez.
 */

export class MemoryService {
  private repository: IMemoryRepository;

  constructor(repository: IMemoryRepository) {
    this.repository = repository;
  }

  async listMemories(
    supabase: SupabaseClient,
    userId: string,
    options?: MemoryListOptions
  ): Promise<{ success: boolean; data?: Memory[]; error?: string }> {
    return this.repository.list(supabase, userId, options);
  }

  async getMemory(
    supabase: SupabaseClient,
    userId: string,
    memoryId: string
  ): Promise<{ success: boolean; data?: Memory; error?: string }> {
    return this.repository.getById(supabase, userId, memoryId);
  }

  async createMemory(
    supabase: SupabaseClient,
    userId: string,
    input: CreateMemoryInput
  ): Promise<{ success: boolean; data?: Memory; error?: string }> {
    // Validation
    if (!input.content || input.content.trim().length === 0) {
      return { success: false, error: 'Content is required' };
    }

    if (input.importance !== undefined && (input.importance < 0 || input.importance > 10)) {
      return { success: false, error: 'Importance must be between 0 and 10' };
    }

    if (input.emotionalValence !== undefined && (input.emotionalValence < -1 || input.emotionalValence > 1)) {
      return { success: false, error: 'Emotional valence must be between -1 and 1' };
    }

    return this.repository.create(supabase, userId, input);
  }

  async updateMemory(
    supabase: SupabaseClient,
    userId: string,
    memoryId: string,
    input: UpdateMemoryInput
  ): Promise<{ success: boolean; data?: Memory; error?: string }> {
    // Validation
    if (input.content !== undefined && input.content.trim().length === 0) {
      return { success: false, error: 'Content cannot be empty' };
    }

    if (input.importance !== undefined && (input.importance < 0 || input.importance > 10)) {
      return { success: false, error: 'Importance must be between 0 and 10' };
    }

    return this.repository.update(supabase, userId, memoryId, input);
  }

  async deleteMemory(
    supabase: SupabaseClient,
    userId: string,
    memoryId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.repository.delete(supabase, userId, memoryId);
  }

  async searchMemories(
    supabase: SupabaseClient,
    userId: string,
    query: string,
    limit?: number
  ): Promise<{ success: boolean; data?: Memory[]; error?: string }> {
    if (!query || query.trim().length === 0) {
      return { success: false, error: 'Search query is required' };
    }

    return this.repository.search(supabase, userId, query, limit);
  }
}
