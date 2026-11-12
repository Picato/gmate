import type { Exercise, Language } from './types.ts';

export type VideoChoice = {
  readonly videoId: string | undefined;
  readonly language: Language;
  readonly fellBack: boolean;
};

/** `language` is the one the video is in, which differs from the request only when `fellBack`. */
export function videoFor(exercise: Exercise, language: Language): VideoChoice {
  const ids = exercise.videoIds;
  const wanted = ids?.[language];
  if (wanted) return { videoId: wanted, language, fellBack: false };
  const english = ids?.en;
  if (english) return { videoId: english, language: 'en', fellBack: true };
  return { videoId: undefined, language, fellBack: false };
}
