import type { Exercise, ExerciseKind, Level, VideoIds } from '../core/types.ts';

type LevelRange = readonly [min: Level, max: Level];

function practice(
  kind: Exclude<ExerciseKind, 'lesson'>,
  id: string,
  minutes: number,
  [minLevel, maxLevel]: LevelRange,
  title: string,
): Exercise {
  return { kind, id, minutes, minLevel, maxLevel, title };
}

function lesson(
  id: string,
  minutes: number,
  [minLevel, maxLevel]: LevelRange,
  title: string,
  videoIds: VideoIds,
): Exercise {
  return { kind: 'lesson', id, minutes, minLevel, maxLevel, title, videoIds };
}

// Bands: beginner 1-2, intermediate 3 (densest, the default level), advanced 4-5.
// Every kind keeps at least 3 entries eligible at every level.
export const CATALOG: readonly Exercise[] = [
  practice('warmup', 'warm-stretch', 5, [1, 2], 'Hand stretches and finger taps'),
  practice('warmup', 'warm-spider', 5, [1, 3], 'Spider walk 1-2-3-4'),
  practice('warmup', 'warm-chromatic', 5, [1, 5], 'Chromatic exercise'),
  practice('warmup', 'warm-alternate', 6, [2, 4], 'Alternate picking on open strings'),
  practice('warmup', 'warm-spider-skip', 5, [3, 5], 'Spider walk with string skipping'),
  practice('warmup', 'warm-legato', 6, [3, 5], 'Hammer-ons and pull-offs'),
  practice('warmup', 'warm-intermediate-trills', 6, [3, 3], 'Trills and finger independence'),
  practice('warmup', 'warm-speed', 7, [4, 5], 'Speed bursts with a metronome'),

  practice('chords', 'chord-open-basics', 8, [1, 2], 'Open chords: Em, Am, C, G'),
  practice('chords', 'chord-em-am', 8, [1, 2], 'Em to Am changes'),
  practice('chords', 'chord-changes', 9, [1, 3], 'One-minute chord changes'),
  practice('chords', 'chord-caged', 10, [2, 4], 'CAGED open shapes up the neck'),
  practice('chords', 'chord-barre', 10, [3, 5], 'Barre chords: F and Bm'),
  practice('chords', 'chord-sevenths', 8, [3, 5], 'Dominant and minor sevenths'),
  practice('chords', 'chord-sus', 8, [3, 4], 'Sus2 and sus4 voicings'),
  practice('chords', 'chord-intermediate-inversions', 9, [3, 3], 'Triad inversions on the top strings'),
  practice('chords', 'chord-jazz', 10, [4, 5], 'Jazz voicings: maj7 and m7b5'),
  practice('chords', 'chord-extended', 10, [4, 5], 'Extended chords: 9ths and 13ths'),

  practice('rhythm', 'rhythm-down-up', 7, [1, 3], 'Down-up strumming at 70 bpm'),
  practice('rhythm', 'rhythm-four-beat', 6, [1, 2], 'Four-beat downstrokes'),
  practice('rhythm', 'rhythm-muted', 6, [1, 2], 'Muted strums'),
  practice('rhythm', 'rhythm-syncopation', 8, [2, 4], 'Syncopated strumming patterns'),
  practice('rhythm', 'rhythm-fingerstyle', 8, [3, 5], 'Fingerstyle p-i-m-a patterns'),
  practice('rhythm', 'rhythm-shuffle', 7, [3, 4], 'Shuffle feel'),
  practice('rhythm', 'rhythm-sixteenths', 7, [3, 5], 'Sixteenth-note strumming'),
  practice('rhythm', 'rhythm-intermediate-palm-mute', 7, [3, 3], 'Palm-muted riffs with accents'),
  practice('rhythm', 'rhythm-polyrhythm', 8, [4, 5], 'Polyrhythm: three against four'),
  practice('rhythm', 'rhythm-travis', 8, [4, 5], 'Travis picking'),

  practice('scales', 'scale-first-notes', 8, [1, 2], 'First notes on the E and A strings'),
  practice('scales', 'scale-c-major', 8, [1, 3], 'C major in open position'),
  practice('scales', 'scale-open-strings', 8, [1, 2], 'Open-string melodies'),
  practice('scales', 'scale-pentatonic-box1', 10, [2, 5], 'A minor pentatonic, box 1'),
  practice('scales', 'scale-major-3nps', 10, [3, 5], 'Major scale, three notes per string'),
  practice('scales', 'scale-minor-pentatonic', 10, [3, 5], 'Minor pentatonic, all five boxes'),
  practice('scales', 'scale-pentatonic-box2', 9, [3, 5], 'A minor pentatonic, box 2 and links'),
  practice('scales', 'scale-intermediate-blues', 10, [3, 3], 'Blues scale with the blue note'),
  practice('scales', 'scale-modes', 10, [4, 5], 'Dorian and mixolydian modes'),

  // A language missing from videoIds has no verified video; scripts/check-catalog.mjs validates every id.
  lesson('lesson-andy-beginner-1', 10, [1, 2], 'Andy Guitar beginner lesson 1', { en: 'BBz-Jyr23M4' }),
  lesson('lesson-first-riff', 10, [1, 2], 'Your first riff', { en: '5rcCiXqAShY' }),
  lesson('lesson-three-chord-song', 12, [1, 3], 'A three-chord song', { en: 'ylgPrXISIuM' }),
  lesson('lesson-campfire', 12, [2, 4], 'Campfire strumming song', { en: 'ix9z6CLgc5w' }),
  lesson('lesson-fingerpicking-song', 12, [3, 4], 'A fingerpicking song', { en: 'WKprmyDGs7M' }),
  lesson('lesson-blues', 10, [3, 5], '12-bar blues in A', { en: 'rLm99QI8eWs' }),
  lesson('lesson-improv', 10, [3, 5], 'Pentatonic improvisation over a backing track', { en: 'pQhbePL8h48' }),
  lesson('lesson-solo-intro', 12, [3, 5], 'Learn a classic solo intro', { en: '0RybdmubxzY' }),
  lesson('lesson-intermediate-bends', 10, [3, 3], 'String bends and vibrato', { en: 'ck2uxWh4qvo' }),
  lesson('lesson-advanced-song', 15, [4, 5], 'An advanced full-song study', { en: 'TeMRmFYcWYc' }),
  lesson('lesson-jazz-standard', 15, [4, 5], 'A jazz standard, chord melody', { en: '57mItDzMeM8' }),
];
