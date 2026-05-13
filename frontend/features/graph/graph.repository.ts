import type { SupabaseClient } from '@supabase/supabase-js';
import type { MemoryGraphEdge } from './graph.service';

const MEMORY_LINK_COLUMNS = 'id, source_memory_id, target_memory_id, relationship_type, weight, reason, created_at, updated_at';

type MemoryLinkRow = {
  id: string;
  source_memory_id: string;
  target_memory_id: string;
  relationship_type: string | null;
  weight: number | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
};

export type MemoryLinkInput = {
  sourceMemoryId: string;
  targetMemoryId: string;
  relationshipType?: string;
  weight?: number;
  reason?: string;
};

function mapLinkRow(row: MemoryLinkRow): MemoryGraphEdge {
  return {
    id: row.id,
    source: row.source_memory_id,
    target: row.target_memory_id,
    label: row.reason || row.relationship_type || 'related',
    weight: row.weight ?? 0.5,
  };
}

export class SupabaseGraphRepository {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly userId: string
  ) {}

  async listLinks(memoryIds?: string[]): Promise<MemoryGraphEdge[]> {
    let query = this.supabase
      .from('memory_links')
      .select(MEMORY_LINK_COLUMNS)
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false })
      .limit(200);

    if (memoryIds?.length) {
      query = query.in('source_memory_id', memoryIds);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const allowedIds = memoryIds?.length ? new Set(memoryIds) : null;
    return (data ?? [])
      .map((row) => mapLinkRow(row as MemoryLinkRow))
      .filter((edge) => !allowedIds || allowedIds.has(edge.source) && allowedIds.has(edge.target));
  }

  async upsertLink(input: MemoryLinkInput): Promise<MemoryGraphEdge> {
    const source = input.sourceMemoryId;
    const target = input.targetMemoryId;

    if (!source || !target || source === target) {
      throw new Error('A link requires two different memories');
    }

    const weight = Math.max(0, Math.min(1, input.weight ?? 0.5));
    const relationshipType = input.relationshipType || 'related';

    const { data, error } = await this.supabase
      .from('memory_links')
      .upsert({
        user_id: this.userId,
        source_memory_id: source,
        target_memory_id: target,
        relationship_type: relationshipType,
        weight,
        reason: input.reason,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,source_memory_id,target_memory_id,relationship_type',
      })
      .select(MEMORY_LINK_COLUMNS)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapLinkRow(data as MemoryLinkRow);
  }

  async deleteLink(id: string): Promise<{ id: string }> {
    const { error } = await this.supabase
      .from('memory_links')
      .delete()
      .eq('user_id', this.userId)
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return { id };
  }
}
