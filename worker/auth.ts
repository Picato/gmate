/** Stateless signed tokens: `base64url(payload).base64url(HMAC-SHA256)`. */
export type TokenKind = 'login' | 'session';

export const LOGIN_TTL_MS = 15 * 60 * 1000;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** A session is re-issued once it is a day old, so an active user never gets logged out. */
export const RENEW_AFTER_MS = 24 * 60 * 60 * 1000;
export const SESSION_COOKIE = 'gmate_session';

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

const hmacKey = (secret: string) =>
  crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export const normaliseEmail = (email: string): string => email.trim().toLowerCase();

export async function signToken(secret: string, kind: TokenKind, email: string, expiresAt: number): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ k: kind, e: email, x: expiresAt })));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export type VerifiedToken = { readonly email: string; readonly expiresAt: number };

export async function verifyToken(
  secret: string,
  kind: TokenKind,
  token: string,
  now: number,
): Promise<VerifiedToken | undefined> {
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) return undefined;
  try {
    const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromBase64Url(signature), encoder.encode(payload));
    if (!valid) return undefined;
    const claims: unknown = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (typeof claims !== 'object' || claims === null) return undefined;
    const { k, e, x } = claims as Record<string, unknown>;
    if (k !== kind || typeof e !== 'string' || typeof x !== 'number' || x <= now) return undefined;
    return { email: e, expiresAt: x };
  } catch {
    return undefined;
  }
}

export function readCookie(header: string | null, name: string): string | undefined {
  for (const part of (header ?? '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return undefined;
}

export const sessionCookie = (token: string, maxAgeSeconds: number): string =>
  `${SESSION_COOKIE}=${token}; Max-Age=${maxAgeSeconds}; Path=/; HttpOnly; Secure; SameSite=Lax`;
