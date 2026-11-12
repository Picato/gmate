import type { Completion, LocalDay } from './types.ts';

const pad = (n: number, width: number) => String(n).padStart(width, '0');

export function localDay(date: Date): LocalDay {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}` as LocalDay;
}

/** Calendar arithmetic via setDate. Anchored at noon so a missing local midnight (DST) cannot shift the day. */
export function addDays(day: LocalDay, delta: number): LocalDay {
  const [year, month, date] = day.split('-').map(Number) as [number, number, number];
  const cursor = new Date(year, month - 1, date, 12);
  cursor.setDate(cursor.getDate() + delta);
  return localDay(cursor);
}

const dayKeys = (completions: readonly Completion[]) =>
  new Set<LocalDay>(completions.map((c) => c.date));

/** Alive while today is still open: a streak ending yesterday counts. */
export function currentStreak(completions: readonly Completion[], today: LocalDay): number {
  const done = dayKeys(completions);
  let cursor = done.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (done.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(completions: readonly Completion[]): number {
  const days = [...dayKeys(completions)].sort();
  let longest = 0;
  let run = 0;
  let previous: LocalDay | undefined;
  for (const day of days) {
    run = previous !== undefined && addDays(previous, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }
  return longest;
}
