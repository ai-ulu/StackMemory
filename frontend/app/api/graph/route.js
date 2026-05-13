import { NextResponse } from 'next/server';
import { createAuthenticatedMemoryService } from '@/features/memory/memory.api';
import { buildMemoryGraph } from '@/features/graph/graph.service';

function errorResponse(error) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const status = message === 'Unauthorized' ? 401 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request) {
  try {
    const service = await createAuthenticatedMemoryService();
    const { searchParams } = new URL(request.url);
    const memories = await service.listMemories({
      type: searchParams.get('type') || 'all',
      status: searchParams.get('status') || 'all',
      scope: searchParams.get('scope') || 'all',
      limit: Number(searchParams.get('limit')) || 200,
    });
    const graph = buildMemoryGraph(memories);

    return NextResponse.json({ graph });
  } catch (error) {
    return errorResponse(error);
  }
}
