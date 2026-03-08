import { NextResponse } from 'next/server';
import { authenticateLocalUser, buildLocalAuthCookie, sanitizeLocalUser } from '@/lib/dev/local-mode';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';

export async function POST(request) {
  if (!isLocalAuthMode()) {
    return NextResponse.json({ error: 'Disabled' }, { status: 404 });
  }

  const { email, password } = await request.json();
  const { user, error } = await authenticateLocalUser(email, password);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const response = NextResponse.json({ user: sanitizeLocalUser(user) });
  response.headers.append('Set-Cookie', buildLocalAuthCookie(user));
  return response;
}
