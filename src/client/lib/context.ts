import { DEFAULT_CONTEXT, type ReaderContext } from '../../shared/content';

// The reader context is the whole "handshake": everything the page knows about the reader.
// It lives in this browser only (localStorage) and is shown in full on the page.

export interface ContextEvent {
  at: number;
  source: 'agent' | 'hand' | 'system';
  changes: string[];
}

const KEY = 'attune:reader';
const LOG = 'attune:reader:log';
type Listener = () => void;

function load(): ReaderContext {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_CONTEXT, ...(JSON.parse(raw) as Partial<ReaderContext>) };
  } catch {
    /* ignore */
  }
  const nav = (navigator.language || 'en').toLowerCase().startsWith('ko') ? 'ko' : 'en';
  return { ...DEFAULT_CONTEXT, language: nav };
}

function loadLog(): ContextEvent[] {
  try {
    return JSON.parse(localStorage.getItem(LOG) ?? '[]') as ContextEvent[];
  } catch {
    return [];
  }
}

class ContextStore {
  private ctx: ReaderContext = load();
  private listeners = new Set<Listener>();
  log: ContextEvent[] = loadLog();

  get(): ReaderContext {
    return this.ctx;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private persist(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.ctx));
      localStorage.setItem(LOG, JSON.stringify(this.log.slice(-30)));
    } catch {
      /* private mode */
    }
    for (const fn of this.listeners) fn();
  }

  /** Merge a partial context. `knows`/`unknown` are unioned; passing `replaceKnows` resets them. */
  update(partial: Partial<ReaderContext> & { replaceKnows?: boolean }, source: 'agent' | 'hand'): string[] {
    const before = this.ctx;
    const next: ReaderContext = { ...before };
    const changes: string[] = [];
    if (partial.level && partial.level !== before.level) {
      next.level = partial.level;
      changes.push(`level → ${partial.level}`);
    }
    if (partial.language && partial.language !== before.language) {
      next.language = partial.language;
      changes.push(`language → ${partial.language}`);
    }
    if (partial.timeMinutes !== undefined && partial.timeMinutes !== before.timeMinutes) {
      next.timeMinutes = partial.timeMinutes;
      changes.push(partial.timeMinutes ? `time budget → ${partial.timeMinutes} min` : 'time budget → none');
    }
    if (partial.goal && partial.goal !== before.goal) {
      next.goal = partial.goal;
      changes.push(`goal → ${partial.goal}`);
    }
    if (partial.plainLanguage !== undefined && partial.plainLanguage !== before.plainLanguage) {
      next.plainLanguage = partial.plainLanguage;
      changes.push(`plain language → ${partial.plainLanguage ? 'on' : 'off'}`);
    }
    if (partial.note !== undefined && partial.note !== before.note) {
      next.note = partial.note;
      changes.push('note updated');
    }
    if (partial.knows) {
      const set = new Set(partial.replaceKnows ? [] : before.knows);
      for (const k of partial.knows) set.add(k);
      next.knows = [...set];
      next.unknown = before.unknown.filter((u) => !set.has(u));
      const added = partial.knows.filter((k) => !before.knows.includes(k));
      if (added.length || partial.replaceKnows) changes.push(`knows → ${next.knows.join(', ') || '(none)'}`);
    }
    if (partial.unknown) {
      const set = new Set(before.unknown);
      for (const k of partial.unknown) set.add(k);
      next.unknown = [...set];
      next.knows = next.knows.filter((k) => !set.has(k));
      changes.push(`does not know → ${partial.unknown.join(', ')}`);
    }
    if (changes.length === 0) return changes;
    this.ctx = next;
    this.log = [...this.log, { at: Date.now(), source, changes }];
    this.persist();
    return changes;
  }

  reset(): void {
    this.ctx = { ...DEFAULT_CONTEXT, language: this.ctx.language };
    this.log = [{ at: Date.now(), source: 'system', changes: ['everything forgotten'] }];
    this.persist();
  }
}

export const contextStore = new ContextStore();
