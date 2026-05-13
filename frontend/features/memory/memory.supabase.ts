import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateMemoryInput, Memory, MemoryListFilters, UpdateMemoryInput } from './memory.types';
import type { MemoryRepository } from './memory.repository';

const MEMORY_COLUMNS = 'id, content, type, confidence, status, scope, tags, access_count, decay_factor, created_at, updated_at, last_accessed_at';

type MemoryRow = {
  id: string;
  content: string;
  type: Memory['type'];
  confidence: number | null;
  status: Memory['status'] | null;
  scope: Memory['scope'] | null;
  tags: string[] | null;
  access_count: number | null;
  decay_factor: number | null;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
};

function normalizeTags(tags?: string[]): string[] {
  return Array.from(new Set((tags ?? [])
    .map((tag) => tag.trim().replace(/^#/, ''))
    .filter(Boolean)
    .map((tag) => tag.toLowerCase())));
}

function normalizeTagFilter(tag?: string): string {
  return tag?.trim().replace(/^#/, '').toLowerCase() ?? '';
}

function mapMemoryRow(row: MemoryRow): Memory {
  return {
    id: row.id,
    content: row.content,
    type: row.type,
    confidence: row.confidence ?? 0.8,
    status: row.status ?? 'active',
    scope: row.scope ?? 'private',
    tags: row.tags ?? [],
    accessCount: row.access_count ?? 0,
    decayFactor: row.decay_factor ?? 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastAccessedAt: row.last_accessed_at ?? undefined,
  };
}

export class SupabaseMemoryRepository implements MemoryRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly userId: string
  ) {}

  async list(filters?: MemoryListFilters): Promise<Memory[]> {
    let query = this.supabase
      .from('memories')
      .select(MEMORY_COLUMNS)
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false })
      .limit(filters?.limit ?? 50);

    if (filters?.query?.trim()) {
      query = query.ilike('content', `%${filters.query.trim()}%`);
    }

    const tag = normalizeTagFilter(filters?.tag);
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.scope && filters.scope !== 'all') {
      query = query.eq('scope', filters.scope);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapMemoryRow(row as MemoryRow));
  }

  async get(id: string): Promise<Memory | null> {
    const { data, error } = await this.supabase
      .from('memories')
      .select(MEMORY_COLUMNS)
      .eq('user_id', this.userId)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapMemoryRow(data as MemoryRow) : null;
  }

  async create(input: CreateMemoryInput): Promise<Memory> {
    const { data, error } = await this.supabase
      .from('memories')
      .insert({
        user_id: this.userId,
        content: input.content,
        type: input.type,
        confidence: input.confidence ?? 0.8,
        status: 'active',
        scope: input.scope ?? 'private',
        tags: normalizeTags(input.tags),
        access_count: 0,
        decay_factor: 1,
      })
      .select(MEMORY_COLUMNS)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapMemoryRow(data as MemoryRow);
  }

  async update(input: UpdateMemoryInput): Promise<Memory> {
    const patch: Record<string, unknown> = {};

    if (input.content !== undefined) patch.content = input.content;
    if (input.type !== undefined) patch.type = input.type;
    if (input.confidence !== undefined) patch.confidence = input.confidence;
    if (input.scope !== undefined) patch.scope = input.scope;
    if (input.status !== undefined) patch.status = input.status;
    if (input.tags !== undefined) patch.tags = normalizeTags(input.tags);
    patch.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('memories')
      .update(patch)
      .eq('user_id', this.userId)
      .eq('id', input.id)
      .select(MEMORY_COLUMNS)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapMemoryRow(data as MemoryRow);
  }

  async remove(id: string): Promise<{ id: string }> {
    const { error } = await this.supabase
      .from('memories')
      .update({ status: 'deprecated', updated_at: new Date().toISOString() })
      .eq('user_id', this.userId)
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return { id };
  }
}
