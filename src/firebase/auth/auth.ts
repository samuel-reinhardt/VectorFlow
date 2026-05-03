'use client';

import {
  getAuth,
  signOut as firebaseSignOut,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
  'openid',
  'email',
  'profile',
].join(' ');

const STATE_COOKIE = 'vf_oauth_state';
const HANDOVER_COOKIE = 'vf_auth_handover';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generates a cryptographically random, URL-safe CSRF state token. */
function generateState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initiates the Google OAuth authorization-code flow by redirecting the
 * browser to Google's OAuth consent page.
 *
 *  - `access_type` and `prompt` have been removed since we no longer need Drive offline access.
 *
 * Google will redirect back to `/api/auth/callback` with an authorization
 * code. That Edge route exchanges the code for tokens, stores the refresh
 * token in an HttpOnly cookie, and redirects to `/`. The `FirebaseClientProvider`
 * then consumes the short-lived handover cookie on the next mount.
 */
export const initiateGoogleSignIn = (): void => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.error(
      '[auth] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. ' +
      'Add it to .env.local and Cloudflare Pages environment variables.',
    );
    return;
  }

  const state = generateState();
  const redirectUri = `${window.location.origin}/api/auth/callback`;
  const isLocalhost = window.location.hostname === 'localhost';

  // Store the CSRF state in a short-lived cookie (5 minutes).
  // SameSite=Lax is required so the browser sends it when Google redirects back.
  const securePart = isLocalhost ? '' : '; Secure';
  document.cookie = `${STATE_COOKIE}=${state}; path=/; max-age=300; SameSite=Lax${securePart}`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    state,
  });

  window.location.href = `${GOOGLE_OAUTH_URL}?${params}`;
};

/**
 * Consumes the `vf_auth_handover` cookie set by `/api/auth/callback`.
 *
 * On success:
 *  1. Signs the Firebase user in using `signInWithCredential` (id_token).
 *  2. Clears the handover cookie (single-use).
 *
 * Returns `null` if no handover cookie is present (normal case on non-redirect
 * page loads).
 */
export const consumeAuthHandover = async (): Promise<string | null> => {
  if (typeof document === 'undefined') return null;

  const cookieEntry = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${HANDOVER_COOKIE}=`));

  if (!cookieEntry) return null;

  // Immediately clear the handover cookie — it is single-use.
  const isLocalhost = window.location.hostname === 'localhost';
  const securePart = isLocalhost ? '' : '; Secure';
  document.cookie = `${HANDOVER_COOKIE}=; path=/; max-age=0; SameSite=Strict${securePart}`;

  try {
    // The cookie value is base64-encoded JSON — decode with atob before parsing.
    const raw = atob(cookieEntry.split('=').slice(1).join('='));
    const { accessToken, idToken } = JSON.parse(raw) as {
      accessToken: string;
      idToken: string | null;
      expiresAt: number;
    };

    // Sign the Firebase user in via Google credential so Firebase Auth
    // state (useUser hook, etc.) stays in sync.
    if (idToken) {
      const auth = getAuth();
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      await signInWithCredential(auth, credential);
    }

    return accessToken;
  } catch (err) {
    console.error('[auth] Failed to process auth handover:', err);
    return null;
  }
};

/**
 * Signs the user out from both Firebase and the server-side session
 * (which holds the Google OAuth refresh token in an HttpOnly cookie).
 */
export const signOut = async (): Promise<void> => {
  const auth = getAuth();
  await Promise.allSettled([
    // Clear the refresh token from the HttpOnly session cookie
    fetch('/api/auth/signout', { method: 'POST' }),
    // Clear the Firebase identity session
    firebaseSignOut(auth),
  ]);
};
