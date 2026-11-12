import type { Storage } from '../core/storage.ts';
import type { Exercise } from '../core/types.ts';
import { localDay } from '../core/streak.ts';
import { el, svg } from './dom.ts';
import { createReminderPanel } from './reminderPanel.ts';
import { progressView } from './progressView.ts';
import { createProgressPanel } from './progressPanel.ts';
import { levelChangeMessage, markDone, RATING_CHOICES, sessionView, type ItemView, type SessionView } from './sessionView.ts';

function itemNode(item: ItemView): HTMLLIElement {
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
  const { media } = item;
  if (media?.type === 'video') {
    li.append(
      el('iframe', {
        className: 'player',
        src: media.embedUrl,
        title: item.title,
        allowFullscreen: true,
        loading: 'lazy',
      }),
    );
  } else if (media?.type === 'link') {
    li.append(
      el(
        'p',
        { className: 'no-video' },
        `${media.message} `,
        el('a', { href: media.href, target: '_blank', rel: 'noopener noreferrer' }, 'Search YouTube'),
      ),
    );
  }
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
 * so marking done never restarts the video.
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
    el('ol', { id: 'plan' }, ...initial.items.map(itemNode)),
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
