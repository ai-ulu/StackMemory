import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase/config';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = searchParams.get('next') || '/chat';
  const config = getSupabaseConfig();

  if (config.isLocalMode) {
    const destination = type === 'recovery'
      ? `${origin}/settings?tab=password`
      : `${origin}${next}`;
    return NextResponse.redirect(destination);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Handle password recovery
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/settings?tab=password`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/login?error=auth_error`);
}
