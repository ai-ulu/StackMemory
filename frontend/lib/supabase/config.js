import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return {
    url,
    anonKey,
    isLocalMode: isLocalAuthMode(),
    isConfigured: Boolean(url && anonKey),
  };
}

export function assertSupabaseConfig() {
  const config = getSupabaseConfig();

  if (config.isLocalMode) {
    return config;
  }

  if (!config.isConfigured) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return config;
}
