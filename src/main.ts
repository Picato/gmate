import { LocalStorage } from './core/storage.ts';
import { SyncedStorage } from './core/syncedStorage.ts';
import { CATALOG } from './data/catalog.ts';
import { mountSession } from './ui/mount.ts';
import './ui/style.css';

const PULL_TIMEOUT_MS = 3000;

const app = document.querySelector<HTMLDivElement>('#app');
if (app) {
  const storage = new SyncedStorage(new LocalStorage(), localStorage, (input, init) => fetch(input, init));
  // Wait briefly for the server so a second device shows its progress; never block on a slow network.
  await Promise.race([storage.pull(), new Promise((resolve) => setTimeout(resolve, PULL_TIMEOUT_MS))]);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') storage.flush();
  });
  mountSession(app, storage, CATALOG, () => new Date());
}
