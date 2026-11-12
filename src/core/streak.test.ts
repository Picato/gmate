import { describe, expect, it } from 'vitest';
import { addDays, currentStreak, localDay, longestStreak } from './streak.ts';
import { parseLocalDay, type Completion, type LocalDay } from './types.ts';

const day = (s: string): LocalDay => {
  const parsed = parseLocalDay(s);
  if (!parsed) throw new Error(`bad day ${s}`);
  return parsed;
};
const done = (...days: string[]): Completion[] => days.map((d) => ({ date: day(d), level: 3 }));

it('runs under the zone the npm script asked for', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(process.env.TZ);
});

describe('localDay', () => {
  it('formats the local calendar date, not the UTC one', () => {
    expect(localDay(new Date(2026, 5, 9, 23, 30))).toBe('2026-06-09');
    expect(localDay(new Date(2026, 5, 10, 0, 5))).toBe('2026-06-10');
  });

  it('zero-pads month and day', () => {
    expect(localDay(new Date(2026, 0, 3, 8))).toBe('2026-01-03');
  });
});

describe('addDays', () => {
  it('crosses month and year boundaries and leap days', () => {
    expect(addDays(day('2026-12-31'), 1)).toBe('2027-01-01');
    expect(addDays(day('2028-03-01'), -1)).toBe('2028-02-29');
    expect(addDays(day('2026-03-01'), -1)).toBe('2026-02-28');
  });

  it.each([
    ['LA fall-back', '2026-10-25', '2026-11-10'],
    ['LA spring-forward', '2026-03-03', '2026-03-20'],
    ['Sydney spring-forward', '2026-09-28', '2026-10-12'],
    ['Sydney fall-back', '2026-03-30', '2026-04-12'],
  ])('%s: stepping one day at a time lands on every calendar day once', (_name, from, to) => {
    const spanDays = (Date.UTC(...ymd(to)) - Date.UTC(...ymd(from))) / 86_400_000;
    const seen = walk(day(from), spanDays + 1);
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen.at(-1)).toBe(to);
    expect(seen).toEqual([...seen].sort());
  });
});

function ymd(s: string): [number, number, number] {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number];
  return [y, m - 1, d];
}

function walk(from: LocalDay, count: number): LocalDay[] {
  const days: LocalDay[] = [];
  for (let d = from, i = 0; i < count; d = addDays(d, 1), i++) days.push(d);
  return days;
}

describe('currentStreak', () => {
  it('is 0 with no completions', () => {
    expect(currentStreak([], day('2026-06-10'))).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(currentStreak(done('2026-06-08', '2026-06-09', '2026-06-10'), day('2026-06-10'))).toBe(3);
  });

  it('stays alive when today is not yet done but yesterday was', () => {
    expect(currentStreak(done('2026-06-08', '2026-06-09'), day('2026-06-10'))).toBe(2);
  });

  it('is broken when yesterday was missed', () => {
    expect(currentStreak(done('2026-06-08'), day('2026-06-10'))).toBe(0);
  });

  it('stops at the first gap', () => {
    expect(currentStreak(done('2026-06-05', '2026-06-09', '2026-06-10'), day('2026-06-10'))).toBe(2);
  });

  it('counts a duplicated day once', () => {
    expect(currentStreak(done('2026-06-10', '2026-06-10'), day('2026-06-10'))).toBe(1);
  });

  it('gives 3 for practice at 23:30 on three consecutive days', () => {
    const practiced = [9, 10, 11].map((d) => localDay(new Date(2026, 5, d, 23, 30)));
    const completions = practiced.map((date): Completion => ({ date, level: 3 }));
    expect(currentStreak(completions, localDay(new Date(2026, 5, 11, 23, 45)))).toBe(3);
  });

  it('does not skip or repeat a day across the LA fall-back (2026-11-01)', () => {
    const practiced = [
      new Date(2026, 9, 31, 23, 30),
      new Date(2026, 10, 1, 23, 30),
      new Date(2026, 10, 2, 23, 30),
    ];
    const completions = practiced.map((d): Completion => ({ date: localDay(d), level: 3 }));
    expect(completions.map((c) => c.date)).toEqual(['2026-10-31', '2026-11-01', '2026-11-02']);
    expect(currentStreak(completions, day('2026-11-02'))).toBe(3);
    expect(longestStreak(completions)).toBe(3);
  });

  it('survives a month of daily practice spanning a DST change', () => {
    const days = walk(day('2026-10-15'), 32);
    expect(days.at(-1)).toBe('2026-11-15');
    expect(currentStreak(done(...days), day('2026-11-15'))).toBe(days.length);
  });
});

describe('longestStreak', () => {
  it('is 0 with no completions', () => {
    expect(longestStreak([])).toBe(0);
  });

  it('finds the longest run regardless of input order', () => {
    const completions = done('2026-06-10', '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-09');
    expect(longestStreak(completions)).toBe(3);
  });

  it('is not shortened by the current streak being shorter', () => {
    expect(longestStreak(done('2026-06-01', '2026-06-02', '2026-06-03', '2026-06-10'))).toBe(3);
  });
});
