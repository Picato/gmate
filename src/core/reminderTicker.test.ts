import { describe, expect, it } from 'vitest';
import { defaultState } from './storage.ts';
import { remindedStore, REMINDED_KEY, remindTick, type ReminderPorts } from './reminderTicker.ts';
import { parseLocalDay, parseReminderTime, type AppState, type LocalDay } from './types.ts';

const day = (s: string): LocalDay => {
  const parsed = parseLocalDay(s);
  if (!parsed) throw new Error(`bad day ${s}`);
  return parsed;
};

function harness(opts: { time?: string; done?: boolean; granted?: boolean; at: Date }) {
  const clock = { now: opts.at };
  let reminded: LocalDay | undefined;
  let fired = 0;
  const state: AppState = {
    ...defaultState(),
    completions: opts.done ? [{ date: day('2026-06-10'), level: 3 }] : [],
    settings: { reminderTime: parseReminderTime(opts.time) },
  };
  const ports: ReminderPorts = {
    now: () => clock.now,
    state: () => state,
    lastRemindedOn: () => reminded,
    markReminded: (d) => void (reminded = d),
    canNotify: () => opts.granted ?? true,
    notify: () => void (fired += 1),
  };
  return { ports, clock, fired: () => fired };
}

describe('remindTick', () => {
  it('fires once after the reminder time and not again that day', () => {
    const h = harness({ time: '18:00', at: new Date(2026, 5, 10, 18, 0, 30) });
    expect(remindTick(h.ports)).toBe(true);
    h.clock.now = new Date(2026, 5, 10, 18, 1);
    expect(remindTick(h.ports)).toBe(false);
    h.clock.now = new Date(2026, 5, 10, 23, 59);
    expect(remindTick(h.ports)).toBe(false);
    expect(h.fired()).toBe(1);
  });

  it('fires again the next day', () => {
    const h = harness({ time: '18:00', at: new Date(2026, 5, 10, 18, 0) });
    remindTick(h.ports);
    h.clock.now = new Date(2026, 5, 11, 18, 0);
    expect(remindTick(h.ports)).toBe(true);
    expect(h.fired()).toBe(2);
  });

  it.each([
    ['before the time', { time: '18:00', at: new Date(2026, 5, 10, 17, 59) }],
    ['no time set', { at: new Date(2026, 5, 10, 20, 0) }],
    ['today already done', { time: '18:00', done: true, at: new Date(2026, 5, 10, 20, 0) }],
  ])('stays quiet %s', (_label, opts) => {
    const h = harness(opts);
    expect(remindTick(h.ports)).toBe(false);
    expect(h.fired()).toBe(0);
  });

  it('does not spend the day while notifications are not granted', () => {
    const denied = harness({ time: '18:00', granted: false, at: new Date(2026, 5, 10, 18, 5) });
    expect(remindTick(denied.ports)).toBe(false);
    expect(denied.ports.lastRemindedOn()).toBeUndefined();
  });
});

describe('remindedStore', () => {
  const fake = (initial?: string) => {
    const data = new Map<string, string>(initial ? [[REMINDED_KEY, initial]] : []);
    return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
  };

  it('round-trips the day', () => {
    const store = remindedStore(fake());
    expect(store.load()).toBeUndefined();
    store.save(day('2026-06-10'));
    expect(store.load()).toBe('2026-06-10');
  });

  it('ignores garbage', () => {
    expect(remindedStore(fake('soon')).load()).toBeUndefined();
  });
});
