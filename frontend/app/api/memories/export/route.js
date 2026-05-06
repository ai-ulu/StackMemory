/**
 * /api/memories/export  → mcp.export (max 500 records, json/csv)
 */
import { NextResponse } from 'next/server';
import { mcp, McpError } from '@/lib/mcp/client';
import { getAuth } from '@/lib/mcp/auth';

export async function GET(request) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') === 'csv' ? 'csv' : 'json';
    const result = await mcp.export({ namespace: auth.namespace, format });
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
