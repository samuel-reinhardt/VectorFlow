import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, encodeSession } from '@/lib/session';

export const runtime = 'edge';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SESSION_COOKIE = 'vf_session';
/** Rolling 30-day session cookie lifetime. */
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/refresh-token
 *
 * Reads the refresh token from the HttpOnly session cookie, exchanges it
 * with Google for a fresh access token, and returns the new token in JSON.
 *
 * If Google returns a rotated refresh token, the session cookie is updated.
 * If the refresh token has been revoked (invalid_grant), the session cookie
 * is cleared and a 401 is returned — the user must sign in again.
 *
 * Called automatically by GoogleDriveService.ensureValidToken() whenever
 * the stored access token has expired. No user interaction required.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!clientId || !clientSecret || !sessionSecret) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // ── Read & verify the session cookie ─────────────────────────────────────
  const sessionValue = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionValue) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }

  const session = await decodeSession(sessionValue, sessionSecret);
  if (!session?.refreshToken) {
    // Cookie was tampered with or is from a different secret
    const response = NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    clearSessionCookie(response);
    return response;
  }

  // ── Exchange refresh token with Google ───────────────────────────────────
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: session.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    const body = await tokenResponse.json().catch(() => ({})) as { error?: string };

    // invalid_grant = refresh token was revoked or expired. Force re-login.
    if (body.error === 'invalid_grant') {
      console.info('[/api/auth/refresh-token] Refresh token revoked — clearing session.');
      const response = NextResponse.json(
        { error: 'Session expired. Please sign in again.' },
        { status: 401 },
      );
      clearSessionCookie(response);
      return response;
    }

    console.error('[/api/auth/refresh-token] Token refresh failed:', tokenResponse.status, body);
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 502 });
  }

  const { access_token, refresh_token: newRefreshToken, expires_in } = await tokenResponse.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const isLocalhost = new URL(request.url).hostname === 'localhost';

  const response = NextResponse.json({
    accessToken: access_token,
    expiresAt: Date.now() + expires_in * 1000,
  });

  // ── Update session cookie if Google rotated the refresh token ─────────────
  if (newRefreshToken) {
    const updatedSession = await encodeSession(
      { ...session, refreshToken: newRefreshToken },
      sessionSecret,
    );
    response.cookies.set(SESSION_COOKIE, updatedSession, {
      httpOnly: true,
      secure: !isLocalhost,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
  }

  return response;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
