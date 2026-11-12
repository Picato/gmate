import { describe, expect, it } from 'vitest';
import { nextLevel, type RatedSession, type Rating } from './adapt.ts';
import { parseLocalDay, type Level } from './types.ts';

const rated = (date: string, rating: Rating, level: Level = 3): RatedSession => {
  const parsed = parseLocalDay(date);
  if (!parsed) throw new Error(`bad day ${date}`);
  return { date: parsed, level, rating };
};

describe('nextLevel', () => {
  it('keeps the level with no history', () => {
    expect(nextLevel(3, [])).toBe(3);
  });

  it('promotes after three consecutive easy sessions', () => {
    const history = [rated('2026-06-01', 'easy'), rated('2026-06-02', 'easy'), rated('2026-06-03', 'easy')];
    expect(nextLevel(3, history)).toBe(4);
  });

  it('does not promote after only two easy sessions', () => {
    expect(nextLevel(3, [rated('2026-06-01', 'easy'), rated('2026-06-02', 'easy')])).toBe(3);
  });

  it('demotes after two consecutive hard sessions', () => {
    expect(nextLevel(3, [rated('2026-06-01', 'hard'), rated('2026-06-02', 'hard')])).toBe(2);
  });

  it('does not demote after a single hard session', () => {
    expect(nextLevel(3, [rated('2026-06-01', 'hard')])).toBe(3);
  });

  it('lets a right rating break an easy run', () => {
    const history = [
      rated('2026-06-01', 'easy'),
      rated('2026-06-02', 'easy'),
      rated('2026-06-03', 'right'),
      rated('2026-06-04', 'easy'),
    ];
    expect(nextLevel(3, history)).toBe(3);
  });

  it('lets a right rating break a hard run', () => {
    const history = [rated('2026-06-01', 'hard'), rated('2026-06-02', 'right'), rated('2026-06-03', 'hard')];
    expect(nextLevel(3, history)).toBe(3);
  });

  it('only the latest run counts', () => {
    const history = [
      rated('2026-06-01', 'easy'),
      rated('2026-06-02', 'easy'),
      rated('2026-06-03', 'easy'),
      rated('2026-06-04', 'hard'),
    ];
    expect(nextLevel(3, history)).toBe(3);
  });

  it('clamps at level 5', () => {
    const history = [rated('2026-06-01', 'easy', 5), rated('2026-06-02', 'easy', 5), rated('2026-06-03', 'easy', 5)];
    expect(nextLevel(5, history)).toBe(5);
  });

  it('clamps at level 1', () => {
    expect(nextLevel(1, [rated('2026-06-01', 'hard', 1), rated('2026-06-02', 'hard', 1)])).toBe(1);
  });

  it('ignores sessions from before a level change', () => {
    const history = [
      rated('2026-06-01', 'hard', 2),
      rated('2026-06-02', 'hard', 2),
      rated('2026-06-03', 'easy', 3),
      rated('2026-06-04', 'easy', 3),
    ];
    expect(nextLevel(3, history)).toBe(3);
  });

  it('does not re-promote on an old streak after returning to a level', () => {
    const history = [
      rated('2026-06-01', 'easy', 3),
      rated('2026-06-02', 'easy', 3),
      rated('2026-06-03', 'easy', 3),
      rated('2026-06-04', 'hard', 4),
      rated('2026-06-05', 'hard', 4),
    ];
    expect(nextLevel(3, history)).toBe(3);
  });

  it('sorts unsorted input by date before reading the run', () => {
    const history = [
      rated('2026-06-03', 'easy'),
      rated('2026-06-01', 'hard'),
      rated('2026-06-02', 'easy'),
      rated('2026-06-04', 'easy'),
    ];
    expect(nextLevel(3, history)).toBe(4);
  });

  it('does not mutate its input', () => {
    const history = [rated('2026-06-02', 'easy'), rated('2026-06-01', 'easy')];
    nextLevel(3, history);
    expect(history.map((s) => s.date)).toEqual(['2026-06-02', '2026-06-01']);
  });
});
