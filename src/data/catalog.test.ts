import { describe, expect, it } from 'vitest';
import { EXERCISE_KINDS, LEVELS } from '../core/types.ts';
import { CATALOG } from './catalog.ts';

describe('catalog', () => {
  it('has unique ids', () => {
    expect(new Set(CATALOG.map((e) => e.id)).size).toBe(CATALOG.length);
  });

  it('keeps at least 3 entries of every kind eligible at every level', () => {
    for (const kind of EXERCISE_KINDS) {
      for (const level of LEVELS) {
        const pool = CATALOG.filter((e) => e.kind === kind && e.minLevel <= level && level <= e.maxLevel);
        expect(pool.length, `${kind} at level ${level}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it.each(CATALOG.map((e) => [e.id, e] as const))('%s tells the learner what to do', (_id, exercise) => {
    const { goal, steps, tips, check } = exercise.guide;
    expect(goal.length).toBeGreaterThan(20);
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps.every((step) => step.length > 20)).toBe(true);
    expect(tips.length).toBeGreaterThanOrEqual(1);
    expect(check.length).toBeGreaterThan(20);
    // A guide that only repeats the title is the thing this test exists to prevent.
    expect(goal.toLowerCase()).not.toBe(exercise.title.toLowerCase());
  });
});
