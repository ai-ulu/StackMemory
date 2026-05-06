/**
 * Auth → namespace bridge.
 *
 * Centralizes the resolution of "who is calling this Next.js API route?" so that
 * every memory/brain route uses the same user → MCP namespace mapping.
 *
 * Identity ownership stays with Supabase (and the dev local-auth fallback).
 * Memory ownership lives in the MCP server, scoped by `namespace`.
 */
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLocalRequestUser } from '@/lib/dev/local-server-auth';
import { isLocalAuthMode } from '@/lib/dev/local-mode-shared';
import { userNamespace } from './client';

export interface AuthContext {
  userId: string;
  email?: string;
  namespace: string;
  /** True when running with the local-auth dev shim. */
  isLocal: boolean;
}

/**
 * Resolve the calling user. Returns null when the caller is unauthenticated;
 * routes should respond with 401 in that case.
 *
 * `scope` is appended as a sub-namespace, e.g. for team or project isolation
 * (`user:<id>:team-42`). Never accept namespace strings directly from the
 * client — always derive them here.
 */
export async function getAuth(
  request: NextRequest | Request,
  scope?: string
): Promise<AuthContext | null> {
  if (isLocalAuthMode()) {
    const user = await getLocalRequestUser(request as NextRequest);
    if (!user) return null;
    return {
      userId: user.id,
      email: user.email,
      namespace: userNamespace(user.id, scope),
      isLocal: true,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  return {
    userId: user.id,
    email: user.email ?? undefined,
    namespace: userNamespace(user.id, scope),
    isLocal: false,
  };
}
