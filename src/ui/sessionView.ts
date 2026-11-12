import { dayIndexFor } from '../core/dayIndex.ts';
import { planFor } from '../core/plan.ts';
import { currentStreak, longestStreak } from '../core/streak.ts';
import type { AppState, Exercise, ExerciseKind, LocalDay } from '../core/types.ts';

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
  const plan = planFor(state.level, dayIndexFor(today, state.completions), catalog, undefined, today);
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
    done: state.completions.some((c) => c.date === today),
  };
}

/** Idempotent: a day already completed returns the same state. */
export function markDone(state: AppState, today: LocalDay): AppState {
  if (state.completions.some((c) => c.date === today)) return state;
  return { ...state, completions: [...state.completions, { date: today, level: state.level }] };
}
