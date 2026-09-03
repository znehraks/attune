import { registry } from './webmcp';
import { navigate } from './router';
import { runDemo, type DemoRunner } from './demoAgent';

// Judge-mode state lives outside any page so captions survive navigation.
type Listener = () => void;
class DemoStore {
  caption: string | null = null;
  runner: DemoRunner | null = null;
  private listeners = new Set<Listener>();
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit(): void {
    for (const fn of this.listeners) fn();
  }
  get running(): boolean {
    return this.runner !== null;
  }
  start(where: 'home' | 'article'): void {
    if (this.runner) return;
    this.runner = runDemo(
      registry,
      {
        say: (c) => {
          this.caption = c;
          this.emit();
        },
        navigate,
        done: () => {
          this.runner = null;
          this.caption = null;
          this.emit();
        },
      },
      where,
    );
    this.emit();
  }
  stop(): void {
    this.runner?.stop();
    this.runner = null;
    this.caption = null;
    this.emit();
  }
}
export const demoStore = new DemoStore();
