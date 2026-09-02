import { AttuneStats, type EditionEvent } from './stats';

export { AttuneStats };

interface Env {
  STATS: DurableObjectNamespace;
  ASSETS: Fetcher;
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === 'OPTIONS') return new Response(null, { headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' } });

    // POST /api/edition — identifier-free aggregate counters (see stats.ts)
    if (path === '/api/edition' && request.method === 'POST') {
      let ev: EditionEvent;
      try {
        ev = (await request.json()) as EditionEvent;
      } catch {
        return json({ error: 'bad json' }, 400);
      }
      if (!/^[a-z0-9-]{2,40}$/.test(ev.slug ?? '')) return json({ error: 'bad slug' }, 400);
      const clean: EditionEvent = {
        slug: ev.slug,
        level: String(ev.level ?? '?').slice(0, 16),
        language: String(ev.language ?? '?').slice(0, 8),
        timeBucket: String(ev.timeBucket ?? 'all').slice(0, 8),
        goal: String(ev.goal ?? '?').slice(0, 16),
        source: ev.source === 'agent' ? 'agent' : 'hand',
        knownCount: Math.max(0, Math.min(50, Number(ev.knownCount ?? 0) || 0)),
        kind: (['edition', 'simplify', 'expand', 'ask', 'interactive'] as const).includes(ev.kind as 'edition') ? ev.kind : 'edition',
      };
      const stub = env.STATS.get(env.STATS.idFromName(clean.slug));
      await stub.fetch(new Request('https://stats/', { method: 'POST', body: JSON.stringify(clean) }));
      return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*' } });
    }

    // GET /api/insights/:slug
    const m = path.match(/^\/api\/insights\/([a-z0-9-]{2,40})$/);
    if (m && request.method === 'GET') {
      const stub = env.STATS.get(env.STATS.idFromName(m[1]));
      const res = await stub.fetch(new Request('https://stats/', { method: 'GET' }));
      return new Response(res.body, { status: res.status, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store' } });
    }

    if (path.startsWith('/api/')) return json({ error: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
