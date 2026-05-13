import { NextResponse } from 'next/server';
import { createAuthenticatedMemoryService } from '@/features/memory/memory.api';
import { simulateDecision } from '@/features/brain/brain.service';

function errorResponse(error) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const status = message === 'Unauthorized' ? 401 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.decision) {
      return NextResponse.json({ error: 'Decision is required' }, { status: 400 });
    }

    const service = await createAuthenticatedMemoryService();
    const memories = await service.listMemories({ limit: 500 });
    const simulation = simulateDecision(body.decision, memories);

    return NextResponse.json({ simulation });
  } catch (error) {
    return errorResponse(error);
  }
}
