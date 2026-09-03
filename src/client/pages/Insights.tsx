import { useEffect, useState } from 'react';
import { useEffect as useTitleEffect } from 'react';
import { TopBar } from './Home';
import { bySlug } from '../content';

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

function Bars({ title, data, total }: { title: string; data: Record<string, number>; total: number }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="card step">
      <h3>{title}</h3>
      {entries.length === 0 && <div className="muted small">no data yet</div>}
      {entries.map(([k, v]) => (
        <div className="bar" key={k}>
          <span className="bar-k">{k}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${Math.round((100 * v) / Math.max(1, total))}%` }} />
          </span>
          <span className="bar-v">{v}</span>
        </div>
      ))}
    </div>
  );
}

export function Insights({ slug }: { slug: string }) {
  useTitleEffect(() => {
    document.title = 'What readers asked for — Attune';
  }, []);
  const [c, setC] = useState<Counters | null>(null);
  const a = bySlug(slug);
  useEffect(() => {
    fetch(`/api/insights/${slug}`)
      .then((r) => r.json())
      .then(setC)
      .catch(() => setC(null));
  }, [slug]);
  return (
    <div className="container">
      <TopBar />
      <section className="section">
        <div className="pill accent">for the author</div>
        <h1 className="serif" style={{ fontSize: 40, marginTop: 10 }}>What readers asked for</h1>
        <p className="sub">
          {a ? a.title.en : slug} — identifier-free counts of the editions readers (or their agents) requested. No one is tracked; this is the only thing the server ever learns.
        </p>
        {c ? (
          <>
            <div className="row" style={{ gap: 16, marginBottom: 16 }}>
              <span className="pill ink">{c.total} requests</span>
              <span className="pill">avg. known concepts {c.total ? (c.knownSum / c.total).toFixed(1) : '0'}</span>
              {c.updatedAt > 0 && <span className="muted small">updated {new Date(c.updatedAt).toLocaleString()}</span>}
            </div>
            <div className="cards-3">
              <Bars title="Level" data={c.byLevel} total={c.total} />
              <Bars title="Language" data={c.byLanguage} total={c.total} />
              <Bars title="Time budget" data={c.byTime} total={c.total} />
              <Bars title="Goal" data={c.byGoal} total={c.total} />
              <Bars title="Declared by" data={c.bySource} total={c.total} />
              <Bars title="What they did" data={c.byKind} total={c.total} />
            </div>
          </>
        ) : (
          <div className="muted">Loading…</div>
        )}
      </section>
    </div>
  );
}
