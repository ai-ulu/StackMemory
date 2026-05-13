import { requireUser } from '@/features/auth/require-user';
import { MemoryService } from './memory.service';
import { SupabaseMemoryRepository } from './memory.supabase';

export async function createAuthenticatedMemoryService(): Promise<MemoryService> {
  const { supabase, user } = await requireUser();

  return new MemoryService(new SupabaseMemoryRepository(supabase, user.id));
}
