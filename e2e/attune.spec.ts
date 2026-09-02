import { expect, test, type Page } from '@playwright/test';
import { WEBMCP_SHIM } from './webmcp-shim';

declare global {
  interface Window {
    __agent: { names: () => Promise<string[]>; call: (name: string, input?: unknown) => Promise<any> };
  }
}
const names = (p: Page) => p.evaluate(() => window.__agent.names());
const call = (p: Page, n: string, i?: unknown) => p.evaluate(([a, b]) => window.__agent.call(a as string, b), [n, i] as const);

test('an agent negotiates an edition, reads it, simplifies where the reader is stuck, drives an interactive, asks the author', async ({ page }) => {
  await page.addInitScript(WEBMCP_SHIM);
  await page.goto('/');
  await expect(page.getByText('WebMCP detected')).toBeVisible();
  await expect.poll(() => names(page)).toContain('declare_reader_context');
  const list = await call(page, 'list_articles');
  expect(list.articles.length).toBeGreaterThanOrEqual(2);
  const slug = list.articles[0].slug as string;

  // Declare context on the home page, then open the article: it must be composed for that context.
  const d = await call(page, 'declare_reader_context', { level: 'expert', language: 'en', time_minutes: 3, goal: 'understand', note: 'you asked for the 3-minute expert version' });
  expect(d.ok).toBe(true);
  await expect(page.locator('.note-box')).toContainText('you asked for the 3-minute expert version');
  const opened = await call(page, 'open_article', { slug });
  expect(opened.ok).toBe(true);
  await expect(page).toHaveURL(new RegExp(`/a/${slug}$`));
  await expect.poll(() => names(page), { timeout: 10000 }).toContain('get_edition');
  const ed = await call(page, 'get_edition');
  expect(ed.edition.level).toBe('expert');
  expect(ed.edition.minutes).toBeLessThanOrEqual(3.6);
  expect(ed.edition.minutes).toBeLessThan(ed.edition.full_minutes);
  expect(ed.excluded_count).toBeGreaterThan(0);
  await expect(page.getByText(/expert edition/i)).toBeVisible();

  // Read exactly what the reader sees.
  const sec = await call(page, 'read_section', { section_id: ed.outline[1]?.section_id ?? ed.outline[0].section_id });
  expect(sec.blocks.length).toBeGreaterThan(0);
  expect(sec.language).toBe('en');

  // Switch to Korean, no time limit, novice: the page re-composes and the heading language changes.
  const ko = await call(page, 'declare_reader_context', { language: 'ko', level: 'novice', time_minutes: 0 });
  expect(ko.edition.language).toBe('ko');
  expect(ko.edition.minutes).toBeGreaterThan(ed.edition.minutes);
  await expect(page.locator('main.ko')).toBeVisible();

  // Known concepts shrink the edition.
  const glossary = await call(page, 'get_glossary');
  const concept = glossary.concepts[0].id as string;
  const before = (await call(page, 'get_edition')).edition.blocks as number;
  const mk = await call(page, 'mark_known', { concepts: [concept] });
  expect(mk.ok).toBe(true);
  const after = (await call(page, 'get_edition')).edition.blocks as number;
  expect(after).toBeLessThanOrEqual(before);

  // Interactive: set params through the tool, the page reflects it.
  const interactives = (await call(page, 'get_edition')).interactives as string[];
  if (interactives.length) {
    const gi = await call(page, 'get_interactive', { id: interactives[0] });
    const key = Object.keys(gi.params_schema)[0];
    const schema = gi.params_schema[key];
    const value = schema.type === 'number' ? Math.min(schema.max ?? 10, (schema.min ?? 0) + 1) : schema.type === 'boolean' ? true : schema.enum?.[1] ?? schema.enum?.[0];
    const si = await call(page, 'set_interactive', { id: interactives[0], params: { [key]: value } });
    expect(si.ok).toBe(true);
    expect(si.params[key]).toEqual(value);
  }

  // The author answers only what the author wrote.
  const bad = await call(page, 'ask_author', { question: 'what is the airspeed of an unladen swallow?' });
  expect(bad.covered).toBe(false);

  // Friction: linger on a block, then the agent can see it and simplify it.
  const edNow = await call(page, 'get_edition');
  const secId = edNow.outline.find((s: { blocks: number }) => s.blocks > 0)!.section_id;
  const blocks = (await call(page, 'read_section', { section_id: secId })).blocks as { block_id: string; kind: string }[];
  const para = blocks.find((b) => b.kind === 'para') ?? blocks[0];
  // Read it, scroll away, come back: a re-read.
  await page.evaluate((id) => document.getElementById(`b-${id}`)?.scrollIntoView({ block: 'center' }), para.block_id);
  await page.waitForTimeout(2200);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3200);
  await page.evaluate((id) => document.getElementById(`b-${id}`)?.scrollIntoView({ block: 'center' }), para.block_id);
  await page.waitForTimeout(1200);
  const fr = await call(page, 'get_reading_friction');
  const hit = fr.friction.find((f: { block_id: string }) => f.block_id === para.block_id);
  expect(hit?.re_reads).toBeGreaterThanOrEqual(1);
  await expect(page.locator(`#b-${para.block_id} .fr-dot`)).toBeVisible();
  const sb = await call(page, 'simplify_block', { block_id: para.block_id });
  expect(typeof sb.ok).toBe('boolean');

  // Save & resume, then forget everything.
  const sp = await call(page, 'save_place', { block_id: para.block_id });
  expect(sp.saved_at_block).toBe(para.block_id);
  const rp = await call(page, 'resume_place');
  expect(rp.ok).toBe(true);
  const fg = await call(page, 'forget_me');
  expect(fg.context.knows).toEqual([]);
  expect((await call(page, 'get_reader_context')).context.time_minutes).toBe('no limit');
});

test('handshake by hand: the panel recomposes the edition and the surface name follows it', async ({ page }) => {
  await page.addInitScript(WEBMCP_SHIM);
  await page.goto('/');
  const list = await call(page, 'list_articles');
  await page.goto(`/a/${list.articles[1].slug}`);
  await expect.poll(() => names(page)).toContain('get_edition');
  const e1 = await call(page, 'get_edition');
  await page.getByRole('button', { name: /^expert$/ }).click();
  await expect.poll(async () => (await call(page, 'get_edition')).edition.level).toBe('expert');
  await page.getByRole('button', { name: '2′', exact: true }).click();
  await expect.poll(async () => (await call(page, 'get_edition')).edition.minutes).toBeLessThan(e1.edition.full_minutes);
  await expect(page.getByText('Set by you')).toBeVisible();
});

test('needs handshake: the agent declares how the person reads best and the page redesigns itself', async ({ page }) => {
  await page.addInitScript(WEBMCP_SHIM);
  await page.goto('/');
  await expect.poll(() => names(page)).toContain('declare_reader_needs');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'light');

  // Arriving with a low-vision reader in a dark room, on a phone.
  const r = await call(page, 'declare_reader_needs', { vision: 'low-vision', light: 'dark-room', device: 'phone', note: 'set from what you told me earlier' });
  expect(r.ok).toBe(true);
  expect(r.why.join(' ')).toMatch(/low vision/);
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await expect(html).toHaveAttribute('data-text', 'xl');
  await expect(html).toHaveAttribute('data-targets', 'large');
  await expect(page.locator('.note-box')).toContainText('set from what you told me earlier');

  // Explicit preference wins over inference.
  const s = await call(page, 'set_display', { theme: 'sepia', layout: 'focus' });
  expect(s.changes.length).toBeGreaterThan(0);
  await expect(html).toHaveAttribute('data-theme', 'sepia');
  await expect(html).toHaveAttribute('data-layout', 'focus');
  const gd = await call(page, 'get_display');
  expect(gd.explicit_preferences).toContain('theme');

  // Dyslexia implies plain-language content: the edition uses the author's plainer blocks.
  const list = await call(page, 'list_articles');
  await call(page, 'open_article', { slug: list.articles[0].slug });
  await expect.poll(() => names(page), { timeout: 10000 }).toContain('focus_section');
  const d = await call(page, 'declare_reader_needs', { reading: 'dyslexia' });
  expect(d.changes.join(' ')).toMatch(/plain language|reading/);
  await expect(html).toHaveAttribute('data-font', 'readable');
  await expect(page.locator('.tag.swap').first()).toBeVisible();

  // Focus one section: the rest dims.
  const ed = await call(page, 'get_edition');
  const sec = ed.outline.find((x: { blocks: number; section_id: string }) => x.blocks > 0 && x.section_id !== '_intro');
  const f = await call(page, 'focus_section', { section_id: sec.section_id });
  expect(f.focused_section).toBe(sec.section_id);
  await expect(html).toHaveAttribute('data-spotlight', 'on');
  await expect(page.locator('.block.in-focus').first()).toBeVisible();
  await call(page, 'focus_section', {});
  await expect(html).toHaveAttribute('data-focus', '');

  // Forget everything: display goes back to defaults.
  await call(page, 'forget_me');
  await expect(html).toHaveAttribute('data-theme', 'light');
  await expect(html).toHaveAttribute('data-text', 'normal');
});
