/**
 * /api/memory/graph  → mcp.graph (legacy duplicate of /api/memories/graph)
 *
 * Kept for backwards compatibility with the dashboard that wires to this path.
 * Delegates to MCP and returns nodes/edges directly.
 */
import { NextResponse } from 'next/server';
import { mcp, McpError } from '@/lib/mcp/client';
import { getAuth } from '@/lib/mcp/auth';

export async function GET(request: Request) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const result = await mcp.graph({
      namespace: auth.namespace,
      filter_keyword: url.searchParams.get('keyword') || undefined,
      limit: Number(url.searchParams.get('limit')) || 200,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
