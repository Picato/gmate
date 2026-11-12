import { describe, expect, it } from 'vitest';
import {
  LocalStorage,
  MemoryStorage,
  STORAGE_KEY,
  type KeyValueStore,
  type Storage,
} from './storage.ts';
import { parseLocalDay, parseReminderTime, type AppState } from './types.ts';

const day = (s: string) => {
  const parsed = parseLocalDay(s);
  if (!parsed) throw new Error(`bad day ${s}`);
  return parsed;
};

function fakeStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

const sample: AppState = {
  level: 4,
  completions: [
    { date: day('2026-03-01'), level: 3 },
    { date: day('2026-03-02'), level: 4 },
  ],
  settings: { language: 'vi', reminderTime: parseReminderTime('07:30') },
};

const implementations: [string, () => Storage][] = [
  ['MemoryStorage', () => new MemoryStorage()],
  ['LocalStorage', () => new LocalStorage(fakeStore())],
];

describe.each(implementations)('%s', (_name, make) => {
  it('starts at level 3 with nothing completed', () => {
    const state = make().load();
    expect(state.level).toBe(3);
    expect(state.completions).toEqual([]);
  });

  it('returns what was saved', () => {
    const storage = make();
    storage.save(sample);
    expect(storage.load()).toEqual(sample);
  });
});

describe('LocalStorage on bad data', () => {
  it.each([
    ['corrupt JSON', '{nope'],
    ['a non-object', '42'],
  ])('falls back to defaults for %s', (_label, text) => {
    const state = new LocalStorage(fakeStore({ [STORAGE_KEY]: text })).load();
    expect(state.level).toBe(3);
    expect(state.completions).toEqual([]);
  });

  it('keeps valid fields, drops invalid ones, and keeps one completion per day', () => {
    const text = JSON.stringify({
      level: 9,
      completions: [
        { date: '2026-02-30', level: 3 },
        { date: '2026-03-02', level: 2 },
        { date: '2026-03-02', level: 5 },
        { date: '2026-03-01', level: 3 },
        { date: 'x', level: 3 },
      ],
      settings: { reminderTime: '25:99' },
    });
    const state = new LocalStorage(fakeStore({ [STORAGE_KEY]: text })).load();
    expect(state.level).toBe(3);
    expect(state.completions.map((c) => [c.date, c.level])).toEqual([
      ['2026-03-01', 3],
      ['2026-03-02', 5],
    ]);
    expect(state.settings.reminderTime).toBeUndefined();
  });
});

describe('language setting', () => {
  const load = (settings: unknown) =>
    new LocalStorage(fakeStore({ [STORAGE_KEY]: JSON.stringify({ level: 3, completions: [], settings }) })).load();

  it('defaults to English for new and old data lacking it', () => {
    expect(new LocalStorage(fakeStore()).load().settings.language).toBe('en');
    expect(load({ reminderTime: '07:30' }).settings.language).toBe('en');
  });

  it('falls back to English for junk and keeps a valid choice', () => {
    expect(load({ language: 'fr' }).settings.language).toBe('en');
    expect(load({ language: 42 }).settings.language).toBe('en');
    expect(load({ language: 'vi' }).settings.language).toBe('vi');
  });
});

describe('ratings', () => {
  it('round-trips a rating through LocalStorage', () => {
    const storage = new LocalStorage(fakeStore());
    const rated: AppState = {
      ...sample,
      completions: [{ date: day('2026-03-01'), level: 3, rating: 'hard' }],
    };
    storage.save(rated);
    expect(storage.load().completions).toEqual(rated.completions);
  });

  it('loads old data without ratings and drops an invalid rating', () => {
    const text = JSON.stringify({
      level: 3,
      completions: [
        { date: '2026-03-01', level: 3 },
        { date: '2026-03-02', level: 3, rating: 'meh' },
      ],
    });
    const { completions } = new LocalStorage(fakeStore({ [STORAGE_KEY]: text })).load();
    expect(completions.map((c) => c.rating)).toEqual([undefined, undefined]);
  });
});

describe('parseLocalDay', () => {
  it.each(['2026-02-30', '2026-13-01', '26-01-01', '2026-1-1', ''])('rejects %j', (raw) => {
    expect(parseLocalDay(raw)).toBeUndefined();
  });

  it('accepts a real leap day', () => {
    expect(parseLocalDay('2028-02-29')).toBe('2028-02-29');
  });
});
