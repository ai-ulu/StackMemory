import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MemoryService } from './memory.service';
import { SupabaseMemoryRepository } from './memory.supabase';

export async function createAuthenticatedMemoryService(): Promise<MemoryService> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('Unauthorized');
  }

  return new MemoryService(new SupabaseMemoryRepository(supabase, data.user.id));
}
