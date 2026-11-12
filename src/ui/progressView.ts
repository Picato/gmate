import { currentStreak, addDays, longestStreak } from '../core/streak.ts';
import type { AppState, LocalDay } from '../core/types.ts';

export const dayCount = (n: number): string => `${n} ${n === 1 ? 'day' : 'days'}`;

export const HISTORY_DAYS = 14;

export type DayCell = {
  readonly date: LocalDay;
  readonly done: boolean;
  readonly label: string;
};

export type ProgressView = {
  readonly totalSessions: number;
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly currentStreakLabel: string;
  readonly longestStreakLabel: string;
  readonly levelLabel: string;
  /** Oldest first, ending today. */
  readonly days: readonly DayCell[];
};

export function progressView(state: AppState, today: LocalDay): ProgressView {
  const done = new Set(state.completions.map((c) => c.date));
  const days = Array.from({ length: HISTORY_DAYS }, (_, i) => {
    const date = addDays(today, i - (HISTORY_DAYS - 1));
    const isDone = done.has(date);
    return { date, done: isDone, label: `${date} ${isDone ? 'done' : 'missed'}` };
  });
  const current = currentStreak(state.completions, today);
  const longest = longestStreak(state.completions);
  return {
    totalSessions: done.size,
    currentStreak: current,
    longestStreak: longest,
    currentStreakLabel: dayCount(current),
    longestStreakLabel: dayCount(longest),
    levelLabel: `Level ${state.level} of 5`,
    days,
  };
}
