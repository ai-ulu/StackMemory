import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { getLocalRequestUser } from '@/lib/dev/local-server-auth';
import { listMemories } from '@/lib/dev/local-data';

export const dynamic = 'force-dynamic';

interface MemoryData {
  id: string;
  type: string;
  content: any;
  metadata: {
    timestamp: number;
    tags?: string[];
    score?: number;
    [key: string]: any;
  };
  connections?: string[];
}

/**
 * GET /api/memory/graph
 * Fetch real memories from Supabase (hosted) or local store (dev mode)
 * and format them as graph-compatible data.
 */
export async function GET(request: NextRequest) {
  try {
    let memories: MemoryData[] = [];

    if (isLocalAuthMode()) {
      const user = await getLocalRequestUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const localData = await listMemories(user.id, {});
      memories = (localData || []).map(formatMemory);
    } else {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Fetch real memories with connections
      const { data, error } = await supabase
        .from('memories')
        .select('id, content, type, confidence, status, created_at, updated_at, last_accessed_at, access_count, tags, scope')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('[graph] Supabase query error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      memories = (data || []).map(formatMemory);
    }

    return NextResponse.json({
      success: true,
      memories,
      count: memories.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[graph] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Bellek verileri alınamadı',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/** Transform a DB memory row into the graph MemoryData shape */
function formatMemory(row: any): MemoryData {
  const tags: string[] = [];
  if (row.tags) {
    try {
      const parsed = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
      if (Array.isArray(parsed)) tags.push(...parsed);
    } catch { /* ignore parse errors */ }
  }
  if (row.type) tags.push(row.type);

  return {
    id: row.id,
    type: (row.type || 'fact').toUpperCase(),
    content: { text: row.content || '' },
    metadata: {
      timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      tags,
      score: row.confidence ?? 0.8,
      access_count: row.access_count ?? 0,
      scope: row.scope ?? 'private',
    },
    connections: [],
  };
}
