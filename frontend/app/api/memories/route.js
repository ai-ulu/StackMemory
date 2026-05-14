/**
 * /api/memories
 * App-first route: uses the memory service layer backed by Supabase.
 * MCP is parked and will return later as an adapter over this service boundary.
 */
import { NextResponse } from 'next/server';
import { apiBadRequest, apiError, apiPaymentRequired } from '@/lib/api/responses';
import { createAuthenticatedMemoryService } from '@/features/memory/memory.api';
import { requireUser } from '@/features/auth/require-user';
import { getMemoryEntitlement } from '@/features/billing/billing.entitlements';

const ALLOWED_TYPES = [
  'identity', 'preference', 'fact', 'project',
  'rule', 'decision', 'task', 'insight',
];

export async function GET(request) {
  try {
    const service = await createAuthenticatedMemoryService();
    const { searchParams } = new URL(request.url);
    const memories = await service.listMemories({
      query: searchParams.get('q') || undefined,
      type: searchParams.get('type') || 'all',
      status: searchParams.get('status') || 'all',
      scope: searchParams.get('scope') || 'all',
      tag: searchParams.get('tag') || undefined,
      limit: Number(searchParams.get('limit')) || 100,
    });

    return NextResponse.json({ memories });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request) {
  try {
    const { supabase, user } = await requireUser();
    const entitlement = await getMemoryEntitlement(supabase, user.id);

    if (!entitlement.canCreateMemory) {
      return apiPaymentRequired('Memory limit reached for current plan', {
        code: 'memory_limit_reached',
        entitlement,
      });
    }

    const service = await createAuthenticatedMemoryService();
    const body = await request.json();
    const type = body.type || 'fact';

    if (!body.content) {
      return apiBadRequest('Content is required');
    }

    if (!ALLOWED_TYPES.includes(type)) {
      return apiBadRequest('Invalid memory type');
    }

    const memory = await service.createMemory({
      content: body.content,
      type,
      confidence: body.confidence,
      scope: body.scope,
      tags: body.tags,
    });

    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
