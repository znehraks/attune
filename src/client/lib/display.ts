import { DEFAULT_DISPLAY, DEFAULT_NEEDS, resolveDesign, type DesignDecision, type Display, type Needs } from '../../shared/needs';

// Display store: needs (declared by the agent or the reader) + explicit overrides → effective display,
// applied to <html> as data attributes so CSS does the rest. Persisted in this browser only.

const NEEDS_KEY = 'attune:needs';
const OVERRIDE_KEY = 'attune:display';
type Listener = () => void;

export interface DisplayEvent {
  at: number;
  source: 'agent' | 'hand' | 'system';
  changes: string[];
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<T>) } : fallback;
  } catch {
    return fallback;
  }
}

class DisplayStore {
  needs: Needs = load(NEEDS_KEY, DEFAULT_NEEDS);
  overrides: Partial<Display> = load(OVERRIDE_KEY, {} as Partial<Display>);
  focusSection: string | null = null;
  log: DisplayEvent[] = [];
  private listeners = new Set<Listener>();

  constructor() {
    if (typeof document !== 'undefined') this.apply();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Effective display and the reasons behind the inferred part. */
  resolve(): { display: Display; decisions: DesignDecision[]; overridden: (keyof Display)[] } {
    const { display, decisions } = resolveDesign(this.needs);
    const overridden = Object.keys(this.overrides) as (keyof Display)[];
    return { display: { ...display, ...this.overrides }, decisions, overridden };
  }

  get display(): Display {
    return this.resolve().display;
  }

  private persist(source: DisplayEvent['source'], changes: string[]): void {
    try {
      localStorage.setItem(NEEDS_KEY, JSON.stringify(this.needs));
      localStorage.setItem(OVERRIDE_KEY, JSON.stringify(this.overrides));
    } catch {
      /* private mode */
    }
    if (changes.length) this.log = [...this.log.slice(-29), { at: Date.now(), source, changes }];
    this.apply();
    for (const fn of this.listeners) fn();
  }

  apply(): void {
    const d = this.display;
    const el = document.documentElement;
    el.dataset.theme = d.theme;
    el.dataset.text = d.textSize;
    el.dataset.font = d.font;
    el.dataset.spacing = d.spacing;
    el.dataset.layout = d.layout;
    el.dataset.targets = d.targets;
    el.dataset.motion = d.reducedMotion ? 'reduced' : 'normal';
    el.dataset.panels = d.showPanels ? 'on' : 'off';
    el.dataset.spotlight = d.spotlight || this.focusSection ? 'on' : 'off';
    el.dataset.colorsafe = d.colorSafe ? 'on' : 'off';
    el.dataset.focus = this.focusSection ?? '';
    el.style.colorScheme = d.theme === 'dark' ? 'dark' : 'light';
  }

  declareNeeds(partial: Partial<Needs>, source: 'agent' | 'hand'): string[] {
    const changes: string[] = [];
    const next = { ...this.needs };
    for (const k of ['vision', 'motor', 'reading', 'device', 'light'] as const) {
      const v = partial[k];
      if (v !== undefined && v !== next[k]) {
        next[k] = v as never;
        changes.push(`${k} → ${v}`);
      }
    }
    if (partial.note !== undefined && partial.note !== next.note) {
      next.note = partial.note;
      changes.push('note');
    }
    if (!changes.length) return changes;
    this.needs = next;
    this.persist(source, changes);
    return changes;
  }

  setOverrides(partial: Partial<Display>, source: 'agent' | 'hand'): string[] {
    const changes: string[] = [];
    const next = { ...this.overrides };
    for (const [k, v] of Object.entries(partial) as [keyof Display, Display[keyof Display]][]) {
      if (v === undefined) continue;
      if (next[k] !== v) {
        (next as Record<string, unknown>)[k] = v;
        changes.push(`${k} → ${String(v)}`);
      }
    }
    if (!changes.length) return changes;
    this.overrides = next;
    this.persist(source, changes);
    return changes;
  }

  clearOverrides(source: 'agent' | 'hand'): void {
    this.overrides = {};
    this.persist(source, ['display preferences cleared']);
  }

  setFocus(sectionId: string | null, source: 'agent' | 'hand'): void {
    this.focusSection = sectionId;
    this.persist(source, [sectionId ? `focus → ${sectionId}` : 'focus cleared']);
  }

  reset(): void {
    this.needs = { ...DEFAULT_NEEDS };
    this.overrides = {};
    this.focusSection = null;
    this.log = [];
    this.persist('system', ['display reset']);
  }
}

export const displayStore = new DisplayStore();
