import { CATALOG } from '../src/data/catalog.ts';

// Keyless oEmbed: 200 means embeddable, 400 means no such video, 401 means embedding is disabled.
const VERDICT = { 200: 'ok', 400: 'missing', 401: 'not embeddable' };

async function check(videoId) {
  const watch = `https://www.youtube.com/watch?v=${videoId}`;
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`;
  try {
    const res = await fetch(url);
    const meta = res.status === 200 ? await res.json() : {};
    return {
      videoId,
      status: res.status,
      verdict: VERDICT[res.status] ?? 'unexpected',
      title: meta.title ?? '',
      author: meta.author_name ?? '',
    };
  } catch (error) {
    return { videoId, status: '-', verdict: `network error: ${error.message}`, title: '', author: '' };
  }
}

const entries = CATALOG.flatMap((e) =>
  Object.entries(e.videoIds ?? {})
    .filter(([, videoId]) => videoId)
    .map(([language, videoId]) => ({ id: e.id, language, videoId })),
);

const rows = await Promise.all(
  entries.map(async ({ id, language, videoId }) => ({ id, language, ...(await check(videoId)) })),
);
console.table(rows);

for (const language of ['en', 'vi']) {
  const missing = CATALOG.filter((e) => e.kind === 'lesson' && !e.videoIds?.[language]).map((e) => e.id);
  console.log(`${language}: ${missing.length} lesson(s) without a video${missing.length ? ` (${missing.join(', ')})` : ''}.`);
}

process.exitCode = rows.every((r) => r.verdict === 'ok') ? 0 : 1;
