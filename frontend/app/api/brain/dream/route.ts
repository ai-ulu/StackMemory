/**
 * /api/brain/dream  → mcp.dream (cross-namespace ideation; user-scoped)
 *
 * NOTE: Dreaming spans the *user's* namespaces only. We constrain the MCP call
 * to namespaces prefixed with `user:<id>` so a user never sees other tenants'
 * patterns. The MCP server enforces this when `namespaces` is provided.
 */
import { NextResponse } from 'next/server';
import { mcp, McpError } from '@/lib/mcp/client';
import { getAuth } from '@/lib/mcp/auth';

export async function POST(request: Request) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { focus, max_ideas } = await request.json();
    const result = await mcp.dream({
      focus,
      max_ideas: max_ideas ?? 5,
      namespaces: [auth.namespace],
    });
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
