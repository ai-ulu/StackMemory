export function isLocalAuthMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return !url || url.includes('gsqzysjxqwipxphbgnpv.supabase.co');
}
