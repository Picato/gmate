import { el } from './dom.ts';
import type { ProgressView } from './progressView.ts';

export function createProgressPanel(): { node: HTMLElement; render: (view: ProgressView) => void } {
  const stats = el('dl', { className: 'stats' });
  const grid = el('ol', { id: 'history', className: 'history', ariaLabel: 'Last 14 days' });
  const node = el(
    'section',
    { id: 'progress' },
    el('h2', {}, 'Progress'),
    stats,
    el(
      'figure',
      { className: 'fretboard' },
      grid,
      el(
        'figcaption',
        { className: 'fretboard-scale' },
        el('span', {}, '2 weeks ago'),
        el('span', {}, 'Today'),
      ),
    ),
  );

  return {
    node,
    render(view) {
      const rows: [string, string][] = [
        ['Total sessions', String(view.totalSessions)],
        ['Current streak', `${view.currentStreak} days`],
        ['Longest streak', `${view.longestStreak} days`],
        ['Level', view.levelLabel],
      ];
      stats.replaceChildren(
        ...rows.map(([term, value]) => el('div', { className: 'stat' }, el('dt', {}, term), el('dd', {}, value))),
      );
      grid.replaceChildren(
        ...view.days.map((d, i) =>
          el('li', {
            className: `day ${d.done ? 'done' : 'missed'}${i === view.days.length - 1 ? ' today' : ''}`,
            title: d.label,
            ariaLabel: d.label,
          }),
        ),
      );
    },
  };
}
