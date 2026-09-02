import type { Article } from '../../shared/content';
import { article as webmcp } from './webmcp';
import { article as compound } from './compound-interest';
import { article as gps } from './gps';

export const articles: Article[] = [webmcp, compound, gps];
export const bySlug = (slug: string): Article | undefined => articles.find((a) => a.slug === slug);
