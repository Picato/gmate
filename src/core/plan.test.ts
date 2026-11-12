import { describe, expect, it } from 'vitest';
import { CATALOG } from '../data/catalog.ts';
import { planFor } from './plan.ts';
import { EXERCISE_KINDS, LEVELS, type Exercise } from './types.ts';

const DAYS = Array.from({ length: 61 }, (_, i) => i);
const levelDayPairs = LEVELS.flatMap((level) => DAYS.map((day) => [level, day] as const));

describe('planFor invariants over the seeded catalog', () => {
  it.each(levelDayPairs)('level %i day %i totals exactly 30 minutes', (level, day) => {
    const plan = planFor(level, day, CATALOG);
    expect(plan.totalMinutes).toBe(30);
    expect(plan.items.reduce((sum, item) => sum + item.minutes, 0)).toBe(30);
    expect(plan.items.every((item) => item.minutes > 0)).toBe(true);
  });

  it.each(levelDayPairs)('level %i day %i only uses exercises eligible at that level', (level, day) => {
    for (const item of planFor(level, day, CATALOG).items) {
      expect(item.minLevel).toBeLessThanOrEqual(level);
      expect(item.maxLevel).toBeGreaterThanOrEqual(level);
    }
  });

  it('opens with a different kind as the day index advances', () => {
    const openers = [0, 1, 2, 3].map((day) => planFor(3, day, CATALOG).items[0]?.kind);
    expect(openers).toEqual(['warmup', 'chords', 'rhythm', 'lesson']);
  });

  it('is deterministic', () => {
    expect(planFor(3, 7, CATALOG)).toEqual(planFor(3, 7, CATALOG));
  });

  it('varies the picks across days at level 3', () => {
    const titles = new Set(DAYS.map((d) => planFor(3, d, CATALOG).items.map((i) => i.id).join()));
    expect(titles.size).toBeGreaterThan(5);
  });

  it('records the level and date it was planned for', () => {
    const plan = planFor(2, 0, CATALOG, 30, '2026-06-10' as never);
    expect([plan.level, plan.date]).toEqual([2, '2026-06-10']);
  });
});

const make = (id: string, kind: Exercise['kind'], minutes: number): Exercise =>
  ({ id, kind, minutes, minLevel: 1, maxLevel: 5, title: id }) as Exercise;

describe('planFor holds the budget whatever the catalog says', () => {
  it.each([
    ['entries too long (trim)', [20, 20, 20, 20, 20]],
    ['entries too short (fill)', [1, 1, 1, 1, 1]],
    ['a single entry', [5]],
  ])('%s', (_name, minutes) => {
    const kinds = ['warmup', 'chords', 'rhythm', 'lesson', 'scales'] as const;
    const catalog = minutes.map((m, i) => make(`e${i}`, kinds[i]!, m));
    for (const day of DAYS) expect(planFor(3, day, catalog).totalMinutes).toBe(30);
  });

  it('honours a different budget', () => {
    expect(planFor(3, 4, CATALOG, 45).totalMinutes).toBe(45);
    expect(planFor(3, 4, CATALOG, 10).totalMinutes).toBe(10);
  });

  it('rejects an empty catalog, a bad budget and a bad day index', () => {
    expect(() => planFor(3, 0, [])).toThrow(RangeError);
    expect(() => planFor(3, 0, CATALOG, 0)).toThrow(RangeError);
    expect(() => planFor(3, -1, CATALOG)).toThrow(RangeError);
    expect(() => planFor(3, 1.5, CATALOG)).toThrow(RangeError);
  });
});

describe('seeded catalog', () => {
  it('has unique ids and sane minutes and level ranges', () => {
    expect(new Set(CATALOG.map((e) => e.id)).size).toBe(CATALOG.length);
    for (const e of CATALOG) {
      expect(Number.isInteger(e.minutes) && e.minutes > 0).toBe(true);
      expect(e.minLevel).toBeLessThanOrEqual(e.maxLevel);
    }
  });

  it.each(EXERCISE_KINDS.flatMap((kind) => LEVELS.map((level) => [kind, level] as const)))(
    'offers at least 3 %s entries at level %i',
    (kind, level) => {
      const count = CATALOG.filter(
        (e) => e.kind === kind && e.minLevel <= level && level <= e.maxLevel,
      ).length;
      expect(count).toBeGreaterThanOrEqual(3);
    },
  );

  it('gives level 3 the most entries', () => {
    const at = (level: number) =>
      CATALOG.filter((e) => e.minLevel <= level && level <= e.maxLevel).length;
    expect(at(3)).toBeGreaterThanOrEqual(Math.max(at(1), at(2), at(4), at(5)));
  });

  it('carries only the one verified video id, on a lesson', () => {
    const withVideo = CATALOG.filter((e) => e.videoId !== undefined);
    expect(withVideo.map((e) => [e.kind, e.videoId])).toEqual([['lesson', 'BBz-Jyr23M4']]);
  });
});
