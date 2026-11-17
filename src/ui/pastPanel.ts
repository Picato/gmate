import { el } from './dom.ts';
import type { HistoryEntry } from './sessionView.ts';

const NARROW = '(max-width: 55.99rem)';

const dateLabel = (day: string): string => {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, date ?? 1).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const COLLAPSED_KEY = 'gmate:past-collapsed:v1';

function savedChoice(): boolean | undefined {
  try {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    return stored === null ? undefined : stored === 'true';
  } catch {
    return undefined;
  }
}

function saveChoice(collapsed: boolean): void {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  } catch {
    // The choice is only a convenience.
  }
}

/**
 * The list of finished sessions. Beside the plan on wide screens, where it folds sideways into a
 * narrow rail; above the plan on narrow ones, where it folds upwards. Starts folded on narrow screens.
 */
export function createPastPanel(onPick: (key: string) => void): {
  node: HTMLElement;
  render: (entries: readonly HistoryEntry[], activeKey: string | undefined) => void;
} {
  const count = el('span', { className: 'past-count' });
  const list = el('ol', { className: 'past-list' });
  const empty = el('p', { className: 'past-empty' }, 'Sessions you finish will appear here, so you can go back to them.');
  const toggle = el(
    'button',
    { type: 'button', className: 'past-toggle' },
    el('span', { className: 'past-chevron', ariaHidden: 'true' }),
    el('span', { className: 'past-label' }, 'Past sessions'),
    count,
  );
  const node = el(
    'aside',
    { id: 'past', className: 'past', ariaLabel: 'Past sessions' },
    toggle,
    el('div', { id: 'past-body', className: 'past-body' }, empty, list),
  );

  toggle.setAttribute('aria-controls', 'past-body');

  function setCollapsed(collapsed: boolean): void {
    node.dataset.collapsed = String(collapsed);
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.title = collapsed ? 'Show past sessions' : 'Hide past sessions';
  }
  setCollapsed(savedChoice() ?? window.matchMedia(NARROW).matches);
  toggle.addEventListener('click', () => {
    const collapsed = node.dataset.collapsed !== 'true';
    setCollapsed(collapsed);
    saveChoice(collapsed);
  });

  return {
    node,
    render(entries, activeKey) {
      count.textContent = entries.length > 0 ? `(${entries.length})` : '';
      empty.hidden = entries.length > 0;
      list.replaceChildren(
        ...entries.map((entry) => {
          const button = el(
            'button',
            { type: 'button', className: 'past-item' },
            el('span', { className: 'past-when' }, `${dateLabel(entry.date)} · Session ${entry.session}`),
            el(
              'span',
              { className: 'past-meta' },
              [entry.levelLabel, entry.ratingLabel, entry.totalLabel].filter(Boolean).join(' · '),
            ),
            el('span', { className: 'past-titles' }, entry.titles.join(', ')),
          );
          if (entry.key === activeKey) button.setAttribute('aria-current', 'true');
          button.addEventListener('click', () => onPick(entry.key));
          return el('li', {}, button);
        }),
      );
    },
  };
}
