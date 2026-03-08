import { createBrowserClient } from '@supabase/ssr';
import { createLocalAuthClient } from '@/lib/dev/local-client-auth';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';

export function createClient() {
  if (isLocalAuthMode()) {
    return createLocalAuthClient();
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
