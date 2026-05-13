import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function requireUser() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('Unauthorized');
  }

  return { supabase, user: data.user };
}
