/**
 * Edge-compatible helper for resolving the authenticated user from the
 * `vf_session` HttpOnly cookie in API route handlers.
 *
 * Replaces the old `getUserAccessToken` helper now that project storage lives
 * in Cloudflare D1 rather than Google Drive. API routes no longer need a
 * Google OAuth access token — they only need to know who the caller is.
 */

import type { NextRequest } from 'next/server';
import { decodeSession } from '@/lib/session';

const SESSION_COOKIE = 'vf_session';

export interface SessionUser {
  /** Firebase / Google user ID. */
  userId: string;
  /** User's email address (used for discovery domain checks). */
  email: string;
}

/**
 * Decodes the `vf_session` cookie and returns `{ userId, email }`, or `null`
 * if the cookie is absent, tampered, or the env var is missing.
 *
 * Usage in an Edge route:
 * ```ts
 * const user = await getSessionUser(request);
 * if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * ```
 */
export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.error('[session-user] SESSION_SECRET is not set');
    return null;
  }

  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookieValue) return null;

  const session = await decodeSession(cookieValue, secret);
  if (!session?.userId) return null;

  // `email` was added after the initial release; fall back gracefully for any
  // sessions that were created before this field existed.
  return {
    userId: session.userId,
    email: session.email ?? '',
  };
}
