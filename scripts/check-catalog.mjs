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

const entries = CATALOG.filter((e) => e.videoId !== undefined);
const pending = CATALOG.filter((e) => e.kind === 'lesson' && e.videoId === undefined).length;

const rows = await Promise.all(
  entries.map(async (e) => ({ id: e.id, ...(await check(e.videoId)) })),
);
console.table(rows);
console.log(`${pending} lesson(s) still have no videoId.`);

process.exitCode = rows.every((r) => r.verdict === 'ok') ? 0 : 1;
