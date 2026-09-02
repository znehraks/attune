// Attune content model + edition composer.
// An article is a set of author-written blocks with facets. An *edition* is the subset (and order)
// composed for one reader context: level, language, time budget, goal, and concepts already known.
// Everything here is deterministic: no model rewrites the author's words.

export type Level = 'novice' | 'intermediate' | 'expert';
export type Lang = 'en' | 'ko';
export type Goal = 'understand' | 'decide' | 'build';
export type BlockKind = 'heading' | 'para' | 'list' | 'code' | 'figure' | 'aside' | 'interactive' | 'quote';

export interface L10n {
  en: string;
  ko: string;
}

export interface Concept {
  id: string; // kebab-case, e.g. "json-schema"
  label: L10n;
  /** one-sentence definition, shown in the glossary and used by explain tools */
  definition: L10n;
}

export interface Block {
  id: string; // stable, kebab-case, unique within the article
  kind: BlockKind;
  /** Which editions include this block. A block listed for several levels is shared. */
  levels: Level[];
  /** 1 = must keep even under a tiny time budget … 5 = first to drop. */
  priority: 1 | 2 | 3 | 4 | 5;
  /** Concepts this block explains. If the reader already knows all of them, the block is skipped (unless priority 1). */
  teaches?: string[];
  /** Concepts a reader must know to follow this block. Unknown ones pull in a block that teaches them. */
  requires?: string[];
  /** Reader goals this block serves best. Blocks without goals serve every goal. */
  goals?: Goal[];
  /** Section grouping: the id of the heading block this block belongs to. Headings have none. */
  section?: string;
  /** For blocks that are a plainer rewrite of another block (used by simplify). */
  simplerOf?: string;
  /** Markdown-lite text per language: **bold**, `code`, [link](url), line breaks. For 'list' use "- item" lines. For 'code' the raw code. */
  text: L10n;
  /** For 'figure': an inline SVG id defined by the article's figures map; caption in text. */
  figure?: string;
  /** For 'interactive': the component id; the article page renders it. */
  interactive?: string;
}

export interface Faq {
  id: string;
  /** keywords (lowercase, both languages) that should match the question */
  keywords: string[];
  question: L10n;
  answer: L10n;
}

export interface Article {
  slug: string;
  title: L10n;
  deck: L10n;
  author: string;
  date: string; // YYYY-MM-DD
  /** Interactive components the article owns (rendered by the client); params schema is documented for the agent */
  interactives?: Record<string, { title: L10n; description: L10n; params: Record<string, { type: 'number' | 'string' | 'boolean'; description: string; min?: number; max?: number; enum?: string[]; default: number | string | boolean }> }>;
  concepts: Concept[];
  blocks: Block[];
  faq: Faq[];
  /** inline SVG markup per figure id (no external assets) */
  figures?: Record<string, string>;
}

export interface ReaderContext {
  level: Level;
  language: Lang;
  /** minutes the reader can spend; 0 = no limit */
  timeMinutes: number;
  goal: Goal;
  /** concept ids the reader already knows */
  knows: string[];
  /** concept ids the reader explicitly does NOT know (forces prerequisites in) */
  unknown: string[];
  /** optional accessibility facets */
  plainLanguage?: boolean;
  /** free-text note the reader/agent gave (shown on the page, not used by the algorithm) */
  note?: string;
}

export const DEFAULT_CONTEXT: ReaderContext = { level: 'intermediate', language: 'en', timeMinutes: 0, goal: 'understand', knows: [], unknown: [] };

export interface EditionDecision {
  blockId: string;
  included: boolean;
  reason: string;
}

export interface Edition {
  blocks: Block[];
  minutes: number;
  fullMinutes: number;
  decisions: EditionDecision[];
  /** concepts the reader will need that no included block teaches and the reader does not know */
  gaps: string[];
  context: ReaderContext;
}

const LEVEL_RANK: Record<Level, number> = { novice: 0, intermediate: 1, expert: 2 };

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Reading minutes for one block in one language. English ≈ 220 wpm; Korean ≈ 550 characters/min. Code/figures get a floor. */
export function blockMinutes(block: Block, lang: Lang): number {
  const t = block.text[lang] ?? block.text.en ?? '';
  let m = lang === 'ko' ? t.replace(/\s+/g, '').length / 550 : wordCount(t) / 220;
  if (block.kind === 'code') m = Math.max(m, 0.4);
  if (block.kind === 'figure') m = Math.max(m, 0.3);
  if (block.kind === 'interactive') m = Math.max(m, 0.75);
  if (block.kind === 'heading') m = 0.05;
  return Math.round(m * 100) / 100;
}

function effectivePriority(block: Block, ctx: ReaderContext): number {
  if (block.priority === 1) return 1; // must-keep blocks are never demoted by goal
  let p: number = block.priority;
  if (block.goals && block.goals.length) p += block.goals.includes(ctx.goal) ? -1 : +1;
  return Math.max(1, Math.min(5, p));
}

/**
 * Compose an edition for a reader context. Deterministic and explainable: every block gets a decision.
 */
export function composeEdition(article: Article, input: Partial<ReaderContext>): Edition {
  const ctx: ReaderContext = { ...DEFAULT_CONTEXT, ...input, knows: [...(input.knows ?? [])], unknown: [...(input.unknown ?? [])] };
  const known = new Set(ctx.knows.filter((k) => !ctx.unknown.includes(k)));
  const decisions = new Map<string, EditionDecision>();
  const byId = new Map(article.blocks.map((b) => [b.id, b]));
  const decide = (b: Block, included: boolean, reason: string) => decisions.set(b.id, { blockId: b.id, included, reason });

  // 1) Level filter
  const candidates: Block[] = [];
  for (const b of article.blocks) {
    if (!b.levels.includes(ctx.level)) {
      decide(b, false, `written for ${b.levels.join('/')} readers, not ${ctx.level}`);
      continue;
    }
    candidates.push(b);
  }

  // 2) Skip blocks that only teach what the reader already knows (unless must-keep)
  const stage2: Block[] = [];
  for (const b of candidates) {
    if (b.teaches?.length && b.priority > 1 && b.teaches.every((c) => known.has(c))) {
      decide(b, false, `explains ${b.teaches.join(', ')} — reader already knows it`);
      continue;
    }
    stage2.push(b);
  }

  // 3) Prerequisites: pull in blocks teaching concepts that are required but neither known nor taught
  const taught = new Set(stage2.flatMap((b) => b.teaches ?? []));
  const pulled: Block[] = [];
  for (const b of stage2) {
    for (const c of b.requires ?? []) {
      if (known.has(c) || taught.has(c)) continue;
      // prefer a teaching block at the reader's level or simpler
      const teachers = article.blocks.filter((t) => t.teaches?.includes(c) && !stage2.includes(t) && !pulled.includes(t)).sort((x, y) => Math.abs(LEVEL_RANK[x.levels[0]] - LEVEL_RANK[ctx.level]) - Math.abs(LEVEL_RANK[y.levels[0]] - LEVEL_RANK[ctx.level]));
      const t = teachers[0];
      if (t) {
        pulled.push(t);
        taught.add(c);
        decide(t, true, `pulled in: “${b.id}” needs ${c}, which the reader does not know`);
      }
    }
  }
  // Explicitly-unknown concepts also pull teachers even if nothing 'requires' them.
  for (const c of ctx.unknown) {
    if (taught.has(c)) continue;
    const t = article.blocks.find((t) => t.teaches?.includes(c) && !stage2.includes(t) && !pulled.includes(t));
    if (t) {
      pulled.push(t);
      taught.add(c);
      decide(t, true, `pulled in: reader said they do not know ${c}`);
    }
  }

  // Keep author order
  const order = new Map(article.blocks.map((b, i) => [b.id, i]));
  let selected = [...stage2, ...pulled].sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  for (const b of selected) if (!decisions.has(b.id)) decide(b, true, 'included');

  // 4) Time budget: drop lowest-priority non-heading blocks until within budget.
  const minutesOf = (list: Block[]) => list.reduce((s, b) => s + blockMinutes(b, ctx.language), 0);
  const fullMinutes = Math.round(minutesOf(article.blocks.filter((b) => b.levels.includes(ctx.level))) * 10) / 10;
  if (ctx.timeMinutes > 0) {
    const budget = ctx.timeMinutes;
    let total = minutesOf(selected);
    const droppable = selected.filter((b) => b.kind !== 'heading' && effectivePriority(b, ctx) > 1).sort((a, b) => effectivePriority(b, ctx) - effectivePriority(a, ctx) || order.get(b.id)! - order.get(a.id)!);
    for (const b of droppable) {
      if (total <= budget) break;
      selected = selected.filter((x) => x.id !== b.id);
      total -= blockMinutes(b, ctx.language);
      decide(b, false, `trimmed to fit ${budget} min (priority ${effectivePriority(b, ctx)})`);
    }
  }

  // 5) Drop headings whose section became empty
  const sectionsWithContent = new Set(selected.filter((b) => b.kind !== 'heading').map((b) => b.section).filter(Boolean));
  selected = selected.filter((b) => {
    if (b.kind !== 'heading') return true;
    if (sectionsWithContent.has(b.id)) return true;
    decide(b, false, 'section is empty in this edition');
    return false;
  });

  // Gaps: required concepts still uncovered
  const covered = new Set([...known, ...selected.flatMap((b) => b.teaches ?? [])]);
  const gaps = [...new Set(selected.flatMap((b) => (b.requires ?? []).filter((c) => !covered.has(c))))];

  return {
    blocks: selected,
    minutes: Math.round(minutesOf(selected) * 10) / 10,
    fullMinutes,
    decisions: article.blocks.map((b) => decisions.get(b.id) ?? { blockId: b.id, included: false, reason: 'not selected' }),
    gaps,
    context: ctx,
  };
}

/** Find the plainer rewrite of a block, or a novice-level block teaching the same concepts. */
export function simplerVersion(article: Article, blockId: string): Block | null {
  const direct = article.blocks.find((b) => b.simplerOf === blockId);
  if (direct) return direct;
  const b = article.blocks.find((x) => x.id === blockId);
  if (!b?.teaches?.length) return null;
  return article.blocks.find((x) => x.id !== blockId && x.levels.includes('novice') && !x.levels.includes(b.levels[0]) && x.teaches?.some((c) => b.teaches!.includes(c))) ?? null;
}

/** Deeper material for a section: blocks of higher levels in the same section not already shown. */
export function deeperBlocks(article: Article, edition: Edition, sectionId: string): Block[] {
  const shown = new Set(edition.blocks.map((b) => b.id));
  const rank = LEVEL_RANK[edition.context.level];
  return article.blocks.filter((b) => b.section === sectionId && !shown.has(b.id) && b.kind !== 'heading' && b.levels.some((l) => LEVEL_RANK[l] > rank));
}

const STOP = new Set(['what', 'is', 'the', 'of', 'an', 'a', 'to', 'in', 'do', 'does', 'i', 'it', 'how', 'can', 'my', 'you', 'for', 'on', 'and', 'or', 'are', 'be', 'this', 'that', 'with', 'about', 'why', 'when', 'will', 'should', 'have', 'has', 'was', 'not', 'if', 'from', 'by', 'at', 'as', 'me', 'we', 'your', 'our', 'there', 'any', 'all']);

export function findFaq(article: Article, question: string, lang: Lang): { faq: Faq; score: number }[] {
  const q = question.toLowerCase();
  const tokens = q.split(/[^a-z0-9가-힣]+/).filter((t) => t.length > 2 && !STOP.has(t));
  return article.faq
    .map((f) => {
      let score = 0;
      for (const k of f.keywords) if (q.includes(k.toLowerCase())) score += 3;
      const qs = `${f.question[lang]} ${f.question.en}`.toLowerCase();
      for (const t of tokens) if (qs.includes(t)) score += 1;
      return { faq: f, score };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score);
}

export function outline(edition: Edition, lang: Lang): { id: string; title: string; minutes: number; blocks: number }[] {
  const out: { id: string; title: string; minutes: number; blocks: number }[] = [];
  let current: { id: string; title: string; minutes: number; blocks: number } | null = null;
  for (const b of edition.blocks) {
    if (b.kind === 'heading') {
      current = { id: b.id, title: b.text[lang], minutes: 0, blocks: 0 };
      out.push(current);
    } else if (current) {
      current.minutes = Math.round((current.minutes + blockMinutes(b, lang)) * 10) / 10;
      current.blocks++;
    } else {
      current = { id: '_intro', title: lang === 'ko' ? '도입' : 'Introduction', minutes: blockMinutes(b, lang), blocks: 1 };
      out.push(current);
    }
  }
  return out;
}

/** Validate an article at build/test time so authoring mistakes surface early. */
export function validateArticle(a: Article): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  const concepts = new Set(a.concepts.map((c) => c.id));
  for (const b of a.blocks) {
    if (ids.has(b.id)) errs.push(`duplicate block id ${b.id}`);
    ids.add(b.id);
    if (!b.levels?.length) errs.push(`${b.id}: no levels`);
    if (!b.text?.en || !b.text?.ko) errs.push(`${b.id}: missing en/ko text`);
    for (const c of [...(b.teaches ?? []), ...(b.requires ?? [])]) if (!concepts.has(c)) errs.push(`${b.id}: unknown concept ${c}`);
    if (b.section && !a.blocks.some((h) => h.id === b.section && h.kind === 'heading')) errs.push(`${b.id}: unknown section ${b.section}`);
    if (b.simplerOf && !a.blocks.some((x) => x.id === b.simplerOf)) errs.push(`${b.id}: simplerOf unknown block ${b.simplerOf}`);
    if (b.kind === 'interactive' && !(a.interactives && b.interactive && a.interactives[b.interactive])) errs.push(`${b.id}: unknown interactive`);
    if (b.kind === 'figure' && !(a.figures && b.figure && a.figures[b.figure])) errs.push(`${b.id}: unknown figure`);
  }
  for (const l of ['novice', 'intermediate', 'expert'] as Level[]) if (!a.blocks.some((b) => b.levels.includes(l) && b.priority === 1)) errs.push(`no priority-1 block for ${l}`);
  return errs;
}
