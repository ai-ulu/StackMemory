import { NextResponse } from 'next/server';
import { createAuthenticatedMemoryService } from '@/features/memory/memory.api';
import { buildBrainStatus } from '@/features/brain/brain.service';

function errorResponse(error) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const status = message === 'Unauthorized' ? 401 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const service = await createAuthenticatedMemoryService();
    const memories = await service.listMemories({ limit: 500 });
    const summary = await service.getSummary();
    const status = buildBrainStatus(memories, summary);

    return NextResponse.json({ status });
  } catch (error) {
    return errorResponse(error);
  }
}
