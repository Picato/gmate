import { describe, expect, it } from 'vitest';
import { CATALOG } from '../data/catalog.ts';
import { defaultState } from '../core/storage.ts';
import { parseLocalDay, parseReminderTime, type AppState, type Exercise, type Language, type LocalDay, type Rating } from '../core/types.ts';
import { currentSession, levelChangeMessage, markDone, sessionView, setLanguage } from './sessionView.ts';
import { progressView } from './progressView.ts';

const STUB_GUIDE = { goal: 'g', steps: ['s'], tips: [], check: 'c' };

const day = (s: string): LocalDay => {
  const parsed = parseLocalDay(s);
  if (!parsed) throw new Error(`bad day ${s}`);
  return parsed;
};
const stateWith = (...days: string[]): AppState => ({
  ...defaultState(),
  completions: days.map((d) => ({ date: day(d), session: 1, level: 3 })),
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
    const after = sessionView(markDone(defaultState(), today, 1), today, CATALOG);
    expect(after.items).toEqual(before.items);
  });

  it('embeds a nocookie player for a lesson with a video id and nothing for other items', () => {
    const lesson: Exercise = {
      kind: 'lesson', id: 'l', minutes: 30, minLevel: 3, maxLevel: 3, title: 'T', guide: STUB_GUIDE, videoIds: { en: 'abc_123' },
    };
    const view = sessionView(defaultState(), today, [lesson]);
    expect(view.items).toHaveLength(1);
    expect(view.items[0]?.media).toEqual({
      type: 'video',
      embedUrl: 'https://www.youtube-nocookie.com/embed/abc_123',
      language: 'en',
      fellBack: false,
    });
    const mixed = sessionView(defaultState(), today, CATALOG);
    expect(mixed.items.filter((i) => i.kind !== 'lesson').every((i) => i.media === undefined)).toBe(true);
  });

  it('gives a lesson without a video id a message and a search link instead of a player', () => {
    const lesson: Exercise = {
      kind: 'lesson', id: 'l', minutes: 30, minLevel: 3, maxLevel: 3, title: 'Blues & bends', guide: STUB_GUIDE, videoIds: {},
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

  it('percent-encodes a hostile video id so it cannot break out of the URL', () => {
    const lesson: Exercise = {
      kind: 'lesson', id: 'l', minutes: 30, minLevel: 3, maxLevel: 3, title: 'T', guide: STUB_GUIDE, videoIds: { en: 'x"?y=1/../' },
    };
    const media = sessionView(defaultState(), today, [lesson]).items[0]?.media;
    expect(media?.type === 'video' && media.embedUrl.includes('"')).toBe(false);
    expect(media?.type === 'video' && media.embedUrl.split('/embed/')[1]?.includes('/')).toBe(false);
  });
});

describe('sessionView language', () => {
  const both: Exercise = {
    kind: 'lesson', id: 'l', minutes: 30, minLevel: 3, maxLevel: 3, title: 'T', guide: STUB_GUIDE,
    videoIds: { en: 'enenenenen1', vi: 'vivivivivi1' },
  };
  const englishOnly: Exercise = { ...both, videoIds: { en: 'enenenenen1' } };
  const inLanguage = (language: Language): AppState => ({ ...defaultState(), settings: { language } });
  const mediaOf = (language: Language, lesson: Exercise) =>
    sessionView(inLanguage(language), today, [lesson]).items[0]?.media;

  it('embeds the Vietnamese video when vi is chosen', () => {
    expect(mediaOf('vi', both)).toMatchObject({
      type: 'video', embedUrl: expect.stringContaining('vivivivivi1'), language: 'vi', fellBack: false,
    });
  });

  it('embeds the English video when en is chosen', () => {
    expect(mediaOf('en', both)).toMatchObject({
      type: 'video', embedUrl: expect.stringContaining('enenenenen1'), language: 'en', fellBack: false,
    });
  });

  it('shows English and flags the fallback when vi is chosen but missing', () => {
    expect(mediaOf('vi', englishOnly)).toMatchObject({
      type: 'video', embedUrl: expect.stringContaining('enenenenen1'), language: 'en', fellBack: true,
    });
  });

  it('words the fallback note for the missing language and the one shown', () => {
    expect(mediaOf('vi', englishOnly)).toMatchObject({
      fallbackNote: 'No Vietnamese video for this lesson yet, showing English',
    });
  });

  it('has no note when the chosen language is available', () => {
    expect(mediaOf('vi', both)).toMatchObject({ fallbackNote: undefined });
    expect(mediaOf('en', englishOnly)).toMatchObject({ fallbackNote: undefined });
  });

  it('plays English for a fresh state', () => {
    expect(sessionView(defaultState(), today, [both]).items[0]?.media).toMatchObject({
      language: 'en', fellBack: false,
    });
  });
});

describe('setLanguage', () => {
  it('returns a state with the chosen language and leaves the rest alone', () => {
    const before: AppState = { ...stateWith('2026-06-09'), level: 4 };
    const after = setLanguage(before, 'vi');
    expect(after.settings.language).toBe('vi');
    expect({ ...after, settings: before.settings }).toEqual(before);
  });

  it('keeps other settings', () => {
    const before = { ...defaultState(), settings: { language: 'en', reminderTime: parseReminderTime('07:30') } } as const;
    expect(setLanguage(before, 'vi').settings.reminderTime).toBe('07:30');
  });

  it('is idempotent and returns the same state when nothing changes', () => {
    const vi = setLanguage(defaultState(), 'vi');
    expect(setLanguage(vi, 'vi')).toBe(vi);
    expect(setLanguage(defaultState(), 'en')).toEqual(defaultState());
  });

  it('does not mutate the state it was given', () => {
    const before = defaultState();
    const snapshot = structuredClone(before);
    setLanguage(before, 'vi');
    expect(before).toEqual(snapshot);
  });
});

describe('markDone', () => {
  it('records a completion for today at the current level', () => {
    const next = markDone({ ...defaultState(), level: 4 }, today, 1);
    expect(next.completions).toEqual([{ date: today, session: 1, level: 4 }]);
  });

  it('is idempotent: marking twice leaves one completion', () => {
    const once = markDone(defaultState(), today, 1);
    const twice = markDone(once, today, 1);
    expect(twice.completions).toHaveLength(1);
    expect(twice).toEqual(once);
  });

  it('does not mutate the state it was given', () => {
    const start = defaultState();
    markDone(start, today, 1);
    expect(start.completions).toEqual([]);
  });

  it('bumps the displayed streak immediately', () => {
    const before = stateWith('2026-06-08', '2026-06-09');
    const after = sessionView(markDone(before, today, 1), today, CATALOG);
    expect(after).toMatchObject({ currentStreak: 3, longestStreak: 3, done: true });
  });
});

describe('markDone with a rating', () => {
  const ratedDays = (rating: Rating, ...days: string[]): AppState => ({
    ...defaultState(),
    completions: days.map((d) => ({ date: day(d), session: 1, level: 3, rating })),
  });

  it('stores the rating on the completion', () => {
    const next = markDone(defaultState(), today, 1, 'right');
    expect(next.completions).toEqual([{ date: today, session: 1, level: 3, rating: 'right' }]);
    expect(next.level).toBe(3);
  });

  it('promotes after three easy sessions in a row', () => {
    const next = markDone(ratedDays('easy', '2026-06-08', '2026-06-09'), today, 1, 'easy');
    expect(next.level).toBe(4);
  });

  it('does not promote after two easy sessions', () => {
    expect(markDone(ratedDays('easy', '2026-06-09'), today, 1, 'easy').level).toBe(3);
  });

  it('demotes after two hard sessions in a row', () => {
    const next = markDone(ratedDays('hard', '2026-06-09'), today, 1, 'hard');
    expect(next.level).toBe(2);
  });

  it('ignores completions that carry no rating', () => {
    const next = markDone(stateWith('2026-06-08', '2026-06-09'), today, 1, 'easy');
    expect(next.level).toBe(3);
  });

  it('keeps the level when done without a rating', () => {
    expect(markDone(ratedDays('easy', '2026-06-08', '2026-06-09'), today, 1).level).toBe(3);
  });

  it('stays idempotent: a second rating on the same day changes nothing', () => {
    const once = markDone(ratedDays('easy', '2026-06-08', '2026-06-09'), today, 1, 'easy');
    expect(markDone(once, today, 1, 'hard')).toBe(once);
  });

  it('keeps today plan fixed after the level change and applies the new level tomorrow', () => {
    const before = sessionView(ratedDays('easy', '2026-06-08', '2026-06-09'), today, CATALOG);
    const after = markDone(ratedDays('easy', '2026-06-08', '2026-06-09'), today, 1, 'easy');
    expect(sessionView(after, today, CATALOG).items).toEqual(before.items);
    expect(sessionView(after, today, CATALOG).levelLabel).toBe('Level 3 of 5');
    expect(sessionView(after, day('2026-06-11'), CATALOG).levelLabel).toBe('Level 4 of 5');
  });
});

describe('levelChangeMessage', () => {
  it.each([
    [3, 4, 'Moving up to level 4'],
    [3, 2, 'Moving down to level 2'],
    [3, 3, ''],
  ] as const)('from %i to %i says %j', (from, to, message) => {
    expect(levelChangeMessage(from, to)).toBe(message);
  });
});

describe('several sessions in one day', () => {
  const finishFirst = () => markDone(defaultState(), today, 1, 'right');

  it('opens on the finished session, then offers the next one', () => {
    const state = finishFirst();
    expect(currentSession(defaultState(), today)).toBe(1);
    expect(currentSession(state, today)).toBe(1);
    expect(sessionView(state, today, CATALOG, 1)).toMatchObject({ done: true, title: "Today's session" });
    expect(sessionView(state, today, CATALOG, 2)).toMatchObject({ done: false, title: 'Session 2 today', session: 2 });
  });

  it('plans new material for the next session', () => {
    const state = finishFirst();
    const first = sessionView(state, today, CATALOG, 1).items.map((i) => i.id);
    const second = sessionView(state, today, CATALOG, 2).items.map((i) => i.id);
    expect(second).not.toEqual(first);
  });

  it('records the second session without a second streak day', () => {
    const state = markDone(finishFirst(), today, 2, 'right');
    expect(state.completions.map((c) => c.session)).toEqual([1, 2]);
    expect(sessionView(state, today, CATALOG, 2)).toMatchObject({ done: true, currentStreak: 1 });
    expect(currentSession(state, today)).toBe(2);
  });

  it('is idempotent per session and refuses to skip or redo one', () => {
    const once = finishFirst();
    expect(markDone(once, today, 1, 'hard')).toBe(once);
    expect(markDone(once, today, 3, 'hard')).toBe(once);
  });

  it('applies a level change to the very next session', () => {
    let state: AppState = {
      ...defaultState(),
      completions: ['2026-06-08', '2026-06-09'].map((d) => ({ date: day(d), session: 1, level: 3, rating: 'easy' as const })),
    };
    state = markDone(state, today, 1, 'easy');
    expect(state.level).toBe(4);
    expect(sessionView(state, today, CATALOG, 1).levelLabel).toBe('Level 3 of 5');
    expect(sessionView(state, today, CATALOG, 2).levelLabel).toBe('Level 4 of 5');
  });

  it('counts every session in the total but a day once in the streak', () => {
    const state = markDone(finishFirst(), today, 2, 'easy');
    expect(progressView(state, today)).toMatchObject({ totalSessions: 2, currentStreak: 1 });
  });
});
