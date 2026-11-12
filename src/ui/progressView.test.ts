import { describe, expect, it } from 'vitest';
import { defaultState } from '../core/storage.ts';
import { parseLocalDay, type AppState, type LocalDay } from '../core/types.ts';
import { dayCount, progressView } from './progressView.ts';

const day = (s: string): LocalDay => {
  const parsed = parseLocalDay(s);
  if (!parsed) throw new Error(`bad day ${s}`);
  return parsed;
};
const stateWith = (level: 1 | 2 | 3 | 4 | 5, ...days: string[]): AppState => ({
  ...defaultState(),
  level,
  completions: days.map((d) => ({ date: day(d), level })),
});

describe('progressView', () => {
  const today = day('2026-06-10');

  it('is empty for a new user', () => {
    const view = progressView(defaultState(), today);
    expect(view).toMatchObject({ totalSessions: 0, currentStreak: 0, longestStreak: 0, levelLabel: 'Level 3 of 5' });
    expect(view.days.every((d) => !d.done)).toBe(true);
  });

  it('counts sessions, streaks and level', () => {
    const view = progressView(stateWith(4, '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-09', '2026-06-10'), today);
    expect(view).toMatchObject({ totalSessions: 5, currentStreak: 2, longestStreak: 3, levelLabel: 'Level 4 of 5' });
  });

  it('shows 14 consecutive days oldest first ending today', () => {
    const { days } = progressView(stateWith(3, '2026-06-10', '2026-06-08'), today);
    expect(days).toHaveLength(14);
    expect(days[0]?.date).toBe('2026-05-28');
    expect(days.at(-1)).toMatchObject({ date: '2026-06-10', done: true });
    expect(days.filter((d) => d.done).map((d) => d.date)).toEqual(['2026-06-08', '2026-06-10']);
  });

  it('keeps counting total sessions older than the window', () => {
    const view = progressView(stateWith(3, '2026-01-01', '2026-06-10'), today);
    expect(view.totalSessions).toBe(2);
    expect(view.days.filter((d) => d.done)).toHaveLength(1);
  });

  it('walks calendar days across a month boundary and a DST change', () => {
    const { days } = progressView(stateWith(3), day('2026-03-09'));
    expect(days.map((d) => d.date)).toContain('2026-03-08');
    expect(new Set(days.map((d) => d.date)).size).toBe(14);
    expect(days[0]?.date).toBe('2026-02-24');
  });

  it('labels streaks with a singular day for one', () => {
    const one = progressView(stateWith(3, '2026-06-10'), today);
    expect(one).toMatchObject({ currentStreakLabel: '1 day', longestStreakLabel: '1 day' });
    const none = progressView(defaultState(), today);
    expect(none).toMatchObject({ currentStreakLabel: '0 days', longestStreakLabel: '0 days' });
  });
});

describe('dayCount', () => {
  it('pluralises every count except one', () => {
    expect([0, 1, 2, 11, 100].map(dayCount)).toEqual(['0 days', '1 day', '2 days', '11 days', '100 days']);
  });
});
