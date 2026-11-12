import type { Storage } from '../core/storage.ts';
import type { Exercise, Language } from '../core/types.ts';
import { localDay } from '../core/streak.ts';
import { el, svg } from './dom.ts';
import { createReminderPanel } from './reminderPanel.ts';
import { progressView } from './progressView.ts';
import { createProgressPanel } from './progressPanel.ts';
import {
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

function dateHeading(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, date ?? 1).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * The plan and its iframe are built once; later renders touch only streak and button,
 * so marking done never restarts the video. Changing language swaps only the media areas.
 */
export function mountSession(
  root: HTMLElement,
  storage: Storage,
  catalog: readonly Exercise[],
  now: () => Date,
): void {
  const day = localDay(now());
  const view = (): SessionView => sessionView(storage.load(), day, catalog);
  const initial = view();
  const mediaAreas = new Map<string, HTMLDivElement>();
  const planItems = initial.items.map((item) => {
    const area = item.media ? mediaNode(item.media, item.title) : undefined;
    if (area) mediaAreas.set(item.id, area);
    return itemNode(item, area);
  });
  const language = languageControl(storage.load().settings.language, (chosen) => {
    storage.save(setLanguage(storage.load(), chosen));
    language.select(chosen);
    for (const item of view().items) {
      const old = mediaAreas.get(item.id);
      if (!old || !item.media) continue;
      const fresh = mediaNode(item.media, item.title);
      old.replaceWith(fresh);
      mediaAreas.set(item.id, fresh);
    }
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
        const after = markDone(before, day, rating);
        storage.save(after);
        levelNote.textContent = levelChangeMessage(before.level, after.level);
        update();
      });
      return choice;
    })),
  );
  let asking = false;
  const levelNote = el('p', { id: 'level-change', role: 'status' });
  const status = el('p', { id: 'done-status', role: 'status' });
  const progress = createProgressPanel();
  const reminder = createReminderPanel(storage, now);

  button.addEventListener('click', () => {
    asking = true;
    update();
  });

  function update(): void {
    const v = view();
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
    status.textContent = v.done ? 'Nice work. See you tomorrow.' : '';
  }

  const session = el(
    'section',
    { id: 'session' },
    el(
      'header',
      { className: 'session-head' },
      el('h2', { id: 'session-title' }, "Today's session"),
      el('p', { id: 'total' }, initial.totalLabel),
    ),
    language.node,
    el('ol', { id: 'plan' }, ...planItems),
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
      el('div', { className: 'actions' }, button, ratingPrompt, status, levelNote),
    ),
  );

  root.replaceChildren(
    el(
      'header',
      { className: 'masthead' },
      el('h1', { className: 'wordmark' }, 'gmate'),
      el(
        'p',
        { className: 'meta' },
        el('time', { dateTime: initial.date }, dateHeading(initial.date)),
        el('span', { className: 'level' }, initial.levelLabel),
      ),
    ),
    reminder.banner,
    session,
    progress.node,
    reminder.node,
  );
  update();
  reminder.start();
}
