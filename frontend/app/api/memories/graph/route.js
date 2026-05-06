/**
 * /api/memories/graph  → mcp.graph (relationship graph, optional filter)
 */
import { NextResponse } from 'next/server';
import { mcp, McpError } from '@/lib/mcp/client';
import { getAuth } from '@/lib/mcp/auth';

export async function GET(request) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const result = await mcp.graph({
      namespace: auth.namespace,
      filter_keyword: searchParams.get('keyword') || undefined,
      limit: Number(searchParams.get('limit')) || 200,
    });
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
