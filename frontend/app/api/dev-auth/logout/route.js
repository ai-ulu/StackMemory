import { NextResponse } from 'next/server';
import { clearLocalAuthCookie } from '@/lib/dev/local-mode';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';

export async function POST() {
  if (!isLocalAuthMode()) {
    return NextResponse.json({ error: 'Disabled' }, { status: 404 });
  }

  const response = NextResponse.json({ success: true });
  response.headers.append('Set-Cookie', clearLocalAuthCookie());
  return response;
}
