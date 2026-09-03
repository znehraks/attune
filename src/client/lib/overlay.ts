// Author studio state: proposals from the author's agent and the blocks the author approved.
// Lives in this browser (the author's), merged into the built-in article at runtime, exportable as JSON.

import type { Article, Block, Faq, Lang, Level } from '../../shared/content';

export interface Proposal {
  id: string;
  at: number;
  by: 'agent' | 'hand';
  kind: 'level' | 'plainer' | 'faq';
  /** source block this proposal derives from (level/plainer) */
  sourceId?: string;
  level?: Level;
  text?: { en: string; ko: string };
  faq?: Faq;
  rationale?: string;
  status: 'pending' | 'approved' | 'rejected';
  decidedAt?: number;
}

interface StudioState {
  proposals: Proposal[];
}

type Listener = () => void;
const KEY = (slug: string) => `attune:studio:${slug}`;

function load(slug: string): StudioState {
  try {
    const raw = localStorage.getItem(KEY(slug));
    return raw ? (JSON.parse(raw) as StudioState) : { proposals: [] };
  } catch {
    return { proposals: [] };
  }
}

class StudioStore {
  private states = new Map<string, StudioState>();
  private listeners = new Set<Listener>();

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit(): void {
    for (const fn of this.listeners) fn();
  }
  state(slug: string): StudioState {
    let s = this.states.get(slug);
    if (!s) {
      s = load(slug);
      this.states.set(slug, s);
    }
    return s;
  }
  private persist(slug: string): void {
    try {
      localStorage.setItem(KEY(slug), JSON.stringify(this.state(slug)));
    } catch {
      /* ignore */
    }
    this.emit();
  }
  propose(slug: string, p: Omit<Proposal, 'id' | 'at' | 'status'>): Proposal {
    const prop: Proposal = { ...p, id: Math.random().toString(36).slice(2, 9), at: Date.now(), status: 'pending' };
    this.state(slug).proposals.push(prop);
    this.persist(slug);
    return prop;
  }
  decide(slug: string, id: string, status: 'approved' | 'rejected'): Proposal | null {
    const p = this.state(slug).proposals.find((x) => x.id === id);
    if (!p) return null;
    p.status = status;
    p.decidedAt = Date.now();
    this.persist(slug);
    return p;
  }
  withdraw(slug: string, id: string): boolean {
    const s = this.state(slug);
    const before = s.proposals.length;
    s.proposals = s.proposals.filter((x) => !(x.id === id && x.status === 'pending'));
    this.persist(slug);
    return s.proposals.length < before;
  }
  clear(slug: string): void {
    this.states.set(slug, { proposals: [] });
    this.persist(slug);
  }
  pending(slug: string): Proposal[] {
    return this.state(slug).proposals.filter((p) => p.status === 'pending');
  }
  approved(slug: string): Proposal[] {
    return this.state(slug).proposals.filter((p) => p.status === 'approved');
  }
}

export const studioStore = new StudioStore();

/** Build the block an approved proposal contributes. */
export function proposalToBlock(article: Article, p: Proposal): Block | null {
  if (p.kind === 'faq' || !p.sourceId || !p.text) return null;
  const src = article.blocks.find((b) => b.id === p.sourceId);
  if (!src) return null;
  if (p.kind === 'plainer') {
    return { id: `${src.id}--plainer-${p.id}`, kind: src.kind === 'heading' ? 'para' : src.kind, levels: src.levels, priority: src.priority, section: src.section, teaches: src.teaches, requires: src.requires, goals: src.goals, simplerOf: src.id, text: p.text };
  }
  const level = p.level ?? 'novice';
  return { id: `${src.id}--${level}-${p.id}`, kind: src.kind === 'heading' ? 'para' : src.kind, levels: [level], priority: src.priority, section: src.section, teaches: src.teaches, requires: src.requires, goals: src.goals, text: p.text };
}

/** The built-in article plus everything the author approved, in author order. */
export function applyOverlay(article: Article): Article {
  const approved = studioStore.approved(article.slug);
  if (approved.length === 0) return article;
  const blocks: Block[] = [];
  const faq: Faq[] = [...article.faq];
  const byId = new Map(article.blocks.map((b) => [b.id, b]));
  for (const b of article.blocks) {
    blocks.push(b);
    for (const p of approved) {
      if (p.sourceId === b.id) {
        const nb = proposalToBlock(article, p);
        if (nb && !blocks.some((x) => x.id === nb.id)) blocks.push(nb);
      }
    }
  }
  for (const p of approved) if (p.kind === 'faq' && p.faq && !faq.some((f) => f.id === p.faq!.id)) faq.push(p.faq);
  void byId;
  return { ...article, blocks, faq };
}

/** Coverage report the author (and their agent) can act on. */
export function coverage(article: Article) {
  const LEVELS: Level[] = ['novice', 'intermediate', 'expert'];
  const sections = article.blocks.filter((b) => b.kind === 'heading');
  const perSection = sections.map((h) => {
    const inSec = article.blocks.filter((b) => b.section === h.id && b.kind !== 'heading');
    const byLevel = Object.fromEntries(LEVELS.map((l) => [l, inSec.filter((b) => b.levels.includes(l)).length])) as Record<Level, number>;
    return { section_id: h.id, title: h.text.en, blocks: inSec.length, by_level: byLevel, weakest: LEVELS.reduce((a, b) => (byLevel[b] < byLevel[a] ? b : a)) };
  });
  const withoutPlainer = article.blocks.filter((b) => (b.kind === 'para' || b.kind === 'list') && !b.levels.includes('novice') && !article.blocks.some((x) => x.simplerOf === b.id));
  const singleLevel = article.blocks.filter((b) => (b.kind === 'para' || b.kind === 'list') && b.levels.length === 1);
  return {
    sections: perSection,
    blocks_without_plainer_version: withoutPlainer.map((b) => b.id),
    blocks_written_for_one_level_only: singleLevel.map((b) => ({ block_id: b.id, level: b.levels[0], section: b.section })),
    faq_count: article.faq.length,
  };
}

export function textFor(article: Article, id: string, lang: Lang): string {
  const b = article.blocks.find((x) => x.id === id);
  return b ? b.text[lang] : '';
}
