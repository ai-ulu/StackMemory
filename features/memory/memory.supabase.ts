import type { SupabaseClient } from '@supabase/supabase-js';
import type { Memory, CreateMemoryInput, UpdateMemoryInput, MemoryListOptions } from './memory.types';
import type { IMemoryRepository } from './memory.repository';

/**
 * Supabase Implementation of Memory Repository
 * 
 * Gerçek veritabanı işlemlerini yapar.
 * RLS (Row Level Security) ile kullanıcı izolasyonu sağlar.
 */

export const supabaseMemoryRepository: IMemoryRepository = {
  async list(supabase: SupabaseClient, userId: string, options?: MemoryListOptions) {
    try {
      let query = supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId);

      // Filtreler
      if (options?.type) {
        query = query.eq('type', options.type);
      }

      if (options?.tags && options.tags.length > 0) {
        query = query.contains('tags', options.tags);
      }

      // Sıralama
      const sortBy = options?.sortBy || 'createdAt';
      const sortOrder = options?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Limit/Offset
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Memory[] };
    } catch (error) {
      console.error('Memory list error:', error);
      return { success: false, error: 'Failed to list memories' };
    }
  },

  async getById(supabase: SupabaseClient, userId: string, memoryId: string) {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('id', memoryId)
        .eq('user_id', userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Memory };
    } catch (error) {
      console.error('Memory get error:', error);
      return { success: false, error: 'Failed to get memory' };
    }
  },

  async create(supabase: SupabaseClient, userId: string, input: CreateMemoryInput) {
    try {
      const { data, error } = await supabase
        .from('memories')
        .insert({
          user_id: userId,
          content: input.content,
          type: input.type,
          tags: input.tags || [],
          metadata: input.metadata || {},
          importance: input.importance || 5,
          emotionalValence: input.emotionalValence || 0,
          accessCount: 0,
          lastAccessedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Memory };
    } catch (error) {
      console.error('Memory create error:', error);
      return { success: false, error: 'Failed to create memory' };
    }
  },

  async update(supabase: SupabaseClient, userId: string, memoryId: string, input: UpdateMemoryInput) {
    try {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (input.content !== undefined) updateData.content = input.content;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.metadata !== undefined) updateData.metadata = input.metadata;
      if (input.importance !== undefined) updateData.importance = input.importance;
      if (input.emotionalValence !== undefined) updateData.emotionalValence = input.emotionalValence;

      const { data, error } = await supabase
        .from('memories')
        .update(updateData)
        .eq('id', memoryId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Memory };
    } catch (error) {
      console.error('Memory update error:', error);
      return { success: false, error: 'Failed to update memory' };
    }
  },

  async delete(supabase: SupabaseClient, userId: string, memoryId: string) {
    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Memory delete error:', error);
      return { success: false, error: 'Failed to delete memory' };
    }
  },

  async search(supabase: SupabaseClient, userId: string, query: string, limit = 20) {
    try {
      // Basit text search (production'da pgvector kullanılmalı)
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .ilike('content', `%${query}%`)
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Memory[] };
    } catch (error) {
      console.error('Memory search error:', error);
      return { success: false, error: 'Failed to search memories' };
    }
  }
};
