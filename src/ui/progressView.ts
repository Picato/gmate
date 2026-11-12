import { currentStreak, addDays, longestStreak } from '../core/streak.ts';
import type { AppState, LocalDay } from '../core/types.ts';

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
  return {
    totalSessions: done.size,
    currentStreak: currentStreak(state.completions, today),
    longestStreak: longestStreak(state.completions),
    levelLabel: `Level ${state.level} of 5`,
    days,
  };
}
