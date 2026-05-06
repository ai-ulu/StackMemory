/**
 * /api/brain/think  → mcp.think (cognitive reasoning over user's namespace)
 */
import { NextResponse } from 'next/server';
import { mcp, McpError } from '@/lib/mcp/client';
import { getAuth } from '@/lib/mcp/auth';

export async function POST(request: Request) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { context, depth } = await request.json();
    if (!context) return NextResponse.json({ error: 'context required' }, { status: 400 });

    const result = await mcp.think({
      context,
      namespace: auth.namespace,
      depth: depth === 'deep' ? 'deep' : 'shallow',
    });
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
