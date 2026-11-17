import { parseAppState } from './storage.ts';
import type { AppState } from './types.ts';

/** A saved state plus the time (epoch ms) of the last edit; 0 means never edited. */
export type Envelope = { readonly state: AppState; readonly updatedAt: number };

export function parseEnvelope(raw: unknown): Envelope | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const { state, updatedAt } = raw as Record<string, unknown>;
  if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt) || updatedAt < 0) return undefined;
  return { state: parseAppState(state), updatedAt };
}

/**
 * Completions from both sides are kept, so a day marked done on one device is never lost.
 * Level and settings come from the side edited last.
 */
export function mergeEnvelopes(a: Envelope, b: Envelope): Envelope {
  const [older, newer] = a.updatedAt > b.updatedAt ? [b, a] : [a, b];
  const state = parseAppState({
    ...newer.state,
    completions: [...older.state.completions, ...newer.state.completions],
  });
  return { state, updatedAt: newer.updatedAt };
}
