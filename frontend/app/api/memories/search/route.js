/**
 * /api/memories/search  → mcp.search (hybrid: vector + keyword + recency)
 */
import { NextResponse } from 'next/server';
import { mcp, McpError } from '@/lib/mcp/client';
import { getAuth } from '@/lib/mcp/auth';

export async function POST(request) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { query, limit, type } = await request.json();
    if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });

    const result = await mcp.search({
      query,
      namespace: auth.namespace,
      limit: limit ?? 20,
      type,
    });
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
