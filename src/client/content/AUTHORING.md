# Authoring an Attune article

An article is a TypeScript module exporting `const article: Article` (see `src/shared/content.ts`).

- Write **blocks**, not prose. Each block is one idea: a paragraph, a list, a code sample, a figure, an aside, or an interactive.
- Every block has `levels`: which editions include it. Shared blocks list several levels; level-specific blocks list one. Write the *same idea* at different levels as *different blocks* (e.g. `why-tools-novice`, `why-tools-expert`).
- `priority` 1–5: 1 = the article is meaningless without it; 5 = nice-to-have. A 2-minute edition keeps only 1s and 2s.
- `teaches` / `requires`: concept ids from the article's `concepts` list. Readers who already know a concept skip the block that teaches it; readers who need a concept get the block that teaches it pulled in.
- `goals`: `understand` (default), `decide` (comparisons, trade-offs, recommendations), `build` (code, steps, checklists).
- `section`: the id of the heading block the block belongs to.
- `simplerOf`: mark a block as the plainer rewrite of another block (used when a reader gets stuck).
- Text is markdown-lite: `**bold**`, `` `code` ``, `[text](url)`, and for lists one `- item` per line. Keep blocks under ~120 English words. Korean must be a faithful translation (not a summary).
- `faq`: real questions readers ask, with keywords in both languages; answers are the author's own words.
