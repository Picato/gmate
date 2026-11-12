import { needsBanner } from '../core/reminder.ts';
import { remindedStore, remindTick } from '../core/reminderTicker.ts';
import type { Storage } from '../core/storage.ts';
import { parseReminderTime } from '../core/types.ts';
import { el } from './dom.ts';

export const TICK_MS = 30_000;

const notificationsAvailable = () => typeof Notification !== 'undefined';

const permissionLabel = () =>
  notificationsAvailable() ? `Notifications: ${Notification.permission}` : 'Notifications are not supported here';

export function createReminderPanel(storage: Storage, now: () => Date) {
  const reminded = remindedStore(localStorage);

  const banner = el('p', { id: 'banner', role: 'status' }, "You haven't practised today");
  const timeInput = el('input', { id: 'reminder-time', type: 'time' });
  const permission = el('button', { id: 'enable-notifications', type: 'button' }, 'Enable notifications');
  const permissionStatus = el('span', { id: 'notification-status' });

  timeInput.value = storage.load().settings.reminderTime ?? '';
  timeInput.addEventListener('change', () => {
    const state = storage.load();
    storage.save({ ...state, settings: { ...state.settings, reminderTime: parseReminderTime(timeInput.value) } });
  });
  permission.disabled = !notificationsAvailable();
  permission.addEventListener('click', () => {
    void Notification.requestPermission().then(refresh);
  });

  function refresh(): void {
    permissionStatus.textContent = permissionLabel();
    banner.hidden = !needsBanner(now(), storage.load().completions);
  }

  const node = el(
    'section',
    { id: 'reminder' },
    el('h2', {}, 'Daily reminder'),
    el(
      'div',
      { className: 'reminder-row' },
      el('label', { className: 'reminder-time' }, 'Remind me at ', timeInput),
      el('div', { className: 'reminder-notify' }, permission, permissionStatus),
    ),
  );

  function start(): void {
    const tick = () =>
      remindTick({
        now,
        state: () => storage.load(),
        lastRemindedOn: reminded.load,
        markReminded: reminded.save,
        canNotify: () => notificationsAvailable() && Notification.permission === 'granted',
        notify: () => {
          new Notification('Time to practise guitar', { body: "Today's 30 minute session is waiting." });
        },
      });
    setInterval(tick, TICK_MS);
  }

  refresh();
  return { banner, node, refresh, start };
}
