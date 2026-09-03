import { describe, expect, it } from 'vitest';
import { composeEdition, findFaq, outline, simplerVersion, deeperBlocks, validateArticle, type Article } from '../src/shared/content';
import { article as compoundInterestArticle } from '../src/client/content/compound-interest';

const t = (en: string) => ({ en, ko: en + ' (ko)' });
const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ');

const article: Article = {
  slug: 'sample',
  title: t('Sample'),
  deck: t('deck'),
  author: 'tester',
  date: '2026-09-02',
  interactives: { calc: { title: t('Calc'), description: t('d'), params: { x: { type: 'number', description: 'x', default: 1 } } } },
  concepts: [
    { id: 'alpha', label: t('Alpha'), definition: t('alpha def') },
    { id: 'beta', label: t('Beta'), definition: t('beta def') },
  ],
  blocks: [
    { id: 'intro', kind: 'para', levels: ['novice', 'intermediate', 'expert'], priority: 1, text: t(words(110)) },
    { id: 'h1', kind: 'heading', levels: ['novice', 'intermediate', 'expert'], priority: 1, text: t('Basics') },
    { id: 'teach-alpha', kind: 'para', levels: ['novice', 'intermediate'], priority: 2, section: 'h1', teaches: ['alpha'], text: t(words(220)) },
    { id: 'teach-alpha-expert', kind: 'para', levels: ['expert'], priority: 3, section: 'h1', teaches: ['alpha'], text: t(words(110)) },
    { id: 'uses-alpha', kind: 'para', levels: ['intermediate', 'expert'], priority: 2, section: 'h1', requires: ['alpha'], text: t(words(110)) },
    { id: 'uses-beta', kind: 'para', levels: ['expert'], priority: 4, section: 'h1', requires: ['beta'], text: t(words(110)) },
    { id: 'teach-beta', kind: 'para', levels: ['novice'], priority: 4, section: 'h1', teaches: ['beta'], text: t(words(110)) },
    { id: 'h2', kind: 'heading', levels: ['novice', 'intermediate', 'expert'], priority: 1, text: t('Extras') },
    { id: 'nice', kind: 'aside', levels: ['novice', 'intermediate', 'expert'], priority: 5, section: 'h2', text: t(words(220)) },
    { id: 'dense', kind: 'para', levels: ['expert'], priority: 3, section: 'h2', text: t(words(110)) },
    { id: 'dense-plain', kind: 'para', levels: ['novice'], priority: 3, section: 'h2', simplerOf: 'dense', text: t(words(60)) },
    { id: 'build-step', kind: 'code', levels: ['intermediate', 'expert'], priority: 3, section: 'h2', goals: ['build'], text: t('code()') },
    { id: 'calc', kind: 'interactive', interactive: 'calc', levels: ['novice', 'intermediate', 'expert'], priority: 2, section: 'h2', text: t('try it') },
  ],
  faq: [{ id: 'f1', keywords: ['cost', '비용'], question: t('How much does it cost?'), answer: t('Nothing.') }],
};

describe('composer', () => {
  it('validates the sample', () => {
    expect(validateArticle(article)).toEqual([]);
  });
  it('filters by level and skips known concepts', () => {
    const ed = composeEdition(article, { level: 'expert', knows: ['alpha'] });
    const ids = ed.blocks.map((b) => b.id);
    expect(ids).not.toContain('teach-alpha');
    expect(ids).not.toContain('teach-alpha-expert'); // reader knows alpha
    expect(ids).toContain('uses-alpha');
    expect(ed.decisions.find((d) => d.blockId === 'teach-alpha-expert')?.reason).toMatch(/already knows/);
  });
  it('pulls prerequisites the reader does not know, even from other levels', () => {
    const ed = composeEdition(article, { level: 'expert' });
    const ids = ed.blocks.map((b) => b.id);
    expect(ids).toContain('teach-beta'); // novice-only block pulled in because uses-beta requires beta
    expect(ed.gaps).toEqual([]);
    const known = composeEdition(article, { level: 'expert', knows: ['beta'] });
    expect(known.blocks.map((b) => b.id)).not.toContain('teach-beta');
  });
  it('trims to a time budget by priority and keeps priority-1 blocks', () => {
    const full = composeEdition(article, { level: 'intermediate', timeMinutes: 0 });
    const short = composeEdition(article, { level: 'intermediate', timeMinutes: 1 });
    expect(short.minutes).toBeLessThan(full.minutes);
    expect(short.blocks.map((b) => b.id)).toContain('intro');
    expect(short.blocks.map((b) => b.id)).not.toContain('nice');
    expect(short.decisions.find((d) => d.blockId === 'nice')?.reason).toMatch(/trimmed/);
  });
  it('drops headings of empty sections', () => {
    const ed = composeEdition(article, { level: 'intermediate', timeMinutes: 0.6 });
    const ids = ed.blocks.map((b) => b.id);
    if (!ids.some((id) => ['nice', 'build-step', 'calc'].includes(id))) expect(ids).not.toContain('h2');
  });
  it('goal boosts matching blocks', () => {
    const build = composeEdition(article, { level: 'intermediate', goal: 'build', timeMinutes: 3 });
    const understand = composeEdition(article, { level: 'intermediate', goal: 'understand', timeMinutes: 3 });
    expect(build.blocks.map((b) => b.id)).toContain('build-step');
    expect(understand.blocks.map((b) => b.id)).not.toContain('build-step');
  });
  it('keeps the calculator in the three-minute compound-interest decision edition', () => {
    const ed = composeEdition(compoundInterestArticle, {
      level: 'expert',
      language: 'ko',
      timeMinutes: 3,
      goal: 'decide',
      knows: ['principal', 'interest-rate', 'compounding'],
      unknown: ['fee-drag'],
    });
    expect(ed.minutes).toBeLessThanOrEqual(3);
    expect(ed.blocks.map((b) => b.id)).toContain('interactive-calc');
  });
  it('finds simpler versions and deeper blocks', () => {
    expect(simplerVersion(article, 'dense')?.id).toBe('dense-plain');
    expect(simplerVersion(article, 'teach-alpha-expert')?.id).toBe('teach-alpha');
    const ed = composeEdition(article, { level: 'novice' });
    expect(deeperBlocks(article, ed, 'h2').map((b) => b.id)).toContain('dense');
  });
  it('answers from the author FAQ only', () => {
    expect(findFaq(article, 'what does it cost?', 'en')[0]?.faq.id).toBe('f1');
    expect(findFaq(article, 'is the sky blue', 'en')).toEqual([]);
  });
  it('builds an outline with section minutes', () => {
    const ed = composeEdition(article, { level: 'novice' });
    const o = outline(ed, 'en');
    expect(o.map((s) => s.id)).toEqual(['_intro', 'h1', 'h2']);
    expect(o[1].minutes).toBeGreaterThan(0);
  });
});
