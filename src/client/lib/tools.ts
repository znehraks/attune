// Tool surfaces. The page decides what an agent can do: on the home page it can learn what is
// here and declare the reader's context; on an article it can read exactly what the human sees,
// reshape the edition, ask the author, operate the interactives, and see where the reader got stuck.

import type { Article, Block, Edition, Goal, Lang, Level, ReaderContext } from '../../shared/content';
import { blockMinutes, composeEdition, findFaq, outline } from '../../shared/content';
import type { ToolSpec } from './webmcp';
import { contextStore } from './context';
import { displayStore } from './display';
import { DISPLAY_PRESETS, contentImplications, type Display, type Needs } from '../../shared/needs';
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

export function describeDisplay() {
  const { display, decisions, overridden } = displayStore.resolve();
  return {
    needs: displayStore.needs,
    display,
    inferred_from_needs: decisions.map((d) => `${d.setting} = ${String(d.value)} (${d.because})`),
    explicit_preferences: overridden,
    focused_section: displayStore.focusSection ?? null,
  };
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
    needs: displayStore.needs,
    display: displayStore.display,
    stored: 'in this browser only (localStorage); nothing is sent to a server except identifier-free counts of which edition shapes were requested',
  };
}

const VISION = ['typical', 'low-vision', 'light-sensitive', 'color-blind', 'screen-reader'] as const;
const MOTOR = ['typical', 'limited-precision', 'keyboard-only', 'one-handed'] as const;
const READING = ['typical', 'dyslexia', 'easily-distracted', 'plain-language'] as const;
const DEVICE = ['desktop', 'phone', 'tablet', 'unknown'] as const;
const LIGHT = ['normal', 'dark-room', 'bright-sunlight'] as const;
const THEMES = ['light', 'dark', 'sepia', 'high-contrast'] as const;
const SIZES = ['small', 'normal', 'large', 'xl'] as const;
const FONTS = ['serif', 'sans', 'readable'] as const;
const SPACINGS = ['compact', 'normal', 'relaxed'] as const;
const LAYOUTS = ['standard', 'focus', 'wide'] as const;
const TARGETS = ['normal', 'large'] as const;

function pick<T extends readonly string[]>(v: unknown, allowed: T, name: string): T[number] | undefined {
  if (v === undefined) return undefined;
  if (!allowed.includes(String(v))) throw new Error(`${name} must be one of ${allowed.join(', ')}`);
  return String(v) as T[number];
}

export function needsTools(bridgeRecompose?: () => void): ToolSpec[] {
  const declareNeeds: ToolSpec = {
    name: 'declare_reader_needs',
    title: 'Tell the page how the person reads best',
    description:
      'Call on arrival, before the person asks, with what you already know about them: vision (low vision, light sensitivity, color blindness, screen reader), motor control (limited precision, keyboard only, one-handed), reading (dyslexia, easily distracted, plain language), device and lighting. The page — not you — picks type size, contrast, theme, font, spacing, layout and target size, and shows its reasons. Declare only what you know; call again when the situation changes.',
    inputSchema: {
      type: 'object',
      properties: {
        vision: { type: 'string', enum: VISION, description: 'How the person sees.' },
        motor: { type: 'string', enum: MOTOR, description: 'How the person points, taps and types.' },
        reading: { type: 'string', enum: READING, description: 'How the person reads best.' },
        device: { type: 'string', enum: DEVICE, description: 'Device in use right now.' },
        light: { type: 'string', enum: LIGHT, description: 'Lighting right now.' },
        note: { type: 'string', maxLength: 160, description: 'Optional short note shown to the reader, e.g. "set from what you told me last week".' },
      },
      ...NO_EXTRA,
    },
    execute: async (input) => {
      const partial: Partial<Needs> = {
        vision: pick(input.vision, VISION, 'vision'),
        motor: pick(input.motor, MOTOR, 'motor'),
        reading: pick(input.reading, READING, 'reading'),
        device: pick(input.device, DEVICE, 'device'),
        light: pick(input.light, LIGHT, 'light'),
        note: input.note !== undefined ? String(input.note).slice(0, 160) : undefined,
      };
      const changes = displayStore.declareNeeds(partial, 'agent');
      const impl = contentImplications(displayStore.needs);
      const contentChanges: string[] = [];
      if (impl.plainLanguage || impl.preferNovice) {
        contentChanges.push(...contextStore.update({ plainLanguage: impl.plainLanguage, level: impl.preferNovice ? 'novice' : undefined }, 'agent'));
        bridgeRecompose?.();
      }
      const d = describeDisplay();
      return { ok: true, changes: [...changes, ...contentChanges], needs: d.needs, display: d.display, why: d.inferred_from_needs, next_step: 'The page adapted. Tell the person in one sentence what changed and that they can adjust it on the page. Use set_display only for explicit preferences they state.' };
    },
  };
  const setDisplay: ToolSpec = {
    name: 'set_display',
    title: 'Set explicit display preferences',
    description:
      `Apply preferences the person explicitly states ("darker", "bigger text", "hide everything else", "one section at a time"). These override what the page inferred from needs. Optionally start from a preset: ${Object.entries(DISPLAY_PRESETS).map(([k, v]) => `${k} (${v.label})`).join(', ')}.`,
    inputSchema: {
      type: 'object',
      properties: {
        preset: { type: 'string', enum: Object.keys(DISPLAY_PRESETS), description: 'Apply a named preset first.' },
        theme: { type: 'string', enum: THEMES },
        text_size: { type: 'string', enum: SIZES },
        font: { type: 'string', enum: FONTS, description: 'readable = hyperlegible sans with wider spacing.' },
        spacing: { type: 'string', enum: SPACINGS },
        layout: { type: 'string', enum: LAYOUTS, description: 'focus hides the side panels and narrows the column.' },
        targets: { type: 'string', enum: TARGETS, description: 'large = bigger buttons and controls.' },
        reduced_motion: { type: 'boolean' },
        show_panels: { type: 'boolean', description: 'Show the Handshake panel and Agent console.' },
        spotlight: { type: 'boolean', description: 'Dim everything except the section being read.' },
        color_safe: { type: 'boolean', description: 'Never carry meaning by hue alone.' },
      },
      ...NO_EXTRA,
    },
    execute: async (input) => {
      const partial: Partial<Display> = {};
      if (input.preset !== undefined) {
        const p = DISPLAY_PRESETS[String(input.preset)];
        if (!p) throw new Error(`preset must be one of ${Object.keys(DISPLAY_PRESETS).join(', ')}`);
        Object.assign(partial, p.display);
      }
      const theme = pick(input.theme, THEMES, 'theme');
      if (theme) partial.theme = theme;
      const size = pick(input.text_size, SIZES, 'text_size');
      if (size) partial.textSize = size;
      const font = pick(input.font, FONTS, 'font');
      if (font) partial.font = font;
      const sp = pick(input.spacing, SPACINGS, 'spacing');
      if (sp) partial.spacing = sp;
      const lay = pick(input.layout, LAYOUTS, 'layout');
      if (lay) partial.layout = lay;
      const tg = pick(input.targets, TARGETS, 'targets');
      if (tg) partial.targets = tg;
      if (input.reduced_motion !== undefined) partial.reducedMotion = Boolean(input.reduced_motion);
      if (input.show_panels !== undefined) partial.showPanels = Boolean(input.show_panels);
      if (input.spotlight !== undefined) partial.spotlight = Boolean(input.spotlight);
      if (input.color_safe !== undefined) partial.colorSafe = Boolean(input.color_safe);
      const changes = displayStore.setOverrides(partial, 'agent');
      return { ok: true, changes, display: displayStore.display, next_step: 'Applied on the page. Mention what changed in one sentence.' };
    },
  };
  const getDisplay: ToolSpec = {
    name: 'get_display',
    title: 'Read the current display',
    description: 'Read-only: the reader’s declared needs, the display the page derived from them (with reasons), explicit preferences that override it, and the focused section. declare_reader_needs = what you know about the person; set_display = what they explicitly asked for.',
    inputSchema: { type: 'object', properties: {}, ...NO_EXTRA },
    annotations: { readOnlyHint: true },
    execute: async () => describeDisplay(),
  };
  return [declareNeeds, setDisplay, getDisplay];
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
    excluded: excluded.slice(0, 8).map((d) => ({ block_id: d.blockId, why: d.reason })),
    excluded_count: excluded.length,
    concept_gaps: edition.gaps,
    interactives: Object.keys(article.interactives ?? {}),
    reading_friction: fr.length ? fr.slice(0, 3).map((f) => ({ block_id: f.blockId, re_reads: f.reReads, lingered: f.lingered })) : 'none detected yet',
    display: { needs: displayStore.needs, theme: displayStore.display.theme, text_size: displayStore.display.textSize, layout: displayStore.display.layout, focused_section: displayStore.focusSection ?? null },
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
      'Tell this publication what the person you represent needs — level, language, time budget, goal, and concepts they already know or do not know — so pages compose an edition from approved blocks. Only the fields supplied here are shared; they stay in this browser until forget_me. Call again any time the need changes; the page re-composes and shows the declaration to the reader.',
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
      displayStore.reset();
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

  if (!bridge) return { name: 'home', specs: [listArticles, declare, ...needsTools(), openArticle, getContext, forget] };

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

  const focusSection: ToolSpec = {
    name: 'focus_section',
    title: 'Focus one section',
    description: 'Bring one section into focus: scroll to it and dim the rest of the article so the person can read just that part (useful when explaining, or for readers who are easily distracted). Pass no section_id to clear the focus.',
    inputSchema: { type: 'object', properties: { section_id: { type: 'string', description: 'Section id from get_edition; omit to clear.' } }, ...NO_EXTRA },
    execute: async (input) => {
      const sid = input.section_id ? String(input.section_id) : null;
      if (sid && !outline(bridge.edition, lang()).some((s) => s.id === sid)) throw new Error(`No section “${sid}”. Sections: ${outline(bridge.edition, lang()).map((s) => s.id).join(', ')}`);
      displayStore.setFocus(sid, 'agent');
      if (sid) bridge.scrollTo(sid === '_intro' ? bridge.edition.blocks[0]?.id ?? '' : sid);
      return { ok: true, focused_section: sid, next_step: sid ? 'The rest of the page is dimmed. Clear it with focus_section when done.' : 'Focus cleared.' };
    },
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
    ...needsTools(() => bridge.recompose('agent')),
    focusSection,
    {
      name: 'read_section',
      title: 'Map a section (block ids + first sentences)',
      description: 'The blocks the reader sees in one section (or the whole edition without section_id): block ids, kinds and the first sentence of each, in the edition language. Use it to orient and to pick block ids; call read_block for the full text of one block, or pass full=true for whole texts.',
      inputSchema: { type: 'object', properties: { section_id: { type: 'string', description: 'Section id from get_edition. Omit for everything.' }, full: { type: 'boolean', description: 'Return full block texts instead of first sentences (larger).' } }, ...NO_EXTRA },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const l = lang();
        const sid = input.section_id ? String(input.section_id) : '';
        const blocks = visibleBlocks().filter((b) => !sid || b.id === sid || b.section === sid || (sid === '_intro' && !b.section && b.kind !== 'heading'));
        if (blocks.length === 0) throw new Error(`No section “${sid}”. Sections: ${outline(bridge.edition, l).map((s) => s.id).join(', ')}`);
        const first = (t: string) => {
          const m = t.replace(/\s+/g, ' ').trim().match(/^.{0,160}?[.!?。](\s|$)/);
          return m ? m[0].trim() : t.replace(/\s+/g, ' ').trim().slice(0, 160);
        };
        return { language: l, section: sid || 'all', blocks: blocks.map((b) => ({ block_id: b.id, kind: b.kind, section: b.section ?? '_intro', minutes: blockMinutes(b, l), text: input.full ? (b.kind === 'interactive' ? `[interactive ${b.interactive}] ${blockText(b, l)}` : blockText(b, l)) : first(b.kind === 'interactive' ? `[interactive ${b.interactive}] ${blockText(b, l)}` : blockText(b, l)) })), next_step: input.full ? undefined : 'Call read_block for any block’s full text.' };
      },
    },
    {
      name: 'read_block',
      title: 'Read one block',
      description: 'Full text of one block as shown, plus definitions of the concepts it teaches or requires — everything you need to explain it in your own words. (read_section maps; read_block reads.)',
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
      description: 'Add the author’s deeper blocks (written for higher levels) inside one section, without changing the rest of the edition. Returns the added blocks. (simplify_block goes the other way: plainer.)',
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
    openArticle,
    getContext,
    forget,
  );
  return { name: `article:${article.slug}:${bridge.edition.context.level}:${bridge.edition.context.language}`, specs };
}

// ---------- Author studio surface ----------
import { coverage as coverageOf, studioStore } from './overlay';

export interface StudioEnv {
  article: Article;
  base: Article;
  origin: string;
  flash: (id: string) => void;
}

export function buildStudioSurface(env: StudioEnv): { name: string; specs: ToolSpec[] } {
  const { article, base } = env;
  const LEVELS: Level[] = ['novice', 'intermediate', 'expert'];
  const specs: ToolSpec[] = [
    {
      name: 'get_article_coverage',
      title: 'Where the article is thin',
      description:
        'For this article: per section, how many blocks exist for each level; which blocks have no plainer version; which blocks exist for one level only; FAQ count. Use it to decide what to draft. Drafts you propose appear on the page for the author to approve — nothing goes live without their click.',
      inputSchema: { type: 'object', properties: {}, ...NO_EXTRA },
      annotations: { readOnlyHint: true },
      execute: async () => ({ article: article.slug, ...coverageOf(article), pending_proposals: studioStore.pending(article.slug).length, approved_proposals: studioStore.approved(article.slug).length, next_step: 'Call get_block_source for a thin block, then propose_level_variant or propose_plainer_version with your draft in both languages.' }),
    },
    {
      name: 'get_block_source',
      title: 'Read a block to rewrite',
      description: 'Full source of one block (both languages, levels, concepts it teaches/requires, section) so you can draft a variant that keeps the facts and the author’s voice.',
      inputSchema: { type: 'object', properties: { block_id: { type: 'string' } }, required: ['block_id'], ...NO_EXTRA },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const b = article.blocks.find((x) => x.id === input.block_id);
        if (!b) throw new Error(`No block “${input.block_id}”. Use get_article_coverage for ids.`);
        return { block_id: b.id, kind: b.kind, levels: b.levels, section: b.section, priority: b.priority, teaches: b.teaches, requires: b.requires, text: b.text, concepts: article.concepts.filter((c) => (b.teaches ?? []).concat(b.requires ?? []).includes(c.id)).map((c) => ({ id: c.id, en: c.definition.en, ko: c.definition.ko })), rules: 'Keep every fact and number. Do not add claims. Under 120 English words. Korean must be a faithful translation, not a summary. Markdown-lite only (**bold**, `code`).' };
      },
    },
    {
      name: 'propose_level_variant',
      title: 'Draft this idea for another level',
      description: 'Propose a rewrite of a block for a different reader level (novice: plain words and an analogy; intermediate: the mechanism; expert: edge cases and trade-offs). Provide English and Korean. The draft appears in the studio as pending; the author approves or rejects it on the page. Once approved, readers at that level get it in their editions.',
      inputSchema: {
        type: 'object',
        properties: {
          block_id: { type: 'string', description: 'Source block (from get_article_coverage).' },
          level: { type: 'string', enum: LEVELS, description: 'Level the draft is written for.' },
          text_en: { type: 'string', minLength: 20, maxLength: 1200 },
          text_ko: { type: 'string', minLength: 10, maxLength: 1200 },
          rationale: { type: 'string', maxLength: 200, description: 'One line for the author: why this block, what changed.' },
        },
        required: ['block_id', 'level', 'text_en', 'text_ko'],
        ...NO_EXTRA,
      },
      execute: async (input) => {
        const b = article.blocks.find((x) => x.id === input.block_id);
        if (!b) throw new Error(`No block “${input.block_id}”.`);
        const level = pick(input.level, LEVELS, 'level')!;
        if (b.levels.includes(level) && b.levels.length === 1) throw new Error(`Block “${b.id}” is already written for ${level}. Pick a level it lacks: ${LEVELS.filter((l) => !b.levels.includes(l)).join(', ') || '(none)'}`);
        const p = studioStore.propose(article.slug, { by: 'agent', kind: 'level', sourceId: b.id, level, text: { en: String(input.text_en), ko: String(input.text_ko) }, rationale: input.rationale ? String(input.rationale) : undefined });
        env.flash(p.id);
        return { ok: true, proposal_id: p.id, status: 'pending', next_step: 'The author sees the draft on the page. Do not approve it yourself — that is their click. Continue with the next thin block or stop.' };
      },
    },
    {
      name: 'propose_plainer_version',
      title: 'Draft a plainer version',
      description: 'Propose the plainer rewrite of a dense block — same facts, everyday words, shorter sentences — in English and Korean. Once the author approves it, readers’ agents can swap it in with simplify_block when the page notices someone re-reading that block.',
      inputSchema: {
        type: 'object',
        properties: { block_id: { type: 'string' }, text_en: { type: 'string', minLength: 20, maxLength: 1000 }, text_ko: { type: 'string', minLength: 10, maxLength: 1000 }, rationale: { type: 'string', maxLength: 200 } },
        required: ['block_id', 'text_en', 'text_ko'],
        ...NO_EXTRA,
      },
      execute: async (input) => {
        const b = article.blocks.find((x) => x.id === input.block_id);
        if (!b) throw new Error(`No block “${input.block_id}”.`);
        if (article.blocks.some((x) => x.simplerOf === b.id)) throw new Error(`Block “${b.id}” already has a plainer version.`);
        const p = studioStore.propose(article.slug, { by: 'agent', kind: 'plainer', sourceId: b.id, text: { en: String(input.text_en), ko: String(input.text_ko) }, rationale: input.rationale ? String(input.rationale) : undefined });
        env.flash(p.id);
        return { ok: true, proposal_id: p.id, status: 'pending', next_step: 'Pending the author’s approval on the page.' };
      },
    },
    {
      name: 'propose_faq',
      title: 'Draft an author FAQ entry',
      description: 'Propose a question readers are likely to ask and an answer grounded only in this article (say so if the article does not cover it). Both languages. The author approves on the page; then ask_author can return it to readers.',
      inputSchema: {
        type: 'object',
        properties: { question_en: { type: 'string', minLength: 5, maxLength: 200 }, question_ko: { type: 'string', minLength: 2, maxLength: 200 }, answer_en: { type: 'string', minLength: 10, maxLength: 800 }, answer_ko: { type: 'string', minLength: 5, maxLength: 800 }, keywords: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8, description: 'Lowercase match words in both languages.' } },
        required: ['question_en', 'question_ko', 'answer_en', 'answer_ko', 'keywords'],
        ...NO_EXTRA,
      },
      execute: async (input) => {
        const faq = { id: `faq-${Math.random().toString(36).slice(2, 8)}`, keywords: (input.keywords as string[]).map((k) => String(k).toLowerCase()), question: { en: String(input.question_en), ko: String(input.question_ko) }, answer: { en: String(input.answer_en), ko: String(input.answer_ko) } };
        const p = studioStore.propose(article.slug, { by: 'agent', kind: 'faq', faq });
        env.flash(p.id);
        return { ok: true, proposal_id: p.id, status: 'pending' };
      },
    },
    {
      name: 'list_proposals',
      title: 'List drafts and their status',
      description: 'All drafts proposed for this article with status pending / approved / rejected.',
      inputSchema: { type: 'object', properties: {}, ...NO_EXTRA },
      annotations: { readOnlyHint: true },
      execute: async () => ({ proposals: studioStore.state(article.slug).proposals.map((p) => ({ id: p.id, kind: p.kind, source: p.sourceId, level: p.level, status: p.status, by: p.by, preview: (p.text?.en ?? p.faq?.question.en ?? '').slice(0, 100) })) }),
    },
    {
      name: 'withdraw_proposal',
      title: 'Withdraw a pending draft',
      description: 'Remove one of your own pending drafts (approved or rejected ones stay as the author decided).',
      inputSchema: { type: 'object', properties: { proposal_id: { type: 'string' } }, required: ['proposal_id'], ...NO_EXTRA },
      execute: async (input) => ({ ok: studioStore.withdraw(article.slug, String(input.proposal_id)) }),
    },
    {
      name: 'export_article',
      title: 'Export the article with approved drafts',
      description: 'The article as JSON with every approved draft merged in — the content model any Attune-style site consumes.',
      inputSchema: { type: 'object', properties: {}, ...NO_EXTRA },
      annotations: { readOnlyHint: true },
      execute: async () => ({ slug: article.slug, blocks: article.blocks.length, base_blocks: base.blocks.length, faq: article.faq.length, json_url: `${env.origin}/studio/${article.slug}#export`, note: 'Download from the Export button on the page.' }),
    },
  ];
  return { name: `studio:${article.slug}`, specs };
}
