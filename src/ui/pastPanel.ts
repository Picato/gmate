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

/** The list of finished sessions. Open beside the plan on wide screens, folded away on narrow ones. */
export function createPastPanel(onPick: (key: string) => void): {
  node: HTMLDetailsElement;
  render: (entries: readonly HistoryEntry[], activeKey: string | undefined) => void;
} {
  const count = el('span', { className: 'past-count' });
  const list = el('ol', { className: 'past-list' });
  const empty = el('p', { className: 'past-empty' }, 'Sessions you finish will appear here, so you can go back to them.');
  const node = el(
    'details',
    { id: 'past', className: 'past', open: !window.matchMedia(NARROW).matches },
    el('summary', {}, 'Past sessions ', count),
    empty,
    list,
  );

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
