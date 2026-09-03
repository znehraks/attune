import { usePath } from './lib/router';
import { Home } from './pages/Home';
import { ArticlePage } from './pages/Article';
import { About } from './pages/About';
import { Insights } from './pages/Insights';
import { useEffect, useState } from 'react';
import { demoStore } from './lib/demo';
import { contextStore } from './lib/context';

function DemoCaption() {
  const [, force] = useState(0);
  useEffect(() => demoStore.subscribe(() => force((x) => x + 1)), []);
  if (!demoStore.caption) return null;
  const ko = contextStore.get().language === 'ko';
  return (
    <div id="demo-cap" role="status">
      <span>{demoStore.caption}</span>
      <button className="btn xs" onClick={() => demoStore.stop()}>
        {ko ? '중지' : 'stop'}
      </button>
    </div>
  );
}

export function App() {
  const [path] = usePath();
  let m = path.match(/^\/a\/([a-z0-9-]{2,40})\/?$/);
  let page = <Home />;
  if (m) page = <ArticlePage slug={m[1]} key={m[1]} />;
  else {
    m = path.match(/^\/insights\/([a-z0-9-]{2,40})\/?$/);
    if (m) page = <Insights slug={m[1]} key={m[1]} />;
    else if (path.startsWith('/publishers')) page = <About />;
  }
  return (
    <>
      {page}
      <DemoCaption />
    </>
  );
}
