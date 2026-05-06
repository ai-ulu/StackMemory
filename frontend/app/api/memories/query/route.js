/**
 * /api/memories/query  → mcp.query (natural language, multi-signal ranking)
 */
import { NextResponse } from 'next/server';
import { mcp, McpError } from '@/lib/mcp/client';
import { getAuth } from '@/lib/mcp/auth';

export async function POST(request) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { query, limit } = await request.json();
    if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });

    const result = await mcp.query({
      query,
      namespace: auth.namespace,
      limit: limit ?? 10,
    });
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
