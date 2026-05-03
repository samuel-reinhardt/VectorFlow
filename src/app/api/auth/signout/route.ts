import { NextResponse } from 'next/server';

export const runtime = 'edge';

const SESSION_COOKIE = 'vf_session';

/**
 * POST /api/auth/signout
 *
 * Clears the server-side HttpOnly session cookie that holds the Google
 * OAuth refresh token. The client is responsible for also revoking the
 * Firebase session (signOut from firebase/auth).
 */
export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
