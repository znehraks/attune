// Reading-friction tracker. Runs only in this browser; nothing leaves the page unless the
// reader's agent asks for it with get_reading_friction (and the page shows an indicator).

export interface BlockFriction {
  blockId: string;
  visibleSeconds: number;
  expectedSeconds: number;
  reReads: number;
  lingered: boolean;
  score: number;
}

interface Track {
  visibleMs: number;
  enteredAt: number | null;
  enters: number;
  lastExitAt: number | null;
  expectedMs: number;
}

type Listener = () => void;

export class FrictionTracker {
  private tracks = new Map<string, Track>();
  private observer: IntersectionObserver | null = null;
  private listeners = new Set<Listener>();
  private timer: number | null = null;

  start(root: HTMLElement, expected: (blockId: string) => number): void {
    this.stop();
    if (typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver(
      (entries) => {
        const now = Date.now();
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.block;
          if (!id) continue;
          let t = this.tracks.get(id);
          if (!t) {
            t = { visibleMs: 0, enteredAt: null, enters: 0, lastExitAt: null, expectedMs: expected(id) * 60000 };
            this.tracks.set(id, t);
          }
          if (e.isIntersecting) {
            if (t.enteredAt === null) {
              // a re-entry after having left for a while counts as a re-read
              if (t.lastExitAt !== null && now - t.lastExitAt > 2500 && t.visibleMs > 1500) t.enters++;
              else if (t.lastExitAt === null) t.enters = Math.max(t.enters, 1);
              t.enteredAt = now;
            }
          } else if (t.enteredAt !== null) {
            t.visibleMs += now - t.enteredAt;
            t.enteredAt = null;
            t.lastExitAt = now;
          }
        }
        this.emit();
      },
      { threshold: 0.6 },
    );
    for (const el of root.querySelectorAll<HTMLElement>('[data-block]')) this.observer.observe(el);
    this.timer = window.setInterval(() => this.emit(), 2000);
  }

  observeNew(root: HTMLElement): void {
    if (!this.observer) return;
    for (const el of root.querySelectorAll<HTMLElement>('[data-block]')) this.observer.observe(el);
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    if (this.timer) window.clearInterval(this.timer);
    this.timer = null;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  clear(): void {
    this.tracks.clear();
    this.emit();
  }

  report(): BlockFriction[] {
    const now = Date.now();
    const out: BlockFriction[] = [];
    for (const [blockId, t] of this.tracks) {
      const visibleMs = t.visibleMs + (t.enteredAt !== null ? now - t.enteredAt : 0);
      const reReads = Math.max(0, t.enters - 1);
      const lingered = visibleMs > Math.max(10000, t.expectedMs * 1.6);
      const score = reReads * 2 + (lingered ? 1 : 0);
      out.push({ blockId, visibleSeconds: Math.round(visibleMs / 1000), expectedSeconds: Math.round(t.expectedMs / 1000), reReads, lingered, score });
    }
    return out.sort((a, b) => b.score - a.score || b.visibleSeconds - a.visibleSeconds);
  }

  friction(): BlockFriction[] {
    return this.report().filter((r) => r.score > 0);
  }
}
