import { createBrowserClient } from '@supabase/ssr';
import { createLocalAuthClient } from '@/lib/dev/local-client-auth';
import { assertSupabaseConfig, getSupabaseConfig } from '@/lib/supabase/config';

export function createClient() {
  const config = getSupabaseConfig();

  if (config.isLocalMode) {
    return createLocalAuthClient();
  }

  const { url, anonKey } = assertSupabaseConfig();

  return createBrowserClient(
    url,
    anonKey
  );
}
