import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getLocalAuthCookieName } from '@/lib/dev/local-mode';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';

export async function GET() {
  if (!isLocalAuthMode()) {
    return NextResponse.json({ user: null }, { status: 404 });
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(getLocalAuthCookieName())?.value;
  if (!raw) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    return NextResponse.json({ user: JSON.parse(raw) });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
