import { addDays } from './streak.ts';
import type { Completion, LocalDay } from './types.ts';

/**
 * Calendar days from the earliest completion to today, 0 when there is none.
 * Walks with addDays so DST-length days count as one; never subtracts timestamps.
 * A clock set before the first completion clamps to 0 because planFor rejects negatives.
 */
export function dayIndexFor(today: LocalDay, completions: readonly Completion[]): number {
  const first = completions.map((c) => c.date).sort()[0];
  if (first === undefined) return 0;
  let index = 0;
  for (let cursor = first; cursor < today; cursor = addDays(cursor, 1)) index += 1;
  return index;
}
