export const LEVELS = [1, 2, 3, 4, 5] as const;
export type Level = (typeof LEVELS)[number];

export const EXERCISE_KINDS = ['warmup', 'chords', 'rhythm', 'scales', 'lesson'] as const;
export type ExerciseKind = (typeof EXERCISE_KINDS)[number];

export const LANGUAGES = ['en', 'vi'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'en';

/** A lesson's YouTube ids by language; a missing language means no verified video yet. */
export type VideoIds = { readonly [L in Language]?: string | undefined };

declare const localDayBrand: unique symbol;
/** A calendar day in the user's local zone, 'YYYY-MM-DD'. Minted only by parseLocalDay and localDay. */
export type LocalDay = string & { readonly [localDayBrand]: true };

declare const reminderTimeBrand: unique symbol;
/** 'HH:MM', 24-hour. */
export type ReminderTime = string & { readonly [reminderTimeBrand]: true };

/** What to do in an exercise, so a title is never all the learner gets. */
export type Guide = {
  /** What you will be able to do. */
  readonly goal: string;
  /** Ordered instructions. */
  readonly steps: readonly string[];
  /** Common mistakes and cues. */
  readonly tips: readonly string[];
  /** How to tell you have it. */
  readonly check: string;
};

type ExerciseBase = {
  readonly id: string;
  readonly minutes: number;
  readonly minLevel: Level;
  readonly maxLevel: Level;
  readonly title: string;
  readonly guide: Guide;
};

// Only lessons embed video, so a non-lesson cannot carry videoIds.
export type Exercise = ExerciseBase &
  (
    | { readonly kind: 'lesson'; readonly videoIds?: VideoIds }
    | { readonly kind: Exclude<ExerciseKind, 'lesson'>; readonly videoIds?: never }
  );

export type SessionPlan = {
  readonly date: LocalDay;
  readonly level: Level;
  readonly items: readonly Exercise[];
  readonly totalMinutes: number;
};

export const RATINGS = ['easy', 'right', 'hard'] as const;
export type Rating = (typeof RATINGS)[number];

/** An exercise as it was planned for a finished session, so history survives catalog changes. */
export type PlannedExercise = { readonly id: string; readonly minutes: number };

export type Completion = {
  readonly date: LocalDay;
  /** 1-based order within its day; a day can hold several sessions. */
  readonly session: number;
  readonly level: Level;
  readonly rating?: Rating | undefined;
  /** Absent on sessions saved before history existed. */
  readonly exercises?: readonly PlannedExercise[] | undefined;
};

export type Settings = {
  readonly language: Language;
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

export function parseLanguage(raw: unknown): Language | undefined {
  return LANGUAGES.find((language) => language === raw);
}

export function parseRating(raw: unknown): Rating | undefined {
  return RATINGS.find((rating) => rating === raw);
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
