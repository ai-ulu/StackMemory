/**
 * /api/memories/[id]
 * App-first route: uses the memory service layer backed by Supabase.
 */
import { NextResponse } from 'next/server';
import { createAuthenticatedMemoryService } from '@/features/memory/memory.api';

function errorResponse(error) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const status = message === 'Unauthorized' ? 401 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(_request, { params }) {
  try {
    const service = await createAuthenticatedMemoryService();
    const { id } = await params;
    const memory = await service.getMemory(id);

    if (!memory) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ memory });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const service = await createAuthenticatedMemoryService();
    const { id } = await params;
    const body = await request.json();

    const memory = await service.updateMemory({
      id,
      content: body.content,
      type: body.type,
      confidence: body.confidence,
      scope: body.scope,
      status: body.status,
      tags: body.tags,
    });

    return NextResponse.json({ memory });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const service = await createAuthenticatedMemoryService();
    const { id } = await params;
    const result = await service.deprecateMemory(id);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
