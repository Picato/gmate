import {
  DEFAULT_LANGUAGE,
  DEFAULT_LEVEL,
  parseLanguage,
  parseLevel,
  parseLocalDay,
  parseRating,
  parseReminderTime,
  type AppState,
  type Completion,
  type PlannedExercise,
} from './types.ts';

export interface Storage {
  load(): AppState;
  save(state: AppState): void;
}

export function defaultState(): AppState {
  return { level: DEFAULT_LEVEL, completions: [], settings: { language: DEFAULT_LANGUAGE } };
}

const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  typeof raw === 'object' && raw !== null && !Array.isArray(raw);

/** Data saved before multi-session days has no `session`; it was the day's only one. */
const parseSession = (raw: unknown): number => (Number.isInteger(raw) && (raw as number) >= 1 ? (raw as number) : 1);

function parseExercises(raw: unknown): PlannedExercise[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const exercises = raw.flatMap((entry): PlannedExercise[] =>
    isRecord(entry) && typeof entry.id === 'string' && entry.id !== '' && Number.isInteger(entry.minutes) && (entry.minutes as number) > 0
      ? [{ id: entry.id, minutes: entry.minutes as number }]
      : [],
  );
  return exercises.length > 0 ? exercises : undefined;
}

function parseCompletions(raw: unknown): Completion[] {
  if (!Array.isArray(raw)) return [];
  const bySession = new Map<string, Completion>();
  for (const entry of raw) {
    if (!isRecord(entry)) continue;
    const date = parseLocalDay(entry.date);
    const level = parseLevel(entry.level);
    const session = parseSession(entry.session);
    if (date && level) bySession.set(`${date}#${session}`, {
        date,
        session,
        level,
        rating: parseRating(entry.rating),
        exercises: parseExercises(entry.exercises),
      });
  }
  return [...bySession.values()].sort((a, b) => a.date.localeCompare(b.date) || a.session - b.session);
}

/** Total: any input yields a valid AppState, each field falling back to its default. */
export function parseAppState(raw: unknown): AppState {
  if (!isRecord(raw)) return defaultState();
  const settings = isRecord(raw.settings) ? raw.settings : {};
  return {
    level: parseLevel(raw.level) ?? DEFAULT_LEVEL,
    completions: parseCompletions(raw.completions),
    settings: {
      language: parseLanguage(settings.language) ?? DEFAULT_LANGUAGE,
      reminderTime: parseReminderTime(settings.reminderTime),
    },
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
