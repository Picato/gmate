export const LEVELS = [1, 2, 3, 4, 5] as const;
export type Level = (typeof LEVELS)[number];

export const EXERCISE_KINDS = ['warmup', 'chords', 'rhythm', 'scales', 'lesson'] as const;
export type ExerciseKind = (typeof EXERCISE_KINDS)[number];

declare const localDayBrand: unique symbol;
/** A calendar day in the user's local zone, 'YYYY-MM-DD'. Minted only by parseLocalDay and localDay. */
export type LocalDay = string & { readonly [localDayBrand]: true };

declare const reminderTimeBrand: unique symbol;
/** 'HH:MM', 24-hour. */
export type ReminderTime = string & { readonly [reminderTimeBrand]: true };

type ExerciseBase = {
  readonly id: string;
  readonly minutes: number;
  readonly minLevel: Level;
  readonly maxLevel: Level;
  readonly title: string;
};

// Only lessons embed video, so a non-lesson cannot carry a videoId.
export type Exercise = ExerciseBase &
  (
    | { readonly kind: 'lesson'; readonly videoId?: string | undefined }
    | { readonly kind: Exclude<ExerciseKind, 'lesson'>; readonly videoId?: never }
  );

export type SessionPlan = {
  readonly date: LocalDay;
  readonly level: Level;
  readonly items: readonly Exercise[];
  readonly totalMinutes: number;
};

export type Completion = {
  readonly date: LocalDay;
  readonly level: Level;
};

export type Settings = {
  readonly reminderTime?: ReminderTime | undefined;
};

export type AppState = {
  readonly level: Level;
  readonly completions: readonly Completion[];
  readonly settings: Settings;
};

export const DEFAULT_LEVEL: Level = 3;

export function parseLevel(raw: unknown): Level | undefined {
  return LEVELS.find((level) => level === raw);
}

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseLocalDay(raw: unknown): LocalDay | undefined {
  if (typeof raw !== 'string') return undefined;
  const match = DAY_PATTERN.exec(raw);
  if (!match) return undefined;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const probe = new Date(year, month - 1, day, 12);
  const roundTrips =
    probe.getFullYear() === year && probe.getMonth() === month - 1 && probe.getDate() === day;
  return roundTrips ? (raw as LocalDay) : undefined;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parseReminderTime(raw: unknown): ReminderTime | undefined {
  return typeof raw === 'string' && TIME_PATTERN.test(raw) ? (raw as ReminderTime) : undefined;
}
