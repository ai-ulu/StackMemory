/**
 * /api/brain/adapt  → mcp.adapt (feedback loop, adaptive H-score weights)
 */
import { NextResponse } from 'next/server';
import { mcp, McpError } from '@/lib/mcp/client';
import { getAuth } from '@/lib/mcp/auth';

export async function POST(request: Request) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { memory_id, feedback } = await request.json();
    if (!memory_id || !['useful', 'not_useful', 'critical'].includes(feedback)) {
      return NextResponse.json({ error: 'memory_id + valid feedback required' }, { status: 400 });
    }

    const result = await mcp.adapt({
      memory_id,
      feedback,
      namespace: auth.namespace,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
