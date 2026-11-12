import { describe, expect, it } from 'vitest';
import { dayIndexFor } from './dayIndex.ts';
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

describe('dayIndexFor', () => {
  it('is 0 with no completions', () => {
    expect(dayIndexFor(day('2026-06-10'), [])).toBe(0);
  });

  it('is 0 on the day of the first completion', () => {
    expect(dayIndexFor(day('2026-06-10'), done('2026-06-10'))).toBe(0);
  });

  it('counts calendar days since the earliest completion, whatever the order', () => {
    expect(dayIndexFor(day('2026-06-13'), done('2026-06-12', '2026-06-10', '2026-06-11'))).toBe(3);
  });

  it('counts gaps in practice as days elapsed', () => {
    expect(dayIndexFor(day('2026-06-30'), done('2026-06-01', '2026-06-02'))).toBe(29);
  });

  it('crosses month, year and leap-day boundaries', () => {
    expect(dayIndexFor(day('2028-03-01'), done('2027-12-31'))).toBe(61);
  });

  it('counts across both US and AU daylight-saving changes as whole days', () => {
    expect(dayIndexFor(day('2026-03-09'), done('2026-03-07'))).toBe(2);
    expect(dayIndexFor(day('2026-03-30'), done('2026-03-28'))).toBe(2);
    expect(dayIndexFor(day('2026-04-06'), done('2026-04-04'))).toBe(2);
    expect(dayIndexFor(day('2026-10-06'), done('2026-10-03'))).toBe(3);
    expect(dayIndexFor(day('2026-11-03'), done('2026-10-31'))).toBe(3);
    expect(dayIndexFor(day('2027-03-01'), done('2026-03-01'))).toBe(365);
  });

  it('clamps to 0 when today is before the first completion', () => {
    expect(dayIndexFor(day('2026-06-01'), done('2026-06-10'))).toBe(0);
  });
});
