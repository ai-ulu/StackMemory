/**
 * /api/memories
 * GET  → mcp.list   (list memories in current user's namespace)
 * POST → mcp.store  (create memory; PII scrubbing handled server-side)
 *
 * Refactored: previously wrote to Supabase `memories` table. Now delegates
 * to the MCP server (Cloudflare D1 + Vectorize) — single source of truth.
 */
import { NextResponse } from 'next/server';
import { mcp, McpError } from '@/lib/mcp/client';
import { getAuth } from '@/lib/mcp/auth';

const ALLOWED_TYPES = [
  'identity', 'preference', 'fact', 'project',
  'rule', 'decision', 'task', 'insight',
];

export async function GET(request) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const result = await mcp.list({
      namespace: auth.namespace,
      type: searchParams.get('type') || undefined,
      limit: Number(searchParams.get('limit')) || 100,
      offset: Number(searchParams.get('offset')) || 0,
    });

    return NextResponse.json(result?.memories ?? result ?? []);
  } catch (err) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function POST(request) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      content,
      type = 'fact',
      confidence = 0.8,
      tags,
      importance_score,
    } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid memory type' }, { status: 400 });
    }

    const result = await mcp.store({
      content,
      type,
      confidence: Math.max(0, Math.min(1, confidence)),
      namespace: auth.namespace,
      tags,
      importance_score,
    });

    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof McpError ? 502 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
