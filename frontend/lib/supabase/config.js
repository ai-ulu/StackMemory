import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalMode = isLocalAuthMode();

  return {
    url,
    anonKey,
    isLocalMode,
    isConfigured: Boolean(url && anonKey),
    isProduction,
    isUnsafeProductionLocalMode: isProduction && isLocalMode,
  };
}

export function isSupabaseMode() {
  const config = getSupabaseConfig();
  return !config.isLocalMode && config.isConfigured;
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
