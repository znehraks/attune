import { DurableObject } from 'cloudflare:workers';

// Aggregate, identifier-free counters of what readers asked for. One object per article.
// Nothing here can identify a person: only (level, language, time bucket, goal, source) counts.

export interface EditionEvent {
  slug: string;
  level: string;
  language: string;
  timeBucket: string; // 'all' | '<=2' | '<=5' | '<=10' | '>10'
  goal: string;
  source: 'agent' | 'hand';
  knownCount?: number;
  kind?: 'edition' | 'simplify' | 'expand' | 'ask' | 'interactive';
}

interface Counters {
  total: number;
  byLevel: Record<string, number>;
  byLanguage: Record<string, number>;
  byTime: Record<string, number>;
  byGoal: Record<string, number>;
  bySource: Record<string, number>;
  byKind: Record<string, number>;
  knownSum: number;
  updatedAt: number;
}

const empty = (): Counters => ({ total: 0, byLevel: {}, byLanguage: {}, byTime: {}, byGoal: {}, bySource: {}, byKind: {}, knownSum: 0, updatedAt: 0 });
const bump = (m: Record<string, number>, k: string) => (m[k] = (m[k] ?? 0) + 1);

export class AttuneStats extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const c = (await this.ctx.storage.get<Counters>('c')) ?? empty();
    if (request.method === 'POST') {
      const ev = (await request.json()) as EditionEvent;
      c.total++;
      bump(c.byLevel, ev.level ?? '?');
      bump(c.byLanguage, ev.language ?? '?');
      bump(c.byTime, ev.timeBucket ?? 'all');
      bump(c.byGoal, ev.goal ?? '?');
      bump(c.bySource, ev.source === 'agent' ? 'agent' : 'hand');
      bump(c.byKind, ev.kind ?? 'edition');
      c.knownSum += ev.knownCount ?? 0;
      c.updatedAt = Date.now();
      await this.ctx.storage.put('c', c);
      return new Response(null, { status: 204 });
    }
    return new Response(JSON.stringify(c), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  }
}
