import {
  DEFAULT_LEVEL,
  parseLevel,
  parseLocalDay,
  parseReminderTime,
  type AppState,
  type Completion,
} from './types.ts';

export interface Storage {
  load(): AppState;
  save(state: AppState): void;
}

export function defaultState(): AppState {
  return { level: DEFAULT_LEVEL, completions: [], settings: {} };
}

const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  typeof raw === 'object' && raw !== null && !Array.isArray(raw);

function parseCompletions(raw: unknown): Completion[] {
  if (!Array.isArray(raw)) return [];
  const byDay = new Map<string, Completion>();
  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    const date = parseLocalDay(entry.date);
    const level = parseLevel(entry.level);
    if (date && level) byDay.set(date, { date, level });
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Total: any input yields a valid AppState, each field falling back to its default. */
export function parseAppState(raw: unknown): AppState {
  if (!isRecord(raw)) return defaultState();
  const settings = isRecord(raw.settings) ? raw.settings : {};
  return {
    level: parseLevel(raw.level) ?? DEFAULT_LEVEL,
    completions: parseCompletions(raw.completions),
    settings: { reminderTime: parseReminderTime(settings.reminderTime) },
  };
}

export class MemoryStorage implements Storage {
  private state: AppState;

  constructor(initial: AppState = defaultState()) {
    this.state = initial;
  }

  load(): AppState {
    return this.state;
  }

  save(state: AppState): void {
    this.state = state;
  }
}

export type KeyValueStore = Pick<globalThis.Storage, 'getItem' | 'setItem'>;

export const STORAGE_KEY = 'gmate:state:v1';

export class LocalStorage implements Storage {
  constructor(private readonly store: KeyValueStore = globalThis.localStorage) {}

  load(): AppState {
    const text = this.store.getItem(STORAGE_KEY);
    if (text === null) return defaultState();
    try {
      return parseAppState(JSON.parse(text));
    } catch {
      return defaultState();
    }
  }

  save(state: AppState): void {
    this.store.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
