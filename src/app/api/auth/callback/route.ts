import { NextRequest, NextResponse } from 'next/server';
import { encodeSession } from '@/lib/session';

export const runtime = 'edge';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SESSION_COOKIE = 'vf_session';
const HANDOVER_COOKIE = 'vf_auth_handover';
const STATE_COOKIE = 'vf_oauth_state';
/** 30-day rolling session. Google refresh tokens don't expire unless revoked. */
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
/** 2-minute window for the client to read and consume the auth handover. */
const HANDOVER_MAX_AGE = 120;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/**
 * GET /api/auth/callback
 *
 * Receives the OAuth authorization code from Google, exchanges it for an
 * access token + id_token to the client via a second, readable, short-lived
 * "handover" cookie. Finally redirects back to the app root.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // ── User denied consent ──────────────────────────────────────────────────
  if (error) {
    console.warn('[/api/auth/callback] OAuth error from Google:', error);
    return redirectWithError(origin, error);
  }

  if (!code) {
    return redirectWithError(origin, 'missing_code');
  }

  // ── CSRF verification ────────────────────────────────────────────────────
  const storedState = request.cookies.get(STATE_COOKIE)?.value;
  if (!state || !storedState || state !== storedState) {
    console.warn('[/api/auth/callback] CSRF state mismatch');
    return redirectWithError(origin, 'invalid_state');
  }

  // ── Environment variables ────────────────────────────────────────────────
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!clientId || !clientSecret || !sessionSecret) {
    console.error('[/api/auth/callback] Missing required environment variables');
    return redirectWithError(origin, 'server_config');
  }

  // ── Token exchange ───────────────────────────────────────────────────────
  const redirectUri = `${origin}/api/auth/callback`;

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text();
    console.error('[/api/auth/callback] Token exchange failed:', tokenResponse.status, body);
    return redirectWithError(origin, 'token_exchange_failed');
  }

  const tokens = await tokenResponse.json() as {
    access_token: string;
    id_token?: string;
    expires_in: number;
  };

  // ── Fetch user identity ──────────────────────────────────────────────────
  // Resolve the user's email and Google subject ID so we can store them in
  // the session cookie. These are used by the D1 project API for ownership
  // checks and discovery domain filtering.
  let userEmail = '';
  let userId = '';
  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (userRes.ok) {
      const u = await userRes.json() as { id: string; email: string };
      userId = u.id ?? '';
      userEmail = u.email ?? '';
    }
  } catch (err) {
    console.warn('[/api/auth/callback] Could not fetch userinfo:', err);
  }

  // ── Build cookies ────────────────────────────────────────────────────────
  const isLocalhost = new URL(request.url).hostname === 'localhost';
  const secure = !isLocalhost;

  const signedSession = await encodeSession(
    { userId, email: userEmail },
    sessionSecret,
  );

  // The handover cookie carries the short-lived tokens the client needs to:
  //   1. Sign into Firebase (via id_token + signInWithCredential)
  // Base64-encoded so the payload requires no additional escaping in the
  // Set-Cookie header (base64 chars are always cookie-safe).
  const handoverPayload = btoa(JSON.stringify({
    accessToken: tokens.access_token,
    idToken: tokens.id_token ?? null,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  }));

  const response = NextResponse.redirect(new URL('/', request.url));

  // Clear the CSRF state cookie
  response.cookies.set(STATE_COOKIE, '', { maxAge: 0, path: '/', sameSite: 'lax' });

  // HttpOnly session cookie — JS can never read this
  response.cookies.set(SESSION_COOKIE, signedSession, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  // Short-lived handover cookie — JS can read this for 2 minutes
  response.cookies.set(HANDOVER_COOKIE, handoverPayload, {
    httpOnly: false,
    secure,
    sameSite: 'strict',
    maxAge: HANDOVER_MAX_AGE,
    path: '/',
  });

  return response;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function redirectWithError(origin: string, errorCode: string): NextResponse {
  return NextResponse.redirect(
    new URL(`/?auth_error=${encodeURIComponent(errorCode)}`, origin),
  );
}
