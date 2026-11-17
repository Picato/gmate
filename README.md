# gmate

A daily guitar practice app. Each session is a 30 minute plan made of a warm-up, chord work, a rhythm drill, a video lesson and a scales exercise. After every session you say how it felt, and gmate adjusts the difficulty of the next one.

It is a static web app (Vite + TypeScript, no framework) served by a Cloudflare Worker. The Worker adds email login and syncs your progress across devices.

## How gmate builds the next level of difficulty

Difficulty is a **level from 1 to 5**. Two separate pieces decide what you practise next:

1. **Level adaptation** (`src/core/adapt.ts`) decides which level you are on, from your ratings.
2. **Plan building** (`src/core/plan.ts`) turns a level into a concrete session from the exercise catalog.

### 1. The level changes only from your ratings

After you mark a session done, gmate asks *"How was the session?"*:

| Answer | Meaning |
| --- | --- |
| Too easy | evidence to move up |
| About right | no change, and it breaks any easy/hard run |
| Too hard | evidence to move down |

The rules:

| Rule | Effect |
| --- | --- |
| **3 "Too easy" in a row** | level + 1 |
| **2 "Too hard" in a row** | level − 1 |
| anything else | level stays |

Details that matter:

- **You start at level 3**, the middle level and the one with the most exercises.
- **The level is clamped to 1–5.** Rating "Too easy" three times at level 5 keeps you at 5.
- **Only sessions at your current level count as evidence.** The run is counted back from your latest session and stops at the first session done at a different level. After a level change the counter starts again, so a demotion can never be instantly undone by the "easy" sessions that came before it.
- **"About right" resets the run.** Easy, easy, right, easy does not promote you. It has to be three in a row.
- **Moving down takes fewer sessions than moving up** (2 "Too hard" against 3 "Too easy").
- **Sessions saved without a rating are ignored.** They neither help nor break a run.
- **The change applies at once.** The next session, even the same day, is planned at the new level. The app shows "Moving up to level 4" or "Moving down to level 2".

Example, starting at level 3:

| Session | Rating | Level used | Level after |
| --- | --- | --- | --- |
| 1 | easy | 3 | 3 |
| 2 | easy | 3 | 3 |
| 3 | easy | 3 | **4** (3 easy in a row) |
| 4 | hard | 4 | 4 |
| 5 | hard | 4 | **3** (2 hard in a row) |
| 6 | easy | 3 | 3 (a new run starts here; the easy sessions 1–3 were done at an earlier level and do not count) |

A finished session always replays the level it was done at, so reloading the page never rewrites history.

### 2. A level becomes a plan

Every exercise in `src/data/catalog.ts` has a `minLevel` and a `maxLevel`. An exercise is **eligible** for a level when `minLevel <= level <= maxLevel`. So the difficulty of a level is simply *which exercises are in its pool*:

- levels 1–2 are the beginner band,
- level 3 is the intermediate band and has the most choice,
- levels 4–5 are the advanced band.

An exercise can span several levels (for example 1–3), so the pools overlap and progress feels gradual. The catalog keeps at least 3 eligible exercises per kind at every level.

To build a session the planner:

1. **Chooses the slots.** The four main slots are `warmup`, `chords`, `rhythm` and `lesson`. The starting slot rotates with the session number, so the opener changes from session to session.
2. **Picks one exercise per slot.** From the pool of that kind at your level it takes `pool[sessionIndex % pool.length]`, where `sessionIndex` is the total number of sessions you have finished. Each new session therefore moves along the pool and brings new material. Missing a day does not skip anything.
3. **Adds a `scales` filler.** It is picked the same way and absorbs leftover minutes.
4. **Fits the 30 minute budget.** Each pick gets at most the time that is left, picks that no longer fit are dropped, and any remaining minutes stretch the last item. The total is always exactly 30.

The plan depends only on the level, the session number and the catalog, so it is the same every time you reload.

### What it does not do yet

The pick is by rotation, not by memory. gmate does not record which exercises you have already done, so once a pool is used up an exercise can come round again. Preferring exercises you have not seen is a natural next step.

## How gmate finds the YouTube video for a level

gmate does not search YouTube. Every video is **picked by hand and stored in the catalog**, and the level reaches it through the lesson it belongs to. Only `lesson` exercises have videos. Warm-ups, chords, rhythm and scales are text only.

In `src/data/catalog.ts` each lesson lists its level range and its video ids by language:

```ts
lesson('lesson-blues', 10, [3, 5], '12-bar blues in A', { en: 'rLm99QI8eWs', vi: 'u9CRfc20FN0' }),
//      id             min  levels  title                  YouTube video ids
```

The path from your level to a video is:

1. **Level → lessons.** Your level picks the eligible lessons, those whose range includes it. At level 3 that is seven lessons, at level 1 only three.
2. **Lesson → one pick.** The planner takes one of them with the same rotation as every other slot (see above), so the video changes from session to session.
3. **Lesson → video, by language.** `videoFor` in `src/core/video.ts` uses the language you chose on the page (English or Tiếng Việt):
   - the lesson has a video in that language: it is used,
   - it has none but has an English one: the English video is shown with a note, "No Tiếng Việt video for this lesson yet, showing English",
   - it has no video at all: no player is shown, and the lesson gets a **Search YouTube** link for "*<lesson title>* guitar lesson" instead.
4. **Embed.** The video is shown in a privacy-friendly `youtube-nocookie.com` player. Changing the language swaps only the player, so a lesson is not reset when you press "Mark session done".

Because the match is lesson to level, a video's difficulty is whatever level range the lesson was given when it was added. A video for beginners should sit on a lesson with a low range such as `[1, 2]`, and an advanced one on `[4, 5]`.

### Adding or checking videos

- To add a video, add a `lesson(...)` entry with its level range and video ids. The id is the part after `v=` in the YouTube URL.
- Run `npm run check-catalog`. It asks YouTube's oEmbed endpoint about every id and reports whether it is `ok`, `missing` or `not embeddable`. It also lists lessons that have no video in a language. It exits with an error if any video fails, so it is safe to run in CI.

## Sessions, days and streaks

- You can finish several sessions in a day. After one, **Next session →** starts the next.
- Every session is recorded with its date, its number within the day, its level and your rating.
- A **streak** counts days, not sessions. Two sessions on one day count once. The streak stays alive through yesterday while today is still open.
- **Total sessions** in the progress panel counts every session.

## Sync and login

- Progress is cached in the browser (`localStorage`) and synced to Cloudflare KV through `/api/state`.
- When two devices have different data they are merged: sessions from both are kept, and the level and settings come from the device edited last.
- Login is a one-time email link sent with Resend, valid for 15 minutes. It opens a 30 day session cookie that renews while you use the app. Only the address in `ALLOWED_EMAIL` can log in.

## Develop

```
npm install
npm run dev          # Vite with hot reload, no login, progress in localStorage only
npm run dev:worker   # builds, then runs the Worker locally with login switched off
npm test             # unit tests, run in two time zones
npm run typecheck
npm run build
npm run check-catalog   # checks that the catalog's YouTube videos still embed
```

`npm run dev:worker` passes `AUTH_DISABLED:true` on the command line only, so it can never be deployed by accident. To try the real login locally, copy `.dev.vars.example` to `.dev.vars`, fill it in, and run `npx wrangler dev`. Without a `RESEND_API_KEY` the login link is printed in the terminal.

## Deploy (Cloudflare free tier)

```
npx wrangler login
npx wrangler secret put SESSION_SECRET   # a long random string, e.g. openssl rand -hex 32
npx wrangler secret put ALLOWED_EMAIL    # the only address that can log in
npx wrangler secret put RESEND_API_KEY   # from resend.com
npm run deploy
```

The first deploy creates the KV namespace. Never set `AUTH_DISABLED` on the deployed Worker. Without a verified Resend domain, mail can only be sent to the email of your own Resend account, which is fine for one user.

The app stays inside the free limits: Workers 100k requests a day, KV 100k reads and 1k writes a day, Resend 100 emails a day.

## Layout

```
src/core      plan, adapt, streak, storage, sync (pure logic, fully tested)
src/data      the exercise catalog
src/ui        views and DOM
worker        Cloudflare Worker: login, session cookie, state API
```
