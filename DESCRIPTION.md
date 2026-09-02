# Devpost submission text — Attune

**Tagline:** Pages that negotiate with your agent, not track you. A publication whose pages compose themselves for each reader — from the author's own blocks — through WebMCP.

**Live URL:** https://attune.znehraks.workers.dev
**Repo:** https://github.com/znehraks/attune (MIT)

## Inspiration
Every reader who opens an article with an AI beside them faces the same two bad options: let the site track them into a "personalized" experience, or let the AI scrape and summarize — losing the figures, the interactives, the author's voice, and sometimes the facts. WebMCP suggested a third way. The reader's agent already knows how much time the person has, what they know, and what they're trying to do. What if the page could simply ask?

## What it does
Attune is a small publication (three articles, three levels, English and Korean, each with an interactive) built on a pattern any site could adopt. A visitor's agent declares what it already knows about the person — level, language, time budget, goal, concepts already known, and how they read best: vision, hands, attention, device, lighting — through WebMCP tools, on arrival, before the person asks. The page composes an **edition**: author-written blocks filtered by level, prerequisites pulled in, known material skipped, lower-priority blocks trimmed to the time budget. Every decision has a visible reason, and the Handshake panel shows exactly what the page was told, by whom, and when — editable and erasable by the reader.

The page also designs the screen for that person. From declared needs it picks among layouts, themes and type scales its designers prepared: dark for a dark room, extra-large hyperlegible type and big targets for low vision, a sepia readable-font edition with plain-language blocks for dyslexia, a focus layout that lights one section at a time for readers who are easily distracted, color-safe encoding for color blindness, a linear layout for screen readers. Every choice carries a visible reason; explicit preferences ("darker", "bigger") override the inference; the agent never touches CSS.

The page stays alive: the agent can read exactly what the reader sees (`read_section`), operate the calculator or simulation on the page (`set_interactive`), ask the author's written FAQ (`ask_author`, which never invents), expand a section with the author's deeper material, and — when the page notices the reader re-reading a paragraph — swap in the author's plainer version of that exact block (`get_reading_friction` → `simplify_block`). Server-side, the only thing stored is an anonymous count of which edition shapes readers asked for, shown to the author on a "what readers asked for" page.

## Why WebMCP fits the use case
The reader's context lives in their agent, not in a cookie. WebMCP lets the agent hand the page precisely what the page needs, in the page's vocabulary, with the human watching — a negotiation instead of a leak. An HTTP header can say "Korean"; only a tool call can say "three minutes, knows MCP, wants to build something".

## How it improves the experience
The Handshake panel works by hand for people without agents, but nobody wants to click through five facets per article — the agent already knows them. The two-way loop (page reports friction → agent asks → author's plainer block appears in place) has no static-UI equivalent. And interactives become things you can talk to: "what if I put in 500 a month for 40 years?" changes the chart on the page.

## What it makes newly possible
Content that adapts without tracking and without hallucination: the page owns the variants, the agent owns the context, the human owns the decision. Publishers learn what readers want, in aggregate, without surveillance.

## How we built it
- **WebMCP**: `document.modelContext.registerTool()` with `AbortSignal` surfaces (home: 8 tools; article: 22), a needs → design resolver the page owns, surface names that encode the edition (`article:webmcp:expert:ko`), `readOnlyHint` on reads, loose schemas with strict validation and self-correcting errors, `next_step` in every result.
- **Composer**: a deterministic, explainable edition composer (`src/shared/content.ts`) with unit tests; a validation script that prints edition sizes for every level/language/time budget.
- **Content**: three original articles (WebMCP, compound interest, GPS) — ~40 blocks each, three levels, two languages, author FAQs, inline SVG figures, an interactive per article with a declared parameter schema.
- **Frontend**: React 19 + TypeScript + Vite; Handshake panel; friction tracker (IntersectionObserver, local only); Agent console showing live tools and every call.
- **Backend**: Cloudflare Workers + a Durable Object per article holding identifier-free counters.
- **Tests**: Vitest for the composer; Playwright e2e that installs a faithful `document.modelContext` stand-in and drives every tool like an agent, including the friction → simplify loop.

## Challenges
Designing a content model that is expressive enough for real articles yet deterministic; writing the same idea honestly at three levels; keeping tool results small but sufficient; making friction detection useful without being creepy (local only, visible, switchable).

## Accomplishments
A working answer to "what does a web page look like when the reader brings an agent" that keeps the author, the reader and the agent each in charge of what they should own.

## What we learned
The best thing an agent can give a page is not a click — it is context. And the best thing a page can give an agent is not raw text — it is structure with reasons.

## What's next
An authoring UI and static-site exporter; known-concepts that travel with the reader (with consent); audio editions from the same composer.
