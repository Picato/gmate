import { mergeEnvelopes, parseEnvelope } from '../src/core/sync.ts';

export interface StateStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

const KEY = 'state';
const MAX_BODY_BYTES = 64 * 1024;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

async function stored(store: StateStore) {
  const text = await store.get(KEY);
  return text === null ? undefined : parseEnvelope(JSON.parse(text));
}

export async function handleState(request: Request, store: StateStore): Promise<Response> {
  if (request.method === 'GET') {
    const current = await stored(store);
    return current ? json(current) : new Response(null, { status: 204 });
  }

  if (request.method === 'PUT') {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json({ error: 'too large' }, 413);
    let incoming;
    try {
      incoming = parseEnvelope(JSON.parse(text));
    } catch {
      incoming = undefined;
    }
    if (!incoming) return json({ error: 'invalid body' }, 400);
    const current = await stored(store);
    const merged = current ? mergeEnvelopes(current, incoming) : incoming;
    await store.put(KEY, JSON.stringify(merged));
    return json(merged);
  }

  return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, PUT' } });
}
