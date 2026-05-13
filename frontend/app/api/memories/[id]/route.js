/**
 * /api/memories/[id]
 * App-first route: uses the memory service layer backed by Supabase.
 */
import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api/responses';
import { createAuthenticatedMemoryService } from '@/features/memory/memory.api';

export async function GET(_request, { params }) {
  try {
    const service = await createAuthenticatedMemoryService();
    const { id } = params;
    const memory = await service.getMemory(id);

    if (!memory) {
      throw new Error('Not found');
    }

    return NextResponse.json({ memory });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const service = await createAuthenticatedMemoryService();
    const { id } = params;
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
    return apiError(error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const service = await createAuthenticatedMemoryService();
    const { id } = params;
    const result = await service.deprecateMemory(id);

    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
