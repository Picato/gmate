import { describe, expect, it } from 'vitest';
import { needsBanner, shouldRemind } from './reminder.ts';
import { localDay } from './streak.ts';
import {
  parseLocalDay,
  parseReminderTime,
  type Completion,
  type LocalDay,
  type ReminderTime,
} from './types.ts';

const day = (s: string): LocalDay => {
  const parsed = parseLocalDay(s);
  if (!parsed) throw new Error(`bad day ${s}`);
  return parsed;
};
const at = (s: string): ReminderTime => {
  const parsed = parseReminderTime(s);
  if (!parsed) throw new Error(`bad time ${s}`);
  return parsed;
};
const done = (...days: string[]): Completion[] => days.map((d) => ({ date: day(d), session: 1, level: 3 }));

const today = day('2026-06-10');
const noon = new Date(2026, 5, 10, 12, 0);

it('runs under the zone the npm script asked for', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(process.env.TZ);
});

describe('shouldRemind', () => {
  it('is false when no reminder time is set', () => {
    expect(shouldRemind(noon, undefined, [], undefined)).toBe(false);
  });

  it('is false before the reminder time', () => {
    expect(shouldRemind(new Date(2026, 5, 10, 8, 59), at('09:00'), [], undefined)).toBe(false);
  });

  it('is true at exactly the reminder time', () => {
    expect(shouldRemind(new Date(2026, 5, 10, 9, 0), at('09:00'), [], undefined)).toBe(true);
  });

  it('is true after the reminder time', () => {
    expect(shouldRemind(new Date(2026, 5, 10, 21, 30), at('09:00'), [], undefined)).toBe(true);
  });

  it('ignores seconds within the reminder minute', () => {
    expect(shouldRemind(new Date(2026, 5, 10, 9, 0, 59), at('09:00'), [], undefined)).toBe(true);
  });

  it('is false once today has a completion', () => {
    expect(shouldRemind(noon, at('09:00'), done('2026-06-10'), undefined)).toBe(false);
  });

  it('still reminds when only earlier days are complete', () => {
    expect(shouldRemind(noon, at('09:00'), done('2026-06-09', '2026-06-08'), undefined)).toBe(true);
  });

  it('is false when already reminded today', () => {
    expect(shouldRemind(noon, at('09:00'), [], today)).toBe(false);
  });

  it('reminds again when the last reminder was on an earlier day', () => {
    expect(shouldRemind(noon, at('09:00'), [], day('2026-06-09'))).toBe(true);
  });

  it('treats 23:59 as today and 00:00 as the next day', () => {
    const lastMinute = new Date(2026, 5, 10, 23, 59);
    const nextMidnight = new Date(2026, 5, 11, 0, 0);
    expect(shouldRemind(lastMinute, at('23:59'), [], undefined)).toBe(true);
    expect(shouldRemind(lastMinute, at('23:59'), [], today)).toBe(false);
    expect(shouldRemind(nextMidnight, at('23:59'), [], today)).toBe(false);
    expect(shouldRemind(nextMidnight, at('00:00'), [], today)).toBe(true);
  });

  it('a 00:00 reminder is due as soon as the day starts', () => {
    expect(shouldRemind(new Date(2026, 5, 10, 0, 0), at('00:00'), [], undefined)).toBe(true);
  });

  it('a completion on the previous day does not silence the new day at midnight', () => {
    expect(shouldRemind(new Date(2026, 5, 11, 0, 0), at('00:00'), done('2026-06-10'), undefined)).toBe(true);
  });
});

describe('needsBanner', () => {
  it('is true with no completions', () => {
    expect(needsBanner(noon, [])).toBe(true);
  });

  it('is false once today is done', () => {
    expect(needsBanner(noon, done('2026-06-10'))).toBe(false);
  });

  it('flips at local midnight', () => {
    const completions = done('2026-06-10');
    expect(needsBanner(new Date(2026, 5, 10, 23, 59), completions)).toBe(false);
    expect(needsBanner(new Date(2026, 5, 11, 0, 0), completions)).toBe(true);
  });

  it('agrees with the localDay of now', () => {
    const now = new Date(2026, 5, 10, 0, 0);
    expect(needsBanner(now, [{ date: localDay(now), session: 1, level: 3 }])).toBe(false);
  });
});
