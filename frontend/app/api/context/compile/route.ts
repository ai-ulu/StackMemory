import { NextRequest, NextResponse } from 'next/server';
import { apiBadRequest, apiError } from '@/lib/api/responses';
import { createAuthenticatedMemoryService } from '@/features/memory/memory.api';
import { requireUser } from '@/features/auth/require-user';
import { compileContext } from '@/features/context/context.optimizer';
import { ContextTelemetryRepository } from '@/features/context/context.telemetry';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.userRequest || typeof body.userRequest !== 'string') {
      return apiBadRequest('userRequest is required');
    }

    const [{ supabase, user }, service] = await Promise.all([
      requireUser(),
      createAuthenticatedMemoryService(),
    ]);

    const input = {
      agentId: body.agentId,
      workspaceId: body.workspaceId,
      userRequest: body.userRequest,
      maxContextTokens: body.maxContextTokens,
      strategy: body.strategy,
      filters: body.filters,
    };

    const memories = await service.listMemories({
      tag: body.filters?.tag,
      type: body.filters?.type || 'all',
      status: body.filters?.status || 'active',
      scope: body.filters?.scope || 'all',
      limit: 500,
    });

    const compiled = compileContext(input, memories);
    const telemetry = new ContextTelemetryRepository(supabase, user.id);
    const contextBuild = await telemetry.recordContextBuild(input, compiled);

    return NextResponse.json({
      context: compiled.context,
      metrics: compiled.metrics,
      contextBuildId: contextBuild.id,
      selectedMemories: compiled.selectedMemories.map((memory) => ({
        id: memory.id,
        type: memory.type,
        confidence: memory.confidence,
        tags: memory.tags,
      })),
      omittedMemoryCount: compiled.omittedMemories.length,
    });
  } catch (error) {
    return apiError(error);
  }
}
