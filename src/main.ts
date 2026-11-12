import { LocalStorage } from './core/storage.ts';
import { CATALOG } from './data/catalog.ts';
import { mountSession } from './ui/mount.ts';
import './ui/style.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (app) mountSession(app, new LocalStorage(), CATALOG, () => new Date());
