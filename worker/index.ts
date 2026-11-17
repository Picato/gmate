import {
  LOGIN_TTL_MS,
  RENEW_AFTER_MS,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  normaliseEmail,
  readCookie,
  sessionCookie,
  signToken,
  verifyToken,
} from './auth.ts';
import { loginPage } from './loginPage.ts';
import { sendLoginLink, type MailEnv } from './mail.ts';
import { handleState, type StateStore } from './state.ts';

export interface Env extends MailEnv {
  readonly STATE: StateStore;
  readonly ASSETS: { fetch(request: Request): Promise<Response> };
  /** Random string used to sign login links and sessions. */
  readonly SESSION_SECRET?: string | undefined;
  /** The one email address allowed to log in. */
  readonly ALLOWED_EMAIL?: string | undefined;
}

/** Fetched by the browser without cookies (manifest, icons) or by the login page itself. */
const PUBLIC_PATHS = new Set([
  '/favicon.svg',
  '/gmate-logo.svg',
  '/gmate-logo-dark.svg',
  '/site.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
]);
const COOLDOWN_KEY = 'login-cooldown';
const COOLDOWN_SECONDS = 120;

const text = (body: string, status: number): Response => new Response(body, { status, headers: { 'cache-control': 'no-store' } });

function withCookie(response: Response, cookie: string): Response {
  const copy = new Response(response.body, response);
  copy.headers.append('set-cookie', cookie);
  return copy;
}

async function requestLink(request: Request, env: Env, secret: string, allowed: string): Promise<Response> {
  let email: unknown;
  try {
    email = ((await request.json()) as { email?: unknown }).email;
  } catch {
    return text('Bad request', 400);
  }
  if (typeof email !== 'string' || email.length > 254) return text('Bad request', 400);

  // Same answer for every address, so the page never reveals which one is allowed.
  const ok = new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  if (normaliseEmail(email) !== allowed) return ok;
  if ((await env.STATE.get(COOLDOWN_KEY)) !== null) return ok;
  await env.STATE.put(COOLDOWN_KEY, '1', { expirationTtl: COOLDOWN_SECONDS });

  const token = await signToken(secret, 'login', allowed, Date.now() + LOGIN_TTL_MS);
  const link = `${new URL(request.url).origin}/auth/verify?t=${encodeURIComponent(token)}`;
  await sendLoginLink(env, allowed, link);
  return ok;
}

async function verifyLink(url: URL, secret: string, allowed: string): Promise<Response> {
  const verified = await verifyToken(secret, 'login', url.searchParams.get('t') ?? '', Date.now());
  if (!verified || verified.email !== allowed) {
    return new Response(null, { status: 302, headers: { location: '/?login=invalid', 'cache-control': 'no-store' } });
  }
  const session = await signToken(secret, 'session', allowed, Date.now() + SESSION_TTL_MS);
  const response = new Response(null, {
    status: 302,
    headers: { location: '/', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' },
  });
  response.headers.append('set-cookie', sessionCookie(session, SESSION_TTL_MS / 1000));
  return response;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const secret = env.SESSION_SECRET;
    const allowed = env.ALLOWED_EMAIL ? normaliseEmail(env.ALLOWED_EMAIL) : undefined;
    if (!secret || !allowed) return text('Server is not configured', 500);

    if (url.pathname === '/auth/request' && request.method === 'POST') return requestLink(request, env, secret, allowed);
    if (url.pathname === '/auth/verify' && request.method === 'GET') return verifyLink(url, secret, allowed);
    if (url.pathname === '/auth/logout' && request.method === 'POST') {
      return withCookie(text('Logged out', 200), sessionCookie('', 0));
    }
    if (PUBLIC_PATHS.has(url.pathname)) return env.ASSETS.fetch(request);

    const token = readCookie(request.headers.get('cookie'), SESSION_COOKIE);
    const session = token ? await verifyToken(secret, 'session', token, Date.now()) : undefined;
    if (!session || session.email !== allowed) {
      const wantsPage = request.method === 'GET' && (request.headers.get('accept') ?? '').includes('text/html');
      return wantsPage ? loginPage() : text('Unauthorized', 401);
    }

    const response = url.pathname === '/api/state' ? await handleState(request, env.STATE) : await env.ASSETS.fetch(request);
    if (session.expiresAt - Date.now() > SESSION_TTL_MS - RENEW_AFTER_MS) return response;
    const renewed = await signToken(secret, 'session', allowed, Date.now() + SESSION_TTL_MS);
    return withCookie(response, sessionCookie(renewed, SESSION_TTL_MS / 1000));
  },
};
