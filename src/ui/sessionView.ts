import { nextLevel, type RatedSession } from '../core/adapt.ts';
import { planFor } from '../core/plan.ts';
import { videoFor } from '../core/video.ts';
import { currentStreak, longestStreak } from '../core/streak.ts';
import type {
  AppState,
  Completion,
  Exercise,
  ExerciseKind,
  Guide,
  Language,
  Level,
  LocalDay,
  PlannedExercise,
  Rating,
} from '../core/types.ts';

export type LessonMedia =
  | {
      readonly type: 'video';
      readonly embedUrl: string;
      readonly language: Language;
      readonly fellBack: boolean;
      readonly fallbackNote: string | undefined;
    }
  | {
      readonly type: 'link';
      readonly message: string;
      readonly href: string;
      readonly language: Language;
      readonly fellBack: false;
    };

export type ItemView = {
  readonly id: string;
  readonly kind: ExerciseKind;
  readonly title: string;
  readonly minutesLabel: string;
  readonly guide: Guide;
  readonly media: LessonMedia | undefined;
};

export type SessionView = {
  readonly date: LocalDay;
  /** Which of today's sessions this is, from 1. */
  readonly session: number;
  readonly title: string;
  readonly levelLabel: string;
  readonly items: readonly ItemView[];
  /** The plan as shown, to record when the session is finished. */
  readonly exercises: readonly PlannedExercise[];
  readonly totalMinutes: number;
  readonly totalLabel: string;
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly done: boolean;
};

export const LANGUAGE_CHOICES: readonly { readonly language: Language; readonly label: string; readonly name: string }[] = [
  { language: 'en', label: 'English', name: 'English' },
  { language: 'vi', label: 'Tiếng Việt', name: 'Vietnamese' },
];

const languageName = (language: Language): string =>
  LANGUAGE_CHOICES.find((c) => c.language === language)?.name ?? language;

const minutesLabel = (minutes: number) => `${minutes} min`;

function mediaFor(exercise: Exercise, requested: Language): LessonMedia | undefined {
  if (exercise.kind !== 'lesson') return undefined;
  const { videoId, language, fellBack } = videoFor(exercise, requested);
  if (videoId) {
    return {
      type: 'video',
      embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`,
      language,
      fellBack,
      fallbackNote: fellBack
        ? `No ${languageName(requested)} video for this lesson yet, showing ${languageName(language)}`
        : undefined,
    };
  }
  return {
    type: 'link',
    message: 'No embedded video for this lesson yet. Find one on YouTube.',
    href: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.title} guitar lesson`)}`,
    language,
    fellBack: false,
  };
}

const sessionsOn = (state: AppState, day: LocalDay): readonly Completion[] =>
  state.completions.filter((c) => c.date === day);

/** The session to show on load: the latest one finished today, else the first. */
export function currentSession(state: AppState, today: LocalDay): number {
  return Math.max(1, sessionsOn(state, today).length);
}

/**
 * A finished session replays its own plan and level. The one after it is planned at the
 * current level, which the ratings so far have adjusted, and rotates by how many sessions
 * have been finished in total, so each session brings new material.
 */
function toItemView(exercise: Exercise, language: Language): ItemView {
  return {
    id: exercise.id,
    kind: exercise.kind,
    title: exercise.title,
    minutesLabel: minutesLabel(exercise.minutes),
    guide: exercise.guide,
    media: mediaFor(exercise, language),
  };
}

export function sessionView(
  state: AppState,
  today: LocalDay,
  catalog: readonly Exercise[],
  session = 1,
): SessionView {
  const completed = sessionsOn(state, today)[session - 1];
  const level = completed?.level ?? state.level;
  const sessionIndex = completed ? state.completions.indexOf(completed) : state.completions.length;
  const plan = planFor(level, sessionIndex, catalog, undefined, today);
  return {
    date: today,
    session,
    title: session === 1 ? "Today's session" : `Session ${session} today`,
    levelLabel: `Level ${plan.level} of 5`,
    items: plan.items.map((item) => toItemView(item, state.settings.language)),
    exercises: plan.items.map(({ id, minutes }) => ({ id, minutes })),
    totalMinutes: plan.totalMinutes,
    totalLabel: `Total ${minutesLabel(plan.totalMinutes)}`,
    currentStreak: currentStreak(state.completions, today),
    longestStreak: longestStreak(state.completions),
    done: completed !== undefined,
  };
}

/** Idempotent: choosing the current language returns the same state. */
export function setLanguage(state: AppState, language: Language): AppState {
  if (state.settings.language === language) return state;
  return { ...state, settings: { ...state.settings, language } };
}

const isRated = (c: Completion): c is Completion & RatedSession => c.rating !== undefined;

/**
 * Idempotent: only today's next unfinished session can be recorded, so repeating a call
 * (double tap, stale tab) returns the same state. The new level applies to the next session.
 */
export function markDone(
  state: AppState,
  today: LocalDay,
  session: number,
  rating?: Rating,
  exercises?: readonly PlannedExercise[],
): AppState {
  if (session !== sessionsOn(state, today).length + 1) return state;
  const completions = [...state.completions, { date: today, session, level: state.level, rating, exercises }];
  return { ...state, completions, level: nextLevel(state.level, completions.filter(isRated)) };
}

export const RATING_CHOICES: readonly { readonly rating: Rating; readonly label: string }[] = [
  { rating: 'easy', label: 'Too easy' },
  { rating: 'right', label: 'About right' },
  { rating: 'hard', label: 'Too hard' },
];

export function levelChangeMessage(from: Level, to: Level): string {
  if (to > from) return `Moving up to level ${to}`;
  if (to < from) return `Moving down to level ${to}`;
  return '';
}

/** What a finished session contained: as recorded, or rebuilt from its level and position for older saves. */
function exercisesOf(state: AppState, completion: Completion, catalog: readonly Exercise[]): Exercise[] {
  const byId = new Map(catalog.map((exercise) => [exercise.id, exercise]));
  const recorded = (completion.exercises ?? []).flatMap(({ id, minutes }) => {
    const exercise = byId.get(id);
    return exercise ? [{ ...exercise, minutes }] : [];
  });
  if (recorded.length > 0) return recorded;
  try {
    return [...planFor(completion.level, state.completions.indexOf(completion), catalog, undefined, completion.date).items];
  } catch {
    return [];
  }
}

/** Records the plan on sessions saved before history existed, so later catalog changes cannot rewrite them. */
export function backfillExercises(state: AppState, catalog: readonly Exercise[]): AppState {
  if (state.completions.every((c) => c.exercises !== undefined)) return state;
  const completions = state.completions.map((c) => {
    if (c.exercises !== undefined) return c;
    const items = exercisesOf(state, c, catalog);
    return items.length > 0 ? { ...c, exercises: items.map(({ id, minutes }) => ({ id, minutes })) } : c;
  });
  return { ...state, completions };
}

export type HistoryEntry = {
  readonly key: string;
  readonly date: LocalDay;
  readonly session: number;
  readonly levelLabel: string;
  readonly ratingLabel: string | undefined;
  readonly totalLabel: string;
  readonly titles: readonly string[];
  readonly exercises: readonly Exercise[];
};

export const historyKey = (c: Pick<Completion, 'date' | 'session'>): string => `${c.date}#${c.session}`;

/** Every finished session, newest first. */
export function historyView(state: AppState, catalog: readonly Exercise[]): HistoryEntry[] {
  return state.completions
    .flatMap((c): HistoryEntry[] => {
      const exercises = exercisesOf(state, c, catalog);
      if (exercises.length === 0) return [];
      return [
        {
          key: historyKey(c),
          date: c.date,
          session: c.session,
          levelLabel: `Level ${c.level}`,
          ratingLabel: RATING_CHOICES.find((choice) => choice.rating === c.rating)?.label,
          totalLabel: minutesLabel(exercises.reduce((sum, e) => sum + e.minutes, 0)),
          titles: exercises.map((e) => e.title),
          exercises,
        },
      ];
    })
    .reverse();
}

/** The full lesson content of a past session, in the chosen video language. */
export function reviewItems(entry: HistoryEntry, language: Language): ItemView[] {
  return entry.exercises.map((exercise) => toItemView(exercise, language));
}
