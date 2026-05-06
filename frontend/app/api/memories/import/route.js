/**
 * /api/memories/import  → mcp.import (duplicate handling + PII scrubbing)
 */
import { NextResponse } from 'next/server';
import { mcp, McpError } from '@/lib/mcp/client';
import { getAuth } from '@/lib/mcp/auth';

export async function POST(request) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { memories, on_duplicate } = await request.json();
    if (!Array.isArray(memories)) {
      return NextResponse.json({ error: 'memories array required' }, { status: 400 });
    }

    const result = await mcp.import({
      memories,
      namespace: auth.namespace,
      on_duplicate: on_duplicate === 'overwrite' ? 'overwrite' : 'skip',
    });
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
