import { describe, expect, it } from 'vitest';
import { CATALOG } from '../data/catalog.ts';
import { defaultState } from '../core/storage.ts';
import { parseLocalDay, type AppState, type Exercise, type LocalDay } from '../core/types.ts';
import { markDone, sessionView } from './sessionView.ts';

const day = (s: string): LocalDay => {
  const parsed = parseLocalDay(s);
  if (!parsed) throw new Error(`bad day ${s}`);
  return parsed;
};
const stateWith = (...days: string[]): AppState => ({
  ...defaultState(),
  completions: days.map((d) => ({ date: day(d), level: 3 })),
});
const today = day('2026-06-10');

describe('sessionView', () => {
  it('shows a 30 minute plan whose item minutes add up to the total', () => {
    const view = sessionView(defaultState(), today, CATALOG);
    expect(view.totalMinutes).toBe(30);
    expect(view.totalLabel).toBe('Total 30 min');
    const sum = view.items.map((i) => Number.parseInt(i.minutesLabel, 10)).reduce((a, b) => a + b, 0);
    expect(sum).toBe(30);
    expect(view.levelLabel).toBe('Level 3 of 5');
  });

  it('starts with no streak and not done', () => {
    const view = sessionView(defaultState(), today, CATALOG);
    expect(view).toMatchObject({ currentStreak: 0, longestStreak: 0, done: false });
  });

  it('reports streaks and done from completions', () => {
    const view = sessionView(stateWith('2026-06-08', '2026-06-09', '2026-06-10'), today, CATALOG);
    expect(view).toMatchObject({ currentStreak: 3, longestStreak: 3, done: true });
  });

  it('keeps a streak alive through yesterday while today is not done', () => {
    const view = sessionView(stateWith('2026-06-08', '2026-06-09'), today, CATALOG);
    expect(view).toMatchObject({ currentStreak: 2, done: false });
  });

  it('keeps the same plan for the day before and after marking done', () => {
    const before = sessionView(defaultState(), today, CATALOG);
    const after = sessionView(markDone(defaultState(), today), today, CATALOG);
    expect(after.items).toEqual(before.items);
  });

  it('embeds a nocookie player for a lesson with a videoId and nothing for other items', () => {
    const lesson: Exercise = {
      kind: 'lesson', id: 'l', minutes: 30, minLevel: 3, maxLevel: 3, title: 'T', videoId: 'abc_123',
    };
    const view = sessionView(defaultState(), today, [lesson]);
    expect(view.items).toHaveLength(1);
    expect(view.items[0]?.media).toEqual({
      type: 'video',
      embedUrl: 'https://www.youtube-nocookie.com/embed/abc_123',
    });
    const mixed = sessionView(defaultState(), today, CATALOG);
    expect(mixed.items.filter((i) => i.kind !== 'lesson').every((i) => i.media === undefined)).toBe(true);
  });

  it('gives a lesson without a videoId a message and a search link instead of a player', () => {
    const lesson: Exercise = {
      kind: 'lesson', id: 'l', minutes: 30, minLevel: 3, maxLevel: 3, title: 'Blues & bends', videoId: undefined,
    };
    const media = sessionView(defaultState(), today, [lesson]).items[0]?.media;
    expect(media?.type).toBe('link');
    if (media?.type === 'link') {
      expect(media.message).not.toBe('');
      expect(media.href).toBe(
        'https://www.youtube.com/results?search_query=Blues%20%26%20bends%20guitar%20lesson',
      );
    }
  });

  it('percent-encodes a hostile videoId so it cannot break out of the URL', () => {
    const lesson: Exercise = {
      kind: 'lesson', id: 'l', minutes: 30, minLevel: 3, maxLevel: 3, title: 'T', videoId: 'x"?y=1/../',
    };
    const media = sessionView(defaultState(), today, [lesson]).items[0]?.media;
    expect(media?.type === 'video' && media.embedUrl.includes('"')).toBe(false);
    expect(media?.type === 'video' && media.embedUrl.split('/embed/')[1]?.includes('/')).toBe(false);
  });
});

describe('markDone', () => {
  it('records a completion for today at the current level', () => {
    const next = markDone({ ...defaultState(), level: 4 }, today);
    expect(next.completions).toEqual([{ date: today, level: 4 }]);
  });

  it('is idempotent: marking twice leaves one completion', () => {
    const once = markDone(defaultState(), today);
    const twice = markDone(once, today);
    expect(twice.completions).toHaveLength(1);
    expect(twice).toEqual(once);
  });

  it('does not mutate the state it was given', () => {
    const start = defaultState();
    markDone(start, today);
    expect(start.completions).toEqual([]);
  });

  it('bumps the displayed streak immediately', () => {
    const before = stateWith('2026-06-08', '2026-06-09');
    const after = sessionView(markDone(before, today), today, CATALOG);
    expect(after).toMatchObject({ currentStreak: 3, longestStreak: 3, done: true });
  });
});
