import { TopBar } from './Home';

export function About() {
  return (
    <div className="container">
      <TopBar />
      <section className="section" style={{ maxWidth: 820 }}>
        <div className="pill accent">for publishers</div>
        <h1 className="serif" style={{ fontSize: 44, marginTop: 10 }}>Make a page that negotiates</h1>
        <p className="sub">
          Attune is a pattern, not a platform. Any site can do this with WebMCP and a little structure in its content. Here is the whole idea in three parts.
        </p>
        <h2 className="serif">1. Write blocks, not pages</h2>
        <p>
          Split an article into blocks with facets: which levels include it, how important it is, which concepts it teaches or requires, which reader goals it serves. Write the same idea at different levels as different blocks. Keep a plainer rewrite of dense blocks. The author stays in control of every word.
        </p>
        <pre>
          <code>{`{ id: 'why-tools', kind: 'para', levels: ['intermediate','expert'], priority: 2,
  teaches: ['tool'], requires: ['agent'], goals: ['understand'], section: 'how',
  text: { en: '…', ko: '…' } }`}</code>
        </pre>
        <h2 className="serif">2. Compose deterministically</h2>
        <p>
          Given a reader context — level, language, time budget, goal, known and unknown concepts — filter, pull in prerequisites, trim by priority, drop empty sections. Every block gets a reason. No model rewrites anything, so nothing is invented and the author’s voice survives.
        </p>
        <h2 className="serif">3. Let the reader’s agent declare, and show it</h2>
        <p>Register a handful of tools with WebMCP. The agent declares the context it already has from its conversation; the page recomposes; the reader sees exactly what was declared and can change or erase it.</p>
        <pre>
          <code>{`await document.modelContext.registerTool({
  name: 'declare_reader_context',
  description: 'Tell this page what the reader needs: level, language, time, goal, known concepts.',
  inputSchema: { type: 'object', properties: { level: { enum: ['novice','intermediate','expert'] },
    language: { enum: ['en','ko'] }, time_minutes: { type: 'integer' }, knows: { type: 'array', items: { type: 'string' } } } },
  execute: async (ctx) => { store.update(ctx); return { outline: compose(article, store.get()) }; }
}, { signal: surface.signal });`}</code>
        </pre>
        <h2 className="serif">Why this beats “just summarize it for me”</h2>
        <ul>
          <li><b>Accuracy:</b> editions are made of the author’s blocks; a summarizer invents transitions and sometimes facts.</li>
          <li><b>Interactivity:</b> calculators, simulations and figures re-parameterize; a summary flattens them to text.</li>
          <li><b>Privacy:</b> the reader shares five coarse facets, on purpose, visibly — not a behavioural profile harvested by trackers.</li>
          <li><b>The author’s economics:</b> readers stay on the page, and the author learns — in aggregate, anonymously — what editions people actually want.</li>
          <li><b>Reading friction:</b> the page can tell the agent where the reader got stuck, and swap in the author’s plainer version right there.</li>
        </ul>
        <p className="muted">
          Source and content model: <a href="https://github.com/znehraks/attune">github.com/znehraks/attune</a> (MIT).
        </p>
      </section>
    </div>
  );
}
