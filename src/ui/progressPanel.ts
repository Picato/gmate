import { el } from './dom.ts';
import type { ProgressView } from './progressView.ts';

export function createProgressPanel(): { node: HTMLElement; render: (view: ProgressView) => void } {
  const stats = el('dl', { className: 'stats' });
  const grid = el('ol', { id: 'history', className: 'history', ariaLabel: 'Last 14 days' });
  const node = el('section', { id: 'progress' }, el('h2', {}, 'Progress'), stats, grid);

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
        ...rows.flatMap(([term, value]) => [el('dt', {}, term), el('dd', {}, value)]),
      );
      grid.replaceChildren(
        ...view.days.map((d) =>
          el('li', { className: d.done ? 'day done' : 'day missed', title: d.label, ariaLabel: d.label }),
        ),
      );
    },
  };
}
