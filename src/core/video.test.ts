import { describe, expect, it } from 'vitest';
import type { Exercise, VideoIds } from './types.ts';
import { videoFor } from './video.ts';

const lesson = (videoIds: VideoIds): Exercise => ({
  kind: 'lesson', id: 'l', minutes: 10, minLevel: 1, maxLevel: 5, title: 'T', videoIds,
});

describe('videoFor', () => {
  it('returns the requested language when present', () => {
    const both = lesson({ en: 'enenenenen1', vi: 'vivivivivi1' });
    expect(videoFor(both, 'vi')).toEqual({ videoId: 'vivivivivi1', language: 'vi', fellBack: false });
    expect(videoFor(both, 'en')).toEqual({ videoId: 'enenenenen1', language: 'en', fellBack: false });
  });

  it('falls back to English and says so when the requested language is missing', () => {
    expect(videoFor(lesson({ en: 'enenenenen1' }), 'vi')).toEqual({
      videoId: 'enenenenen1', language: 'en', fellBack: true,
    });
  });

  it('returns no video when neither language has one', () => {
    expect(videoFor(lesson({}), 'vi').videoId).toBeUndefined();
    expect(videoFor(lesson({ vi: 'vivivivivi1' }), 'en').videoId).toBeUndefined();
  });
});
