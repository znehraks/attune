import { chromium } from '@playwright/test';
import fs from 'node:fs';
const { WEBMCP_SHIM } = await import('../../e2e/webmcp-shim.ts');
const base = process.env.BASE_URL ?? 'https://attune.znehraks.workers.dev';
const scenes = JSON.parse(fs.readFileSync('docs/video/build/scenes.json', 'utf8'));
const S = Object.fromEntries(scenes.map((s) => [s.id, s]));
const dir = 'docs/video/build/rec';
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CAP_CSS = `#__cap{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);max-width:1100px;background:rgba(20,20,26,.88);color:#fff;font:500 22px/1.35 Inter,system-ui,sans-serif;padding:12px 20px;border-radius:12px;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,.35);text-align:center}#__cap:empty{opacity:0}#__cap small{display:block;font-size:14px;color:#cfcdc5;margin-top:4px}`;
async function cap(page, text, sub = '') {
  await page.evaluate(([t, s, css]) => {
    let st = document.getElementById('__capcss');
    if (!st) { st = document.createElement('style'); st.id = '__capcss'; st.textContent = css; document.head.appendChild(st); }
    let el = document.getElementById('__cap');
    if (!el) { el = document.createElement('div'); el.id = '__cap'; document.body.appendChild(el); }
    el.innerHTML = t ? t + (s ? `<small>${s}</small>` : '') : '';
  }, [text, sub, CAP_CSS]);
}
const agent = (page, name, input) => page.evaluate(([n, i]) => window.__agent.call(n, i), [name, input ?? {}]);
const scrollToBlock = (page, id) => page.evaluate((i) => document.getElementById(`b-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), id);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir, size: { width: 1280, height: 720 } } });
const A = await ctx.newPage();
await A.addInitScript(WEBMCP_SHIM);
const marks = {};
const t0 = Date.now();
const mark = (id) => { marks[id] = (Date.now() - t0) / 1000; console.log('scene', id, marks[id].toFixed(2)); };
const until = (id, startedAt, extra = 0) => sleep(Math.max(0, S[id].audio * 1000 + extra - (Date.now() - startedAt)));
const SUB = 'Tool calls driven by a test harness through the page’s WebMCP API here — ChatGPT calls the same tools.';

await A.goto(base + '/');
await A.waitForSelector('text=WebMCP detected');
await A.evaluate(() => window.__agent.call('forget_me'));
await sleep(600);

// S2 problem — landing
let st = Date.now(); mark('02-problem');
await cap(A, S['02-problem'].caption);
await sleep(6000);
await A.mouse.wheel(0, 500); await sleep(5000);
await A.mouse.wheel(0, 500); await sleep(4500);
await A.mouse.wheel(0, -1000); await sleep(1000);
await until('02-problem', st, 300);

// S3 declare — open the WebMCP article, declare expert/3min/knows mcp
st = Date.now(); mark('03-declare');
await cap(A, S['03-declare'].caption, SUB);
await agent(A, 'open_article', { slug: 'webmcp' });
await A.waitForURL(/\/a\/webmcp/);
await cap(A, S['03-declare'].caption, SUB);
await sleep(5000);
await agent(A, 'declare_reader_context', { level: 'expert', language: 'en', time_minutes: 3, knows: ['mcp'], note: 'you asked for the 3-minute expert version' });
await sleep(4500);
await A.mouse.wheel(0, 350); await sleep(3500);
await A.mouse.wheel(0, 350); await sleep(3000);
await A.mouse.wheel(0, -700);
await until('03-declare', st, 300);

// S4 korean novice full
st = Date.now(); mark('04-korean');
await cap(A, S['04-korean'].caption, SUB);
await sleep(1500);
await agent(A, 'declare_reader_context', { level: 'novice', language: 'ko', time_minutes: 0 });
await sleep(4000);
await A.mouse.wheel(0, 400); await sleep(3500);
await A.mouse.wheel(0, 400); await sleep(3000);
await until('04-korean', st, 300);

// S5 friction → simplify (english intermediate so the simplify target has a plainer version)
st = Date.now(); mark('05-friction');
await cap(A, S['05-friction'].caption, SUB);
await agent(A, 'declare_reader_context', { level: 'intermediate', language: 'en', time_minutes: 0 });
await sleep(800);
const sec = await agent(A, 'read_section');
const withSimpler = (await agent(A, 'get_edition')).outline;
// find a visible block that has a simpler version: try read_block on paragraphs until has_simpler_version
let target = null;
for (const b of sec.blocks.filter((x) => x.kind === 'para')) { const rb = await agent(A, 'read_block', { block_id: b.block_id }); if (rb.has_simpler_version) { target = b.block_id; break; } }
if (!target) target = sec.blocks.find((x) => x.kind === 'para')?.block_id;
await scrollToBlock(A, target); await sleep(2500);
await A.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })); await sleep(3000);
await scrollToBlock(A, target); await sleep(1800);
await agent(A, 'get_reading_friction');
await sleep(1500);
await agent(A, 'simplify_block', { block_id: target });
await sleep(2500);
await until('05-friction', st, 300);

// S6 interactive — compound calculator
st = Date.now(); mark('06-interactive');
await cap(A, S['06-interactive'].caption, SUB);
await agent(A, 'open_article', { slug: 'compound-interest' });
await A.waitForURL(/compound-interest/);
await cap(A, S['06-interactive'].caption, SUB);
await sleep(1500);
await A.evaluate(() => document.querySelector('.interactive-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
await sleep(3500);
await agent(A, 'set_interactive', { id: 'compound-calculator', params: { monthly: 500, years: 40, fee: 1 } });
await sleep(3000);
await agent(A, 'get_interactive', { id: 'compound-calculator' });
await until('06-interactive', st, 300);

// S7 ask author + forget
st = Date.now(); mark('07-author');
await cap(A, S['07-author'].caption, SUB);
await A.evaluate(() => document.querySelector('.console')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
await sleep(800);
await agent(A, 'ask_author', { question: 'Does inflation matter here?' });
await sleep(3500);
await agent(A, 'ask_author', { question: 'What is the airspeed velocity of an unladen swallow?' });
await sleep(2500);
await agent(A, 'forget_me');
await until('07-author', st, 300);

// S8 publisher insights
st = Date.now(); mark('08-publisher');
await cap(A, S['08-publisher'].caption);
await A.goto(base + '/insights/webmcp');
await cap(A, S['08-publisher'].caption);
await sleep(7000);
await A.goto(base + '/publishers');
await cap(A, S['08-publisher'].caption);
await until('08-publisher', st, 300);
mark('08-end');
await cap(A, '');
await sleep(500);
const videoA = await A.video().path();
await ctx.close();
await browser.close();
fs.writeFileSync('docs/video/build/marks.json', JSON.stringify({ videoA, marks }, null, 1));
console.log(JSON.stringify(marks));
