import type { Storage } from '../core/storage.ts';
import type { Exercise, Guide, Language } from '../core/types.ts';
import { localDay } from '../core/streak.ts';
import { el, svg } from './dom.ts';
import { createReminderPanel } from './reminderPanel.ts';
import { progressView } from './progressView.ts';
import { createProgressPanel } from './progressPanel.ts';
import { createPastPanel } from './pastPanel.ts';
import {
  backfillExercises,
  currentSession,
  historyView,
  reviewItems,
  LANGUAGE_CHOICES,
  levelChangeMessage,
  markDone,
  RATING_CHOICES,
  sessionView,
  setLanguage,
  type ItemView,
  type LessonMedia,
  type SessionView,
} from './sessionView.ts';

function mediaNode(media: LessonMedia, title: string): HTMLDivElement {
  const area = el('div', { className: 'lesson-media' });
  if (media.type === 'video') {
    area.append(
      el('iframe', {
        className: 'player',
        src: media.embedUrl,
        title,
        allowFullscreen: true,
        loading: 'lazy',
      }),
    );
    if (media.fallbackNote) area.append(el('p', { className: 'fallback-note', role: 'status' }, media.fallbackNote));
  } else {
    area.append(
      el(
        'p',
        { className: 'no-video' },
        `${media.message} `,
        el('a', { href: media.href, target: '_blank', rel: 'noopener noreferrer' }, 'Search YouTube'),
      ),
    );
  }
  return area;
}

function languageControl(
  selected: Language,
  onChoose: (language: Language) => void,
): { node: HTMLElement; select: (language: Language) => void } {
  const buttons = LANGUAGE_CHOICES.map(({ language, label }) =>
    el('button', { type: 'button', className: 'segment', role: 'radio', id: `lang-${language}` }, label),
  );
  const group = el('div', { className: 'segments segments-2', role: 'radiogroup', ariaLabel: 'Lesson video language' }, ...buttons);

  function select(language: Language): void {
    LANGUAGE_CHOICES.forEach((choice, i) => {
      const on = choice.language === language;
      const button = buttons[i];
      if (!button) return;
      button.ariaChecked = String(on);
      button.tabIndex = on ? 0 : -1;
    });
  }

  buttons.forEach((button, i) => {
    button.addEventListener('click', () => {
      const choice = LANGUAGE_CHOICES[i];
      if (choice) onChoose(choice.language);
    });
    button.addEventListener('keydown', (event) => {
      const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
      if (step === 0) return;
      event.preventDefault();
      const nextIndex = (i + step + buttons.length) % buttons.length;
      buttons[nextIndex]?.focus();
      buttons[nextIndex]?.click();
    });
  });
  select(selected);

  const node = el('div', { className: 'lesson-language' }, el('span', { className: 'rating-label' }, 'Lesson video language'), group);
  return { node, select };
}

function guideNode(guide: Guide): HTMLDetailsElement {
  return el(
    'details',
    { className: 'guide', open: true },
    el('summary', {}, 'How to practise'),
    el('p', { className: 'guide-goal' }, el('strong', {}, 'Goal: '), guide.goal),
    el('ol', { className: 'guide-steps' }, ...guide.steps.map((step) => el('li', {}, step))),
    guide.tips.length > 0
      ? el('ul', { className: 'guide-tips' }, ...guide.tips.map((tip) => el('li', {}, tip)))
      : '',
    el('p', { className: 'guide-check' }, el('strong', {}, 'You have it when: '), guide.check),
  );
}

function itemNode(item: ItemView, media: HTMLDivElement | undefined): HTMLLIElement {
  const li = el(
    'li',
    { className: `item item-${item.kind}` },
    el(
      'div',
      { className: 'item-head' },
      el('span', { className: 'item-title' }, item.title),
      el('span', { className: 'item-minutes' }, item.minutesLabel),
    ),
  );
  if (media) li.append(media);
  li.append(guideNode(item.guide));
  return li;
}

function flameIcon(): SVGSVGElement {
  return svg(
    'svg',
    { class: 'flame', viewBox: '0 0 24 32', 'aria-hidden': 'true' },
    svg('path', {
      class: 'flame-outer',
      d: 'M12 1c1.2 5.4 7.6 9.3 9.6 15.2C23.8 23 19.2 31 12 31S.2 23.6 2.6 16.6c1.2-3.4 3.6-5.2 4.4-8.6 1.9 2.2 2.3 4.4 2.1 6.6C11.8 11 12.9 6.6 12 1Z',
    }),
    svg('path', {
      class: 'flame-inner',
      d: 'M12.2 14.5c.6 3.2 4.6 5.4 4.6 9.1 0 3.4-2.2 5.6-4.8 5.6s-4.8-2-4.8-5.1c0-2.1 1.2-3.5 2.1-4.9.8 1 1.1 2 1.1 3 1.3-2.2 2.2-4.6 1.8-7.7Z',
    }),
  );
}

// Width and height match the SVG viewBox (321x100) so the header does not shift while the logo loads.
function logo(): HTMLPictureElement {
  return el(
    'picture',
    {},
    el('source', { media: '(prefers-color-scheme: dark)', srcset: '/gmate-logo-dark.svg' }),
    el('img', { src: '/gmate-logo.svg', alt: 'gmate', width: 116, height: 36 }),
  );
}

function dateHeading(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, date ?? 1).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * A session's plan and iframes are built once; later renders touch only streak and button,
 * so marking done never restarts the video. Changing language swaps only the media areas,
 * and "Next session" is the only thing that replaces the plan.
 */
export function mountSession(
  root: HTMLElement,
  storage: Storage,
  catalog: readonly Exercise[],
  now: () => Date,
): void {
  const day = localDay(now());
  const loaded = storage.load();
  const backfilled = backfillExercises(loaded, catalog);
  if (backfilled !== loaded) storage.save(backfilled);
  let sessionNumber = currentSession(backfilled, day);
  let reviewing: string | undefined;
  const view = (): SessionView => sessionView(storage.load(), day, catalog, sessionNumber);
  const initial = view();
  const mediaAreas = new Map<string, HTMLDivElement>();
  const plan = el('ol', { id: 'plan' });
  function buildPlan(items: SessionView['items']): void {
    mediaAreas.clear();
    plan.replaceChildren(
      ...items.map((item) => {
        const area = item.media ? mediaNode(item.media, item.title) : undefined;
        if (area) mediaAreas.set(item.id, area);
        return itemNode(item, area);
      }),
    );
  }
  buildPlan(initial.items);
  /** Replaces every player with a fresh one, which also stops anything that is playing. */
  function refreshMedia(): void {
    for (const item of view().items) {
      const old = mediaAreas.get(item.id);
      if (!old || !item.media) continue;
      const fresh = mediaNode(item.media, item.title);
      old.replaceWith(fresh);
      mediaAreas.set(item.id, fresh);
    }
  }
  const language = languageControl(storage.load().settings.language, (chosen) => {
    storage.save(setLanguage(storage.load(), chosen));
    language.select(chosen);
    refreshMedia();
  });

  const current = el('strong', { id: 'streak-current' });
  const longest = el('strong', { id: 'streak-longest' });
  const button = el('button', { id: 'mark-done', type: 'button' });
  const ratingPrompt = el(
    'div',
    { id: 'rating-prompt', hidden: true, role: 'group', ariaLabel: 'How was the session?' },
    el('p', { className: 'rating-label' }, 'How was the session?'),
    el('div', { className: 'segments' }, ...RATING_CHOICES.map(({ rating, label }) => {
      const choice = el('button', { type: 'button', className: 'rating', id: `rate-${rating}` }, label);
      choice.addEventListener('click', () => {
        const before = storage.load();
        const after = markDone(before, day, sessionNumber, rating, view().exercises);
        storage.save(after);
        levelNote.textContent = levelChangeMessage(before.level, after.level);
        update();
      });
      return choice;
    })),
  );
  let asking = false;
  const levelNote = el('p', { id: 'level-change', role: 'status' });
  const nextButton = el('button', { id: 'next-session', type: 'button', hidden: true }, 'Next session →');
  const title = el('h2', { id: 'session-title' });
  const total = el('p', { id: 'total' });
  const levelLabel = el('span', { className: 'level' });
  const status = el('p', { id: 'done-status', role: 'status' });
  const progress = createProgressPanel();
  const reminder = createReminderPanel(storage, now);

  const logout = el('button', { type: 'button', className: 'logout' }, 'Log out');
  logout.addEventListener('click', async () => {
    logout.disabled = true;
    try {
      await fetch('/auth/logout', { method: 'POST' });
      location.reload();
    } catch {
      logout.disabled = false;
    }
  });

  button.addEventListener('click', () => {
    asking = true;
    update();
  });

  nextButton.addEventListener('click', () => {
    sessionNumber += 1;
    asking = false;
    levelNote.textContent = '';
    buildPlan(view().items);
    update();
  });

  const reviewTitle = el('h2', { id: 'review-title' });
  const reviewMeta = el('p', { id: 'review-meta' });
  const reviewPlan = el('ol', { id: 'review-plan' });
  const reviewBack = el('button', { id: 'review-back', type: 'button' }, '← Back to today');
  reviewBack.addEventListener('click', () => review(undefined));
  const reviewSection = el(
    'section',
    { id: 'review', hidden: true },
    el('header', { className: 'session-head' }, reviewTitle, reviewMeta),
    reviewPlan,
    reviewBack,
  );
  const past = createPastPanel((key) => review(key === reviewing ? undefined : key));

  /** Shows a finished session in place of today's, or goes back to today when given nothing. */
  function review(key: string | undefined): void {
    reviewing = key;
    const entry = key === undefined ? undefined : historyView(storage.load(), catalog).find((e) => e.key === key);
    if (!entry) reviewing = undefined;
    if (entry) refreshMedia();
    session.hidden = entry !== undefined;
    reviewSection.hidden = entry === undefined;
    reviewPlan.replaceChildren(
      ...(entry ? reviewItems(entry, storage.load().settings.language).map((item) => itemNode(item, item.media ? mediaNode(item.media, item.title) : undefined)) : []),
    );
    if (entry) {
      reviewTitle.textContent = `Reviewing ${dateHeading(entry.date)}`;
      reviewMeta.textContent = [`Session ${entry.session}`, entry.levelLabel, entry.totalLabel].join(' · ');
      reviewSection.scrollIntoView({ block: 'start' });
    }
    past.render(historyView(storage.load(), catalog), reviewing);
  }

  function update(): void {
    past.render(historyView(storage.load(), catalog), reviewing);
    const v = view();
    title.textContent = v.title;
    total.textContent = v.totalLabel;
    levelLabel.textContent = v.levelLabel;
    nextButton.hidden = !v.done;
    progress.render(progressView(storage.load(), day));
    reminder.refresh();
    current.textContent = String(v.currentStreak);
    longest.textContent = String(v.longestStreak);
    button.disabled = v.done;
    button.hidden = asking && !v.done;
    ratingPrompt.hidden = !asking || v.done;
    button.textContent = v.done ? 'Session done ✓' : 'Mark session done';
    button.classList.toggle('is-done', v.done);
    session.classList.toggle('is-done', v.done);
    session.classList.toggle('has-streak', v.currentStreak > 0);
    status.textContent = v.done ? 'Nice work. Ready for another?' : '';
  }

  const session = el(
    'section',
    { id: 'session' },
    el(
      'header',
      { className: 'session-head' },
      title,
      total,
    ),
    language.node,
    plan,
    el(
      'div',
      { className: 'finish' },
      el(
        'div',
        { className: 'streaks' },
        flameIcon(),
        el(
          'p',
          { className: 'streak-current' },
          current,
          el('span', { className: 'streak-unit' }, ' day streak'),
        ),
        el('p', { className: 'streak-longest' }, 'Longest streak ', longest),
      ),
      el('div', { className: 'actions' }, button, ratingPrompt, status, levelNote, nextButton),
    ),
  );

  root.replaceChildren(
    el(
      'header',
      { className: 'masthead' },
      el('h1', { className: 'wordmark' }, logo()),
      el(
        'p',
        { className: 'meta' },
        el('time', { dateTime: initial.date }, dateHeading(initial.date)),
        levelLabel,
      ),
    ),
    el(
      'div',
      { className: 'layout' },
      past.node,
      el('div', { className: 'main' }, reminder.banner, session, reviewSection, progress.node, reminder.node, el('footer', { className: 'page-foot' }, logout)),
    ),
  );
  update();
  reminder.start();
}
