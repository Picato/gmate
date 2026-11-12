import { localDay } from './streak.ts';
import type { Exercise, ExerciseKind, Level, LocalDay, SessionPlan } from './types.ts';

export const DEFAULT_BUDGET = 30;

// One kind per slot; the rotation start shifts by dayIndex so the opener changes daily.
const ROTATION: readonly ExerciseKind[] = ['warmup', 'chords', 'rhythm', 'lesson'];

// Kind that absorbs leftover minutes when the picks fall short of the budget.
const FILLER_KIND: ExerciseKind = 'scales';

const eligible = (catalog: readonly Exercise[], kind: ExerciseKind, level: Level) =>
  catalog.filter((e) => e.kind === kind && e.minLevel <= level && level <= e.maxLevel);

function pickFor(
  catalog: readonly Exercise[],
  kind: ExerciseKind,
  level: Level,
  dayIndex: number,
): Exercise | undefined {
  const pool = eligible(catalog, kind, level);
  return pool[dayIndex % pool.length];
}

const withMinutes = (exercise: Exercise, minutes: number): Exercise => ({ ...exercise, minutes });

/**
 * Trim: each pick gets at most what is left, and exhausted picks drop out.
 * Fill: leftover goes to a filler exercise, then whatever remains stretches the last item.
 * The total therefore equals the budget for any non-empty selection, whatever the catalog's minutes.
 */
function fitToBudget(
  picks: readonly Exercise[],
  filler: Exercise | undefined,
  budget: number,
): Exercise[] {
  const items: Exercise[] = [];
  let left = budget;
  for (const pick of [...picks, ...(filler ? [filler] : [])]) {
    const minutes = Math.min(pick.minutes, left);
    if (minutes <= 0) continue;
    items.push(minutes === pick.minutes ? pick : withMinutes(pick, minutes));
    left -= minutes;
  }
  const last = items.at(-1);
  if (last && left > 0) items[items.length - 1] = withMinutes(last, last.minutes + left);
  return items;
}

export function planFor(
  level: Level,
  dayIndex: number,
  catalog: readonly Exercise[],
  budget: number = DEFAULT_BUDGET,
  date: LocalDay = localDay(new Date()),
): SessionPlan {
  if (!Number.isInteger(dayIndex) || dayIndex < 0) throw new RangeError(`bad dayIndex ${dayIndex}`);
  if (!Number.isInteger(budget) || budget <= 0) throw new RangeError(`bad budget ${budget}`);

  const picks = ROTATION.map((_, slot) => ROTATION[(dayIndex + slot) % ROTATION.length])
    .map((kind) => pickFor(catalog, kind!, level, dayIndex))
    .filter((pick): pick is Exercise => pick !== undefined);
  const items = fitToBudget(picks, pickFor(catalog, FILLER_KIND, level, dayIndex), budget);
  if (items.length === 0) throw new RangeError(`no catalog entries eligible at level ${level}`);

  const totalMinutes = items.reduce((sum, item) => sum + item.minutes, 0);
  return { date, level, items, totalMinutes };
}
