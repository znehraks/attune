// Usage: node --experimental-strip-types scripts/validate-article.mjs <slug>
import { composeEdition, validateArticle, blockMinutes } from '../src/shared/content.ts';
const slug = process.argv[2];
if (!slug) { console.error('slug required'); process.exit(1); }
const mod = await import(`../src/client/content/${slug}.ts`);
const a = mod.article ?? mod.default;
const errs = validateArticle(a);
if (errs.length) { console.error('INVALID:\n- ' + errs.join('\n- ')); process.exit(1); }
console.log(`OK ${a.slug}: ${a.blocks.length} blocks, ${a.concepts.length} concepts, ${a.faq.length} faq`);
for (const level of ['novice', 'intermediate', 'expert']) for (const language of ['en', 'ko']) {
  const full = composeEdition(a, { level, language, timeMinutes: 0 });
  const short = composeEdition(a, { level, language, timeMinutes: 2 });
  console.log(`${level.padEnd(12)} ${language}  full=${full.minutes}min/${full.blocks.length} blocks  2min=${short.minutes}min/${short.blocks.length} blocks  gaps=${full.gaps.join(',') || '-'}`);
}
const long = a.blocks.filter((b) => b.kind !== 'code' && (b.text.en.split(/\s+/).length > 150));
if (long.length) console.log('long blocks (>150 words en):', long.map((b) => b.id).join(', '));
