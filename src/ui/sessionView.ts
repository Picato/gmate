import { dayIndexFor } from '../core/dayIndex.ts';
import { nextLevel, type RatedSession } from '../core/adapt.ts';
import { planFor } from '../core/plan.ts';
import { currentStreak, longestStreak } from '../core/streak.ts';
import type { AppState, Completion, Exercise, ExerciseKind, Level, LocalDay, Rating } from '../core/types.ts';

export type LessonMedia =
  | { readonly type: 'video'; readonly embedUrl: string }
  | { readonly type: 'link'; readonly message: string; readonly href: string };

export type ItemView = {
  readonly id: string;
  readonly kind: ExerciseKind;
  readonly title: string;
  readonly minutesLabel: string;
  readonly media: LessonMedia | undefined;
};

export type SessionView = {
  readonly date: LocalDay;
  readonly levelLabel: string;
  readonly items: readonly ItemView[];
  readonly totalMinutes: number;
  readonly totalLabel: string;
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly done: boolean;
};

const minutesLabel = (minutes: number) => `${minutes} min`;

function mediaFor(exercise: Exercise): LessonMedia | undefined {
  if (exercise.kind !== 'lesson') return undefined;
  if (exercise.videoId) {
    return {
      type: 'video',
      embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(exercise.videoId)}`,
    };
  }
  return {
    type: 'link',
    message: 'No embedded video for this lesson yet. Find one on YouTube.',
    href: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.title} guitar lesson`)}`,
  };
}

export function sessionView(
  state: AppState,
  today: LocalDay,
  catalog: readonly Exercise[],
): SessionView {
  const completedToday = state.completions.find((c) => c.date === today);
  const level = completedToday?.level ?? state.level;
  const plan = planFor(level, dayIndexFor(today, state.completions), catalog, undefined, today);
  return {
    date: today,
    levelLabel: `Level ${plan.level} of 5`,
    items: plan.items.map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      minutesLabel: minutesLabel(item.minutes),
      media: mediaFor(item),
    })),
    totalMinutes: plan.totalMinutes,
    totalLabel: `Total ${minutesLabel(plan.totalMinutes)}`,
    currentStreak: currentStreak(state.completions, today),
    longestStreak: longestStreak(state.completions),
    done: completedToday !== undefined,
  };
}

const isRated = (c: Completion): c is RatedSession => c.rating !== undefined;

/** Idempotent: a day already completed returns the same state. The new level applies from the next day. */
export function markDone(state: AppState, today: LocalDay, rating?: Rating): AppState {
  if (state.completions.some((c) => c.date === today)) return state;
  const completions = [...state.completions, { date: today, level: state.level, rating }];
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
