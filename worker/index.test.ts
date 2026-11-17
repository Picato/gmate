import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_COOKIE, SESSION_TTL_MS, signToken, verifyToken } from './auth.ts';
import worker, { type Env } from './index.ts';

const SECRET = 'test-secret';
const EMAIL = 'me@example.com';

function makeEnv(overrides: Partial<Env> = {}): Env & { kv: Map<string, string> } {
  const kv = new Map<string, string>();
  return {
    kv,
    STATE: {
      get: async (key) => kv.get(key) ?? null,
      put: async (key, value) => void kv.set(key, value),
    },
    ASSETS: { fetch: async () => new Response('<app>', { headers: { 'content-type': 'text/html' } }) },
    SESSION_SECRET: SECRET,
    ALLOWED_EMAIL: EMAIL,
    RESEND_API_KEY: 'key',
    ...overrides,
  };
}

const page = (path: string, cookie?: string) =>
  new Request(`https://gmate.test${path}`, { headers: { accept: 'text/html', ...(cookie ? { cookie } : {}) } });
const requestLink = (email: string) =>
  new Request('https://gmate.test/auth/request', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });
const sessionFor = async (expiresAt = Date.now() + SESSION_TTL_MS) =>
  `${SESSION_COOKIE}=${await signToken(SECRET, 'session', EMAIL, expiresAt)}`;

let mail: ReturnType<typeof vi.fn>;
beforeEach(() => {
  mail = vi.fn(async () => new Response('{}'));
  vi.stubGlobal('fetch', mail);
});
afterEach(() => vi.unstubAllGlobals());

describe('access control', () => {
  it('shows the login page to anonymous page loads', async () => {
    const response = await worker.fetch(page('/'), makeEnv());
    expect(await response.text()).toContain('Email me a link');
  });

  it('rejects anonymous API calls', async () => {
    const response = await worker.fetch(new Request('https://gmate.test/api/state'), makeEnv());
    expect(response.status).toBe(401);
  });

  it('serves the app and API with a valid session', async () => {
    const cookie = await sessionFor();
    const env = makeEnv();
    expect(await (await worker.fetch(page('/', cookie), env)).text()).toBe('<app>');
    const api = await worker.fetch(new Request('https://gmate.test/api/state', { headers: { cookie } }), env);
    expect(api.status).toBe(204);
  });

  it('rejects a login link used as a session, and a session for another email', async () => {
    const asLogin = `${SESSION_COOKIE}=${await signToken(SECRET, 'login', EMAIL, Date.now() + 60_000)}`;
    expect((await worker.fetch(page('/', asLogin), makeEnv())).headers.get('content-type')).toContain('html');
    expect(await (await worker.fetch(page('/', asLogin), makeEnv())).text()).not.toBe('<app>');
    const other = `${SESSION_COOKIE}=${await signToken(SECRET, 'session', 'x@example.com', Date.now() + 60_000)}`;
    expect(await (await worker.fetch(page('/', other), makeEnv())).text()).not.toBe('<app>');
  });

  it('fails closed when secrets are missing', async () => {
    const response = await worker.fetch(page('/'), makeEnv({ SESSION_SECRET: undefined }));
    expect(response.status).toBe(500);
  });

  it('lets the browser fetch the manifest without a cookie', async () => {
    const response = await worker.fetch(new Request('https://gmate.test/site.webmanifest'), makeEnv());
    expect(response.status).toBe(200);
  });
});

describe('local mode', () => {
  it('skips login when AUTH_DISABLED is true', async () => {
    const env = makeEnv({ AUTH_DISABLED: 'true', SESSION_SECRET: undefined, ALLOWED_EMAIL: undefined });
    expect(await (await worker.fetch(page('/'), env)).text()).toBe('<app>');
    expect((await worker.fetch(new Request('https://gmate.test/api/state'), env)).status).toBe(204);
  });

  it.each([undefined, 'false', '1', 'TRUE'])('still requires login when AUTH_DISABLED is %s', async (value) => {
    const response = await worker.fetch(page('/'), makeEnv({ AUTH_DISABLED: value }));
    expect(await response.text()).toContain('Email me a link');
  });
});

describe('login link', () => {
  it('emails a link to the allowed address, case-insensitively', async () => {
    await worker.fetch(requestLink(' Me@Example.com '), makeEnv());
    expect(mail).toHaveBeenCalledOnce();
    const body = JSON.parse((mail.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.to).toBe(EMAIL);
    expect(body.text).toContain('https://gmate.test/auth/verify?t=');
  });

  it('answers the same but sends nothing for other addresses', async () => {
    const response = await worker.fetch(requestLink('stranger@example.com'), makeEnv());
    expect(response.status).toBe(200);
    expect(mail).not.toHaveBeenCalled();
  });

  it('sends at most one email per cooldown', async () => {
    const env = makeEnv();
    await worker.fetch(requestLink(EMAIL), env);
    await worker.fetch(requestLink(EMAIL), env);
    expect(mail).toHaveBeenCalledOnce();
  });

  it('turns a valid link into a session cookie and redirects home', async () => {
    const token = await signToken(SECRET, 'login', EMAIL, Date.now() + 60_000);
    const response = await worker.fetch(page(`/auth/verify?t=${encodeURIComponent(token)}`), makeEnv());
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/');
    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/HttpOnly; Secure; SameSite=Lax/);
    const value = cookie.split(';')[0]?.split('=').slice(1).join('=') ?? '';
    expect((await verifyToken(SECRET, 'session', value, Date.now()))?.email).toBe(EMAIL);
  });

  it.each([
    ['expired', () => signToken(SECRET, 'login', EMAIL, Date.now() - 1)],
    ['a session token', () => signToken(SECRET, 'session', EMAIL, Date.now() + 60_000)],
    ['signed with another secret', () => signToken('other', 'login', EMAIL, Date.now() + 60_000)],
    ['for another email', () => signToken(SECRET, 'login', 'x@example.com', Date.now() + 60_000)],
  ])('refuses a link that is %s', async (_name, make) => {
    const response = await worker.fetch(page(`/auth/verify?t=${encodeURIComponent(await make())}`), makeEnv());
    expect(response.headers.get('location')).toBe('/?login=invalid');
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});

describe('session renewal', () => {
  it('re-issues the cookie once the session is a day old', async () => {
    const cookie = await sessionFor(Date.now() + SESSION_TTL_MS - 2 * 24 * 60 * 60 * 1000);
    const response = await worker.fetch(page('/', cookie), makeEnv());
    expect(response.headers.get('set-cookie')).toContain(`${SESSION_COOKIE}=`);
  });

  it('leaves a fresh session alone', async () => {
    const response = await worker.fetch(page('/', await sessionFor()), makeEnv());
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});
