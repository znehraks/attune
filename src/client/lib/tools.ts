// Tool surfaces. The page decides what an agent can do: on the home page it can learn what is
// here and declare the reader's context; on an article it can read exactly what the human sees,
// reshape the edition, ask the author, operate the interactives, and see where the reader got stuck.

import type { Article, Block, Edition, Goal, Lang, Level, ReaderContext } from '../../shared/content';
import { blockMinutes, composeEdition, findFaq, outline } from '../../shared/content';
import type { ToolSpec } from './webmcp';
import { contextStore } from './context';
import type { FrictionTracker } from './friction';
import type { Params } from '../components/Interactives';

const NO_EXTRA = { additionalProperties: false } as const;
const LEVELS: Level[] = ['novice', 'intermediate', 'expert'];
const LANGS: Lang[] = ['en', 'ko'];
const GOALS: Goal[] = ['understand', 'decide', 'build'];

export interface ArticleBridge {
  article: Article;
  edition: Edition;
  /** block ids shown in addition to the edition (expanded) */
  extras: string[];
  /** original block id → simpler block id currently shown instead */
  swaps: Record<string, string>;
  interactives: Record<string, Params>;
  friction: FrictionTracker;
  recompose: (source: 'agent' | 'hand') => Edition;
  simplify: (blockId: string) => Block | null;
  expand: (sectionId: string) => Block[];
  setInteractive: (id: string, params: Params) => Record<string, unknown>;
  scrollTo: (blockId: string) => void;
  savePlace: (blockId?: string) => string | null;
  resumePlace: () => string | null;
  report: (kind: 'edition' | 'simplify' | 'expand' | 'ask' | 'interactive', source: 'agent' | 'hand') => void;
}

export interface ToolEnv {
  articles: Article[];
  bridge: ArticleBridge | null;
  navigate: (path: string) => void;
  origin: string;
}

const contextSchema = {
  type: 'object',
  properties: {
    level: { type: 'string', enum: LEVELS, description: 'How much the reader already knows about the topic. novice = plain language and analogies; intermediate = comfortable with the field’s basics; expert = wants depth, edge cases and trade-offs.' },
    language: { type: 'string', enum: LANGS, description: 'Language to read in.' },
    time_minutes: { type: 'integer', minimum: 0, maximum: 120, description: 'How many minutes the reader can spend. 0 = no limit. The page trims lower-priority blocks to fit.' },
    goal: { type: 'string', enum: GOALS, description: 'What the reader wants: understand the idea, decide something, or build something (code and steps get priority).' },
    knows: { type: 'array', items: { type: 'string' }, description: 'Concept ids the reader already knows (from list_articles / get_glossary). Blocks that only teach these are skipped.' },
    unknown: { type: 'array', items: { type: 'string' }, description: 'Concept ids the reader does NOT know; the page pulls in the blocks that teach them.' },
    plain_language: { type: 'boolean', description: 'Prefer the plainest wording available.' },
    note: { type: 'string', maxLength: 200, description: 'A short note shown to the reader on the page, e.g. "you asked for the 3-minute version".' },
  },
  ...NO_EXTRA,
};

function contextFromInput(input: Record<string, unknown>): Partial<ReaderContext> {
  const out: Partial<ReaderContext> = {};
  if (input.level !== undefined) {
    if (!LEVELS.includes(input.level as Level)) throw new Error(`level must be one of ${LEVELS.join(', ')}`);
    out.level = input.level as Level;
  }
  if (input.language !== undefined) {
    if (!LANGS.includes(input.language as Lang)) throw new Error(`language must be one of ${LANGS.join(', ')} (this publication is bilingual)`);
    out.language = input.language as Lang;
  }
  if (input.time_minutes !== undefined) {
    const t = Number(input.time_minutes);
    if (!Number.isFinite(t) || t < 0 || t > 120) throw new Error('time_minutes must be 0–120');
    out.timeMinutes = Math.round(t);
  }
  if (input.goal !== undefined) {
    if (!GOALS.includes(input.goal as Goal)) throw new Error(`goal must be one of ${GOALS.join(', ')}`);
    out.goal = input.goal as Goal;
  }
  if (input.knows !== undefined) out.knows = (input.knows as string[]).map(String);
  if (input.unknown !== undefined) out.unknown = (input.unknown as string[]).map(String);
  if (input.plain_language !== undefined) out.plainLanguage = Boolean(input.plain_language);
  if (input.note !== undefined) out.note = String(input.note).slice(0, 200);
  return out;
}

export function describeContext(ctx: ReaderContext) {
  return {
    level: ctx.level,
    language: ctx.language,
    time_minutes: ctx.timeMinutes || 'no limit',
    goal: ctx.goal,
    knows: ctx.knows,
    unknown: ctx.unknown,
    plain_language: ctx.plainLanguage ?? false,
    note: ctx.note,
    stored: 'in this browser only (localStorage); nothing is sent to a server except identifier-free counts of which edition shapes were requested',
  };
}

export function editionSummary(bridge: ArticleBridge) {
  const { article, edition } = bridge;
  const lang = edition.context.language;
  const excluded = edition.decisions.filter((d) => !d.included);
  const fr = bridge.friction.friction();
  return {
    article: { slug: article.slug, title: article.title[lang] },
    edition: { level: edition.context.level, language: lang, goal: edition.context.goal, minutes: edition.minutes, full_minutes: edition.fullMinutes, blocks: edition.blocks.length + bridge.extras.length, time_budget: edition.context.timeMinutes || 'none' },
    outline: outline(edition, lang).map((s) => ({ section_id: s.id, title: s.title, minutes: s.minutes, blocks: s.blocks })),
    excluded: excluded.slice(0, 12).map((d) => ({ block_id: d.blockId, why: d.reason })),
    excluded_count: excluded.length,
    concept_gaps: edition.gaps,
    interactives: Object.keys(article.interactives ?? {}),
    reading_friction: fr.length ? fr.slice(0, 3).map((f) => ({ block_id: f.blockId, re_reads: f.reReads, lingered: f.lingered })) : 'none detected yet',
    next_step: fr.length ? `The reader seems stuck on “${fr[0].blockId}”. Consider simplify_block or read_block + explain.` : 'Read what the human sees with read_section; reshape with declare_reader_context; answer questions with ask_author or read_block.',
  };
}

function blockText(b: Block, lang: Lang): string {
  return b.text[lang] ?? b.text.en;
}

export function buildSurface(env: ToolEnv): { name: string; specs: ToolSpec[] } {
  const ctx = () => contextStore.get();
  const { articles, bridge } = env;

  const declare: ToolSpec = {
    name: 'declare_reader_context',
    title: 'Tell the page about the reader',
    description:
      'Tell this publication what the person you represent needs — level, language, time budget, goal, and concepts they already know or do not know — so pages compose an edition for them from the author’s own blocks. Nothing else about the person is shared or stored. Call again any time the need changes; the page re-composes immediately and shows the declaration to the reader.',
    inputSchema: contextSchema,
    execute: async (input) => {
      const partial = contextFromInput(input);
      const changes = contextStore.update(partial, 'agent');
      if (bridge) {
        const ed = bridge.recompose('agent');
        bridge.report('edition', 'agent');
        return { ok: true, changes, context: describeContext(ctx()), edition: editionSummary({ ...bridge, edition: ed }).edition, outline: outline(ed, ed.context.language), next_step: 'The page re-composed. Call get_edition for details or read_section to read it.' };
      }
      return { ok: true, changes, context: describeContext(ctx()), next_step: 'Open an article with open_article; it will be composed for this context.' };
    },
  };

  const getContext: ToolSpec = {
    name: 'get_reader_context',
    title: 'What the page knows about the reader',
    description: 'Return everything this publication currently knows about the reader (the full handshake), and when it was declared.',
    inputSchema: { type: 'object', properties: {}, ...NO_EXTRA },
    annotations: { readOnlyHint: true },
    execute: async () => ({ context: describeContext(ctx()), history: contextStore.log.slice(-8).map((e) => ({ at: new Date(e.at).toISOString(), by: e.source, changes: e.changes })) }),
  };

  const forget: ToolSpec = {
    name: 'forget_me',
    title: 'Forget the reader',
    description: 'Erase everything this publication knows about the reader in this browser: declared context, reading friction, saved places.',
    inputSchema: { type: 'object', properties: {}, ...NO_EXTRA },
    execute: async () => {
      contextStore.reset();
      bridge?.friction.clear();
      try {
        for (const k of Object.keys(localStorage)) if (k.startsWith('attune:place:')) localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
      bridge?.recompose('agent');
      return { ok: true, context: describeContext(ctx()) };
    },
  };

  const listArticles: ToolSpec = {
    name: 'list_articles',
    title: 'List articles',
    description: 'List the articles in this publication with the reading time of each level’s edition (in the reader’s language) and the concept ids each article can teach or skip.',
    inputSchema: { type: 'object', properties: {}, ...NO_EXTRA },
    annotations: { readOnlyHint: true },
    execute: async () => {
      const c = ctx();
      return {
        reader_language: c.language,
        articles: articles.map((a) => ({
          slug: a.slug,
          url: `${env.origin}/a/${a.slug}`,
          title: a.title[c.language],
          deck: a.deck[c.language],
          minutes_by_level: Object.fromEntries(LEVELS.map((l) => [l, composeEdition(a, { ...c, level: l, timeMinutes: 0 }).minutes])),
          concepts: a.concepts.map((k) => k.id),
          interactives: Object.keys(a.interactives ?? {}),
        })),
      };
    },
  };

  const openArticle: ToolSpec = {
    name: 'open_article',
    title: 'Open an article',
    description: 'Navigate the page to an article. It is composed for the declared reader context. Returns the edition outline.',
    inputSchema: { type: 'object', properties: { slug: { type: 'string', description: 'Article slug from list_articles.' } }, required: ['slug'], ...NO_EXTRA },
    execute: async (input) => {
      const a = articles.find((x) => x.slug === input.slug);
      if (!a) throw new Error(`No article “${input.slug}”. Slugs: ${articles.map((x) => x.slug).join(', ')}`);
      env.navigate(`/a/${a.slug}`);
      const ed = composeEdition(a, ctx());
      return { ok: true, url: `${env.origin}/a/${a.slug}`, edition: { level: ed.context.level, language: ed.context.language, minutes: ed.minutes, full_minutes: ed.fullMinutes }, outline: outline(ed, ed.context.language), next_step: 'The page navigated; article tools are now available. Use read_section to read what the human sees.' };
    },
  };

  if (!bridge) return { name: 'home', specs: [listArticles, declare, openArticle, getContext, forget] };

  // ---------- Article surface ----------
  const { article } = bridge;
  const lang = () => bridge.edition.context.language;
  const visibleBlocks = () => {
    const shown: Block[] = [];
    for (const b of bridge.edition.blocks) {
      const swap = bridge.swaps[b.id];
      shown.push(swap ? article.blocks.find((x) => x.id === swap) ?? b : b);
    }
    for (const id of bridge.extras) {
      const b = article.blocks.find((x) => x.id === id);
      if (b && !shown.includes(b)) shown.push(b);
    }
    return shown;
  };

  const specs: ToolSpec[] = [
    {
      name: 'get_edition',
      title: 'Get the current edition',
      description: 'What the reader is looking at right now: the composed edition (level, language, minutes), its outline with section ids, which blocks were left out and why, concept gaps, available interactives, and whether the reader shows signs of being stuck. Call this first.',
      inputSchema: { type: 'object', properties: {}, ...NO_EXTRA },
      annotations: { readOnlyHint: true },
      execute: async () => editionSummary(bridge),
    },
    declare,
    {
      name: 'read_section',
      title: 'Read a section as shown',
      description: 'Return the exact text the reader sees for one section (or the whole edition if no section_id), in the edition language, with block ids so you can refer to them. Cheaper and more faithful than reading the page as a screenshot.',
      inputSchema: { type: 'object', properties: { section_id: { type: 'string', description: 'Section id from get_edition. Omit for everything.' } }, ...NO_EXTRA },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const l = lang();
        const sid = input.section_id ? String(input.section_id) : '';
        const blocks = visibleBlocks().filter((b) => !sid || b.id === sid || b.section === sid || (sid === '_intro' && !b.section && b.kind !== 'heading'));
        if (blocks.length === 0) throw new Error(`No section “${input.section_id}”. Sections: ${outline(bridge.edition, l).map((s) => s.id).join(', ')}`);
        return { language: l, blocks: blocks.map((b) => ({ block_id: b.id, kind: b.kind, section: b.section, minutes: blockMinutes(b, l), text: b.kind === 'interactive' ? `[interactive ${b.interactive}] ${blockText(b, l)}` : blockText(b, l) })) };
      },
    },
    {
      name: 'read_block',
      title: 'Read one block',
      description: 'Return one block’s text as shown, plus definitions of the concepts it teaches or requires — everything you need to explain it to the reader in your own words.',
      inputSchema: { type: 'object', properties: { block_id: { type: 'string' } }, required: ['block_id'], ...NO_EXTRA },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const b = article.blocks.find((x) => x.id === input.block_id);
        if (!b) throw new Error(`No block “${input.block_id}”. Use get_edition or read_section for ids.`);
        const l = lang();
        const ids = [...(b.teaches ?? []), ...(b.requires ?? [])];
        return { block_id: b.id, kind: b.kind, levels: b.levels, text: blockText(b, l), concepts: article.concepts.filter((c) => ids.includes(c.id)).map((c) => ({ id: c.id, label: c.label[l], definition: c.definition[l] })), has_simpler_version: !!(article.blocks.find((x) => x.simplerOf === b.id) || b.teaches?.length) };
      },
    },
    {
      name: 'get_reading_friction',
      title: 'Where the reader seems stuck',
      description: 'Blocks the reader re-read or lingered on far longer than their reading time, measured in this browser only. Use it to offer help at the right place: simplify_block, or read_block and explain. Empty if nothing stands out.',
      inputSchema: { type: 'object', properties: {}, ...NO_EXTRA },
      annotations: { readOnlyHint: true },
      execute: async () => {
        const l = lang();
        const fr = bridge.friction.friction();
        return {
          friction: fr.map((f) => {
            const b = article.blocks.find((x) => x.id === f.blockId);
            return { block_id: f.blockId, re_reads: f.reReads, seconds_visible: f.visibleSeconds, expected_seconds: f.expectedSeconds, lingered: f.lingered, teaches: b?.teaches ?? [], preview: b ? blockText(b, l).slice(0, 140) : '' };
          }),
          next_step: fr.length ? 'Ask the reader if they want that part explained or simplified; then call simplify_block or explain from read_block.' : 'Nothing stands out. The reader is moving through the edition normally.',
        };
      },
    },
    {
      name: 'simplify_block',
      title: 'Swap a block for a plainer version',
      description: 'Replace one block on the page with the author’s plainer version of the same idea (or a novice-level block that teaches the same concept). The swap is highlighted for the reader. Returns the new text, or the concept definitions if no plainer block exists so you can explain instead.',
      inputSchema: { type: 'object', properties: { block_id: { type: 'string' } }, required: ['block_id'], ...NO_EXTRA },
      execute: async (input) => {
        const b = article.blocks.find((x) => x.id === input.block_id);
        if (!b) throw new Error(`No block “${input.block_id}”.`);
        const s = bridge.simplify(b.id);
        const l = lang();
        bridge.report('simplify', 'agent');
        if (!s) return { ok: false, reason: 'no plainer version written by the author', concepts: article.concepts.filter((c) => (b.teaches ?? []).includes(c.id) || (b.requires ?? []).includes(c.id)).map((c) => ({ id: c.id, definition: c.definition[l] })), next_step: 'Explain it to the reader yourself using these definitions and read_block.' };
        return { ok: true, replaced: b.id, with: s.id, text: blockText(s, l) };
      },
    },
    {
      name: 'expand_section',
      title: 'Add deeper material to a section',
      description: 'Show the author’s deeper blocks (written for higher levels) inside one section, without changing the rest of the edition. Returns the added blocks.',
      inputSchema: { type: 'object', properties: { section_id: { type: 'string', description: 'Section id from get_edition.' } }, required: ['section_id'], ...NO_EXTRA },
      execute: async (input) => {
        const added = bridge.expand(String(input.section_id));
        bridge.report('expand', 'agent');
        const l = lang();
        if (added.length === 0) return { ok: false, reason: 'no deeper blocks for this section at higher levels (or already shown)', sections: outline(bridge.edition, l).map((s) => s.id) };
        return { ok: true, added: added.map((b) => ({ block_id: b.id, levels: b.levels, text: blockText(b, l) })) };
      },
    },
    {
      name: 'ask_author',
      title: 'Ask the author',
      description: 'Look up the author’s own written answers to common questions about this article. Returns matching answers verbatim, or says the author did not cover it — never invents an answer.',
      inputSchema: { type: 'object', properties: { question: { type: 'string', minLength: 3, maxLength: 300 } }, required: ['question'], ...NO_EXTRA },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const l = lang();
        const hits = findFaq(article, String(input.question), l);
        bridge.report('ask', 'agent');
        if (hits.length === 0) return { covered: false, message: 'The author did not write about this. You can read_section and answer from the article, and say so.', questions_the_author_did_answer: article.faq.map((f) => f.question[l]) };
        return { covered: true, answers: hits.slice(0, 3).map((h) => ({ question: h.faq.question[l], answer: h.faq.answer[l], by: article.author })) };
      },
    },
    {
      name: 'get_glossary',
      title: 'Glossary',
      description: 'All concept ids in this article with the author’s one-sentence definitions, and which the reader has declared known. Use the ids with declare_reader_context.',
      inputSchema: { type: 'object', properties: {}, ...NO_EXTRA },
      annotations: { readOnlyHint: true },
      execute: async () => {
        const l = lang();
        const c = ctx();
        return { concepts: article.concepts.map((k) => ({ id: k.id, label: k.label[l], definition: k.definition[l], reader_knows: c.knows.includes(k.id) })) };
      },
    },
    {
      name: 'mark_known',
      title: 'Mark concepts as known',
      description: 'Shortcut: tell the page the reader already knows these concept ids (see get_glossary). Blocks that only teach them disappear from the edition.',
      inputSchema: { type: 'object', properties: { concepts: { type: 'array', items: { type: 'string' }, minItems: 1 } }, required: ['concepts'], ...NO_EXTRA },
      execute: async (input) => {
        const ids = (input.concepts as string[]).map(String);
        const valid = article.concepts.map((c) => c.id);
        const bad = ids.filter((i) => !valid.includes(i));
        if (bad.length) throw new Error(`Unknown concept ids: ${bad.join(', ')}. Valid: ${valid.join(', ')}`);
        contextStore.update({ knows: ids }, 'agent');
        const ed = bridge.recompose('agent');
        bridge.report('edition', 'agent');
        return { ok: true, knows: contextStore.get().knows, minutes: ed.minutes, blocks: ed.blocks.length };
      },
    },
  ];

  if (article.interactives && Object.keys(article.interactives).length) {
    const l = lang();
    const list = Object.entries(article.interactives).map(([id, spec]) => ({ id, title: spec.title[l], params: spec.params }));
    specs.push(
      {
        name: 'set_interactive',
        title: 'Operate an interactive',
        description: `Set the parameters of an interactive component in this article and get its computed result. Interactives: ${list.map((i) => `${i.id} (${Object.keys(i.params).join(', ')})`).join('; ')}. Parameter details from get_interactive.`,
        inputSchema: {
          type: 'object',
          properties: { id: { type: 'string', enum: list.map((i) => i.id) }, params: { type: 'object', description: 'Parameter values to set (unspecified ones keep their current value).', additionalProperties: true } },
          required: ['id', 'params'],
          ...NO_EXTRA,
        },
        execute: async (input) => {
          const id = String(input.id);
          const spec = article.interactives![id];
          if (!spec) throw new Error(`No interactive “${id}”.`);
          const p = (input.params as Params) ?? {};
          const clean: Params = { ...bridge.interactives[id] };
          const problems: string[] = [];
          for (const [k, v] of Object.entries(p)) {
            const ps = spec.params[k];
            if (!ps) {
              problems.push(`unknown param ${k}`);
              continue;
            }
            if (ps.type === 'number') {
              const n = Number(v);
              if (!Number.isFinite(n)) {
                problems.push(`${k} must be a number`);
                continue;
              }
              clean[k] = Math.max(ps.min ?? -Infinity, Math.min(ps.max ?? Infinity, n));
            } else if (ps.type === 'boolean') clean[k] = Boolean(v);
            else {
              if (ps.enum && !ps.enum.includes(String(v))) {
                problems.push(`${k} must be one of ${ps.enum.join(', ')}`);
                continue;
              }
              clean[k] = String(v);
            }
          }
          const out = bridge.setInteractive(id, clean);
          bridge.report('interactive', 'agent');
          return { ok: true, id, params: clean, result: out, problems: problems.length ? problems : undefined, next_step: 'The component on the page updated. Tell the reader what changed.' };
        },
      },
      {
        name: 'get_interactive',
        title: 'Read an interactive',
        description: 'Current parameters, parameter schema and computed result of an interactive in this article.',
        inputSchema: { type: 'object', properties: { id: { type: 'string', enum: list.map((i) => i.id) } }, required: ['id'], ...NO_EXTRA },
        annotations: { readOnlyHint: true },
        execute: async (input) => {
          const id = String(input.id);
          const spec = article.interactives![id];
          if (!spec) throw new Error(`No interactive “${id}”.`);
          return { id, title: spec.title[lang()], description: spec.description[lang()], params_schema: spec.params, params: bridge.interactives[id], result: bridge.setInteractive(id, bridge.interactives[id]) };
        },
      },
    );
  }

  specs.push(
    {
      name: 'save_place',
      title: 'Save the reader’s place',
      description: 'Remember where the reader is in this article (a block id, or the block currently in view) so they can come back later in this browser.',
      inputSchema: { type: 'object', properties: { block_id: { type: 'string', description: 'Optional block id; defaults to the block in view.' } }, ...NO_EXTRA },
      execute: async (input) => ({ ok: true, saved_at_block: bridge.savePlace(input.block_id ? String(input.block_id) : undefined) }),
    },
    {
      name: 'resume_place',
      title: 'Resume where the reader left off',
      description: 'Scroll the page to the place saved earlier in this browser, if any.',
      inputSchema: { type: 'object', properties: {}, ...NO_EXTRA },
      execute: async () => {
        const id = bridge.resumePlace();
        return id ? { ok: true, block_id: id } : { ok: false, message: 'no saved place for this article' };
      },
    },
    listArticles,
    getContext,
    forget,
  );
  return { name: `article:${article.slug}:${bridge.edition.context.level}:${bridge.edition.context.language}`, specs };
}
