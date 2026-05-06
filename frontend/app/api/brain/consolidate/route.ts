/**
 * /api/brain/consolidate  → mcp.consolidate (cluster similar memories → insights)
 */
import { NextResponse } from 'next/server';
import { mcp, McpError } from '@/lib/mcp/client';
import { getAuth } from '@/lib/mcp/auth';

export async function POST(request: Request) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { min_cluster_size, dry_run } = await request.json();
    const result = await mcp.consolidate({
      namespace: auth.namespace,
      min_cluster_size: min_cluster_size ?? 3,
      dry_run: !!dry_run,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
