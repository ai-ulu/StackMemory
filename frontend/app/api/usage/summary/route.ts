import { NextResponse } from 'next/server';
import { apiError } from '@/lib/api/responses';
import { requireUser } from '@/features/auth/require-user';
import { UsageSummaryRepository } from '@/features/usage/usage.repository';

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const repository = new UsageSummaryRepository(supabase, user.id);
    const summary = await repository.getSummary();

    return NextResponse.json({ summary });
  } catch (error) {
    return apiError(error);
  }
}
