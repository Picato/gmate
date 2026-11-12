import type { Storage } from '../core/storage.ts';
import type { Exercise, LocalDay } from '../core/types.ts';
import { levelChangeMessage, markDone, RATING_CHOICES, sessionView, type ItemView, type SessionView } from './sessionView.ts';

type Clock = () => LocalDay;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function itemNode(item: ItemView): HTMLLIElement {
  const li = el(
    'li',
    { className: 'item' },
    el('span', { className: 'item-title' }, item.title),
    el('span', { className: 'item-minutes' }, item.minutesLabel),
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

/**
 * The plan and its iframe are built once; later renders touch only streak and button,
 * so marking done never restarts the video.
 */
export function mountSession(
  root: HTMLElement,
  storage: Storage,
  catalog: readonly Exercise[],
  today: Clock,
): void {
  const day = today();
  const view = (): SessionView => sessionView(storage.load(), day, catalog);
  const initial = view();

  const current = el('strong', { id: 'streak-current' });
  const longest = el('strong', { id: 'streak-longest' });
  const button = el('button', { id: 'mark-done', type: 'button' });
  const ratingPrompt = el(
    'div',
    { id: 'rating-prompt', hidden: true, role: 'group', ariaLabel: 'How was the session?' },
    ...RATING_CHOICES.map(({ rating, label }) => {
      const choice = el('button', { type: 'button', className: 'rating', id: `rate-${rating}` }, label);
      choice.addEventListener('click', () => {
        const before = storage.load();
        const after = markDone(before, day, rating);
        storage.save(after);
        levelNote.textContent = levelChangeMessage(before.level, after.level);
        update();
      });
      return choice;
    }),
  );
  let asking = false;
  const levelNote = el('p', { id: 'level-change', role: 'status' });
  const status = el('p', { id: 'done-status', role: 'status' });

  button.addEventListener('click', () => {
    asking = true;
    update();
  });

  function update(): void {
    const v = view();
    current.textContent = String(v.currentStreak);
    longest.textContent = String(v.longestStreak);
    button.disabled = v.done;
    button.hidden = asking && !v.done;
    ratingPrompt.hidden = !asking || v.done;
    button.textContent = v.done ? 'Session done ✓' : 'Mark session done';
    button.classList.toggle('is-done', v.done);
    status.textContent = v.done ? 'Nice work. See you tomorrow.' : '';
  }

  root.replaceChildren(
    el('h1', {}, 'gmate'),
    el('p', { className: 'meta' }, `${initial.date} · ${initial.levelLabel}`),
    el('ol', { id: 'plan' }, ...initial.items.map(itemNode)),
    el('p', { id: 'total' }, initial.totalLabel),
    el('p', { className: 'streaks' }, 'Current streak: ', current, ' days · Longest: ', longest, ' days'),
    button,
    ratingPrompt,
    status,
    levelNote,
  );
  update();
}
