/**
 * Edge-compatible session utilities using the Web Crypto API (crypto.subtle).
 * No Node.js dependencies — runs on the Cloudflare Edge Runtime.
 *
 * A "session" is a JSON payload HMAC-signed with SESSION_SECRET.
 * The signed value is stored in an HttpOnly cookie so JavaScript can never
 * access the underlying refresh token directly.
 */

const ALGORITHM: HmacKeyGenParams = { name: 'HMAC', hash: 'SHA-256' };

/** Encodes a Uint8Array to URL-safe base64 (no padding). */
function encodeB64Url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/** Decodes a URL-safe base64 string to Uint8Array. */
function decodeB64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    ALGORITHM,
    false,
    ['sign', 'verify'],
  );
}

/**
 * Signs `payload` with HMAC-SHA256 and returns `<payload>.<signature>`.
 * Both parts are URL-safe base64 encoded.
 */
async function sign(payload: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const payloadBytes = new TextEncoder().encode(payload);
  const sigBytes = await crypto.subtle.sign('HMAC', key, payloadBytes);
  return `${payload}.${encodeB64Url(new Uint8Array(sigBytes))}`;
}

/**
 * Verifies a `<payload>.<signature>` string.
 * Returns the original payload string on success, or `null` on tamper/failure.
 */
async function verify(signed: string, secret: string): Promise<string | null> {
  const lastDot = signed.lastIndexOf('.');
  if (lastDot === -1) return null;

  const payload = signed.slice(0, lastDot);
  const sigStr = signed.slice(lastDot + 1);

  try {
    const sigBytes = decodeB64Url(sigStr);
    const key = await importHmacKey(secret);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      new TextEncoder().encode(payload),
    );
    return valid ? payload : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface Session {
  /** Firebase / Google user ID. */
  userId: string;
  /** User's email address — used for API route auth and domain restriction checks. */
  email: string;
  /**
   * Google OAuth refresh token (present on sessions established via the
   * Google OAuth callback). Kept for backwards compatibility; not used by
   * the Cloudflare storage API.
   * @deprecated No longer needed after the Drive→D1 migration.
   */
  refreshToken?: string;
}

/**
 * Serialises and HMAC-signs a Session into a cookie-safe string.
 */
export async function encodeSession(session: Session, secret: string): Promise<string> {
  const json = JSON.stringify(session);
  const b64 = encodeB64Url(new TextEncoder().encode(json));
  return sign(b64, secret);
}

/**
 * Verifies and deserialises a Session cookie value.
 * Returns `null` if the signature is invalid or the payload is malformed.
 */
export async function decodeSession(value: string, secret: string): Promise<Session | null> {
  try {
    const payload = await verify(value, secret);
    if (!payload) return null;
    const json = new TextDecoder().decode(decodeB64Url(payload));
    return JSON.parse(json) as Session;
  } catch {
    return null;
  }
}
