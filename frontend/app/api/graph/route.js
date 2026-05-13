import { NextResponse } from 'next/server';
import { createAuthenticatedMemoryService } from '@/features/memory/memory.api';
import { buildMemoryGraph } from '@/features/graph/graph.service';
import { SupabaseGraphRepository } from '@/features/graph/graph.repository';
import { requireUser } from '@/features/auth/require-user';

function errorResponse(error) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const status = message === 'Unauthorized' ? 401 : 500;
  return NextResponse.json({ error: message }, { status });
}

async function getGraphContext() {
  const [{ supabase, user }, service] = await Promise.all([
    requireUser(),
    createAuthenticatedMemoryService(),
  ]);

  return {
    service,
    graphRepository: new SupabaseGraphRepository(supabase, user.id),
  };
}

export async function GET(request) {
  try {
    const { service, graphRepository } = await getGraphContext();
    const { searchParams } = new URL(request.url);
    const memories = await service.listMemories({
      type: searchParams.get('type') || 'all',
      status: searchParams.get('status') || 'all',
      scope: searchParams.get('scope') || 'all',
      tag: searchParams.get('tag') || undefined,
      limit: Number(searchParams.get('limit')) || 200,
    });
    const memoryIds = memories.map((memory) => memory.id);
    const links = await graphRepository.listLinks(memoryIds);
    const graph = buildMemoryGraph(memories, links);

    return NextResponse.json({ graph });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request) {
  try {
    const { graphRepository } = await getGraphContext();
    const body = await request.json();
    const edge = await graphRepository.upsertLink({
      sourceMemoryId: body.sourceMemoryId || body.source,
      targetMemoryId: body.targetMemoryId || body.target,
      relationshipType: body.relationshipType || body.relationship_type || 'related',
      weight: body.weight,
      reason: body.reason,
    });

    return NextResponse.json({ edge }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request) {
  try {
    const { graphRepository } = await getGraphContext();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const result = await graphRepository.deleteLink(id);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
