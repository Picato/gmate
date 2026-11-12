import { LEVELS, type Level, type LocalDay } from './types.ts';

export type Rating = 'easy' | 'right' | 'hard';

export type RatedSession = {
  readonly date: LocalDay;
  readonly level: Level;
  readonly rating: Rating;
};

type LevelRule = {
  readonly rating: Rating;
  readonly consecutive: number;
  readonly delta: 1 | -1;
};

export const PROMOTE_AFTER_EASY = 3;
export const DEMOTE_AFTER_HARD = 2;

export const LEVEL_RULES: readonly LevelRule[] = [
  { rating: 'easy', consecutive: PROMOTE_AFTER_EASY, delta: 1 },
  { rating: 'hard', consecutive: DEMOTE_AFTER_HARD, delta: -1 },
];

const MIN_LEVEL = LEVELS[0];
const MAX_LEVEL = LEVELS[LEVELS.length - 1]!;

/**
 * Evidence is the unbroken tail of sessions at `current`. A session at any other
 * level marks a level change, so earlier sessions cannot count toward a second move
 * (otherwise a demotion would instantly re-promote on the old easy streak).
 */
function evidence(current: Level, history: readonly RatedSession[]): readonly RatedSession[] {
  const byDate = [...history].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let start = byDate.length;
  while (start > 0 && byDate[start - 1]!.level === current) start -= 1;
  return byDate.slice(start);
}

export function nextLevel(current: Level, history: readonly RatedSession[]): Level {
  const sessions = evidence(current, history);
  const rule = LEVEL_RULES.find(({ rating, consecutive }) => {
    const tail = sessions.slice(-consecutive);
    return tail.length === consecutive && tail.every((s) => s.rating === rating);
  });
  const moved = current + (rule?.delta ?? 0);
  return LEVELS.find((level) => level === Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, moved)))!;
}
