import type { Article } from '../../shared/content';
import { article as webmcp } from './webmcp';
import { article as compound } from './compound-interest';
import { article as gps } from './gps';
import { applyOverlay } from '../lib/overlay';

const BASE: Article[] = [compound, webmcp, gps];
export const baseArticles = BASE;
export const baseBySlug = (slug: string): Article | undefined => BASE.find((a) => a.slug === slug);
/** Articles with the author's approved studio drafts merged in (this browser). */
export const articles: Article[] = new Proxy(BASE, {
  get(target, prop) {
    if (prop === 'map' || prop === 'find' || prop === 'filter' || prop === 'length' || prop === Symbol.iterator || typeof prop === 'string' && /^\d+$/.test(prop)) {
      const merged = target.map(applyOverlay);
      const v = (merged as unknown as Record<string | symbol, unknown>)[prop];
      return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(merged) : v;
    }
    return (target as unknown as Record<string | symbol, unknown>)[prop];
  },
}) as Article[];
export const bySlug = (slug: string): Article | undefined => {
  const a = BASE.find((x) => x.slug === slug);
  return a ? applyOverlay(a) : undefined;
};
