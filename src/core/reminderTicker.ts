import { shouldRemind } from './reminder.ts';
import { localDay } from './streak.ts';
import { parseLocalDay, type AppState, type LocalDay } from './types.ts';

export const REMINDED_KEY = 'gmate:reminded:v1';

export type ReminderPorts = {
  readonly now: () => Date;
  readonly state: () => AppState;
  readonly lastRemindedOn: () => LocalDay | undefined;
  readonly markReminded: (day: LocalDay) => void;
  /** False when notifications are unavailable or not granted; the day then stays un-reminded. */
  readonly canNotify: () => boolean;
  readonly notify: () => void;
};

/** One scheduler tick. Returns whether a notification fired. */
export function remindTick(ports: ReminderPorts): boolean {
  const now = ports.now();
  const { settings, completions } = ports.state();
  if (!shouldRemind(now, settings.reminderTime, completions, ports.lastRemindedOn())) return false;
  if (!ports.canNotify()) return false;
  ports.notify();
  ports.markReminded(localDay(now));
  return true;
}

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

export function remindedStore(store: KeyValueStore) {
  return {
    load: (): LocalDay | undefined => parseLocalDay(store.getItem(REMINDED_KEY)),
    save: (day: LocalDay): void => store.setItem(REMINDED_KEY, day),
  };
}
