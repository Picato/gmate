import { describe, expect, it } from 'vitest';
import { defaultState } from './storage.ts';
import { mergeEnvelopes, parseEnvelope } from './sync.ts';
import type { AppState, LocalDay } from './types.ts';

const day = (d: string) => d as LocalDay;
const stateWith = (level: 1 | 2 | 3, days: string[], language: 'en' | 'vi' = 'en'): AppState => ({
  ...defaultState(),
  level,
  completions: days.map((d) => ({ date: day(d), session: 1, level })),
  settings: { language },
});

describe('mergeEnvelopes', () => {
  it('keeps completions from both devices', () => {
    const merged = mergeEnvelopes(
      { state: stateWith(1, ['2026-11-01']), updatedAt: 10 },
      { state: stateWith(1, ['2026-11-02']), updatedAt: 20 },
    );
    expect(merged.state.completions.map((c) => c.date)).toEqual(['2026-11-01', '2026-11-02']);
  });

  it('takes level and settings from the newer side, whichever argument order', () => {
    const old = { state: stateWith(1, [], 'en'), updatedAt: 10 };
    const recent = { state: stateWith(3, [], 'vi'), updatedAt: 20 };
    for (const merged of [mergeEnvelopes(old, recent), mergeEnvelopes(recent, old)]) {
      expect(merged.state.level).toBe(3);
      expect(merged.state.settings.language).toBe('vi');
      expect(merged.updatedAt).toBe(20);
    }
  });

  it('prefers the newer side when both completed the same day', () => {
    const merged = mergeEnvelopes(
      { state: { ...defaultState(), completions: [{ date: day('2026-11-01'), session: 1, level: 1, rating: 'easy' }] }, updatedAt: 10 },
      { state: { ...defaultState(), completions: [{ date: day('2026-11-01'), session: 1, level: 2, rating: 'hard' }] }, updatedAt: 20 },
    );
    expect(merged.state.completions).toEqual([{ date: '2026-11-01', session: 1, level: 2, rating: 'hard' }]);
  });
});

describe('parseEnvelope', () => {
  it('rejects non-objects and bad timestamps', () => {
    expect(parseEnvelope(null)).toBeUndefined();
    expect(parseEnvelope({ state: {}, updatedAt: 'x' })).toBeUndefined();
    expect(parseEnvelope({ state: {}, updatedAt: -1 })).toBeUndefined();
  });

  it('sanitises the state', () => {
    expect(parseEnvelope({ state: 'junk', updatedAt: 5 })).toEqual({ state: defaultState(), updatedAt: 5 });
  });
});
