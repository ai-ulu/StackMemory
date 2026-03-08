import { cookies } from 'next/headers';
import { getLocalAuthCookieName } from '@/lib/dev/local-mode';

export async function getLocalRequestUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(getLocalAuthCookieName())?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
