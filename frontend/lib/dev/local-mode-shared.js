export function isLocalAuthMode() {
  const explicitMode = (
    process.env.STACKMEMORY_LOCAL_MODE ||
    process.env.NEXT_PUBLIC_STACKMEMORY_LOCAL_MODE ||
    ''
  ).toLowerCase();

  if (explicitMode === 'true') {
    return true;
  }

  if (explicitMode === 'false') {
    return false;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!url) {
    return process.env.NODE_ENV !== 'production';
  }

  return url.includes('gsqzysjxqwipxphbgnpv.supabase.co');
}
