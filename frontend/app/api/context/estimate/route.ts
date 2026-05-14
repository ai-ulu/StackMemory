import { NextRequest, NextResponse } from 'next/server';
import { apiBadRequest, apiError } from '@/lib/api/responses';
import { createAuthenticatedMemoryService } from '@/features/memory/memory.api';
import { compileContext } from '@/features/context/context.optimizer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.userRequest || typeof body.userRequest !== 'string') {
      return apiBadRequest('userRequest is required');
    }

    const service = await createAuthenticatedMemoryService();
    const memories = await service.listMemories({
      tag: body.filters?.tag,
      type: body.filters?.type || 'all',
      status: body.filters?.status || 'active',
      scope: body.filters?.scope || 'all',
      limit: 500,
    });

    const compiled = compileContext({
      agentId: body.agentId,
      workspaceId: body.workspaceId,
      userRequest: body.userRequest,
      maxContextTokens: body.maxContextTokens,
      strategy: body.strategy,
      filters: body.filters,
    }, memories);

    return NextResponse.json({
      metrics: compiled.metrics,
      selectedMemoryIds: compiled.selectedMemories.map((memory) => memory.id),
      omittedMemoryIds: compiled.omittedMemories.map((memory) => memory.id),
    });
  } catch (error) {
    return apiError(error);
  }
}
