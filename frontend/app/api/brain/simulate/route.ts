/**
 * /api/brain/simulate  → mcp.simulate (decision risk scoring)
 */
import { NextResponse } from 'next/server';
import { mcp, McpError } from '@/lib/mcp/client';
import { getAuth } from '@/lib/mcp/auth';

export async function POST(request: Request) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { decision, include_cross_namespace } = await request.json();
    if (!decision) return NextResponse.json({ error: 'decision required' }, { status: 400 });

    const result = await mcp.simulate({
      decision,
      namespace: auth.namespace,
      include_cross_namespace: include_cross_namespace !== false,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
