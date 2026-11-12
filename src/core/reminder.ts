import { localDay } from './streak.ts';
import type { Completion, LocalDay, ReminderTime } from './types.ts';

const minutesOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();

const reminderMinutes = (time: ReminderTime) => {
  const [hours, minutes] = time.split(':').map(Number) as [number, number];
  return hours * 60 + minutes;
};

const doneOn = (completions: readonly Completion[], day: LocalDay) =>
  completions.some((c) => c.date === day);

/** True while today has no completion. */
export function needsBanner(now: Date, completions: readonly Completion[]): boolean {
  return !doneOn(completions, localDay(now));
}

export function shouldRemind(
  now: Date,
  reminderTime: ReminderTime | undefined,
  completions: readonly Completion[],
  lastRemindedOn: LocalDay | undefined,
): boolean {
  if (reminderTime === undefined) return false;
  return (
    minutesOfDay(now) >= reminderMinutes(reminderTime) &&
    needsBanner(now, completions) &&
    lastRemindedOn !== localDay(now)
  );
}
