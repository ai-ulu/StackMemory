/**
 * /api/memories/[id]
 * GET    → fetch single memory (uses list + filter, MCP has no get-by-id)
 * PATCH  → mcp.update
 * DELETE → mcp.delete (soft-delete + Vectorize cleanup, server-side)
 */
import { NextResponse } from 'next/server';
import { mcp, McpError } from '@/lib/mcp/client';
import { getAuth } from '@/lib/mcp/auth';

export async function GET(request, { params }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const list = await mcp.list({ namespace: auth.namespace, limit: 500 });
    const memories = list?.memories ?? list ?? [];
    const found = Array.isArray(memories) ? memories.find((m) => m.id === id) : null;
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(found);
  } catch (err) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const result = await mcp.update({
      id,
      namespace: auth.namespace,
      content: body.content,
      type: body.type,
      confidence: body.confidence,
      tags: body.tags,
    });
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const result = await mcp.delete({ id, namespace: auth.namespace });
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
