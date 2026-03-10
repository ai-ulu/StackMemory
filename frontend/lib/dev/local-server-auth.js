import { cookies } from 'next/headers';
import {
  createLocalUser,
  findLocalUserByEmail,
  findLocalUserById,
  getLocalAuthCookieName,
  sanitizeLocalUser,
} from '@/lib/dev/local-mode';

export async function getLocalRequestUser(request) {
  if (request) {
    const headerUserId = request.headers.get('x-stackmemory-local-user');
    const headerEmail = request.headers.get('x-stackmemory-local-email');

    if (headerUserId) {
      const user = await findLocalUserById(headerUserId);
      if (user) {
        return sanitizeLocalUser(user);
      }
    }

    if (headerEmail) {
      const existingUser = await findLocalUserByEmail(headerEmail);
      if (existingUser) {
        return sanitizeLocalUser(existingUser);
      }

      const { user } = await createLocalUser(headerEmail, '__stackmemory_local_mcp__');
      if (user) {
        return sanitizeLocalUser(user);
      }
    }
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(getLocalAuthCookieName())?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
