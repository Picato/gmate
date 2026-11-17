import { LocalStorage, type KeyValueStore, type Storage } from './storage.ts';
import { mergeEnvelopes, parseEnvelope, type Envelope } from './sync.ts';
import type { AppState } from './types.ts';

export const SYNC_URL = '/api/state';
export const UPDATED_AT_KEY = 'gmate:updated-at:v1';
const PUSH_DELAY_MS = 2000;

/**
 * localStorage stays the source the UI reads synchronously; every save is also pushed to the
 * server, which merges it with what other devices pushed. Offline or failed syncs are
 * silent: the next save or page load retries.
 */
export class SyncedStorage implements Storage {
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly local: LocalStorage,
    private readonly meta: KeyValueStore,
    private readonly request: typeof fetch,
    private readonly clock: () => number = Date.now,
  ) {}

  load(): AppState {
    return this.local.load();
  }

  save(state: AppState): void {
    this.local.save(state);
    this.meta.setItem(UPDATED_AT_KEY, String(this.clock()));
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.push(), PUSH_DELAY_MS);
  }

  /** Called once before the UI mounts: adopts the merge of local and server state. */
  async pull(): Promise<void> {
    try {
      const response = await this.request(SYNC_URL);
      if (!response.ok && response.status !== 204) return;
      const remote = response.status === 204 ? undefined : parseEnvelope(await response.json());
      const mine = this.envelope();
      if (!remote) {
        if (mine.updatedAt > 0) await this.push();
        return;
      }
      const merged = mergeEnvelopes(mine, remote);
      this.adopt(merged);
      if (JSON.stringify(merged) !== JSON.stringify(remote)) await this.push();
    } catch {
      // Offline or unreachable: keep working from local state.
    }
  }

  /** Sends pending edits now; used when the page is being hidden. */
  flush(): void {
    if (this.timer === undefined) return;
    clearTimeout(this.timer);
    this.timer = undefined;
    void this.push();
  }

  private envelope(): Envelope {
    return { state: this.local.load(), updatedAt: Number(this.meta.getItem(UPDATED_AT_KEY)) || 0 };
  }

  private adopt({ state, updatedAt }: Envelope): void {
    this.local.save(state);
    this.meta.setItem(UPDATED_AT_KEY, String(updatedAt));
  }

  private async push(): Promise<void> {
    this.timer = undefined;
    try {
      const response = await this.request(SYNC_URL, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(this.envelope()),
        keepalive: true,
      });
      if (!response.ok) return;
      const merged = parseEnvelope(await response.json());
      if (merged) this.adopt(merged);
    } catch {
      // Retried on the next save or load.
    }
  }
}
