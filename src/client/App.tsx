import { usePath } from './lib/router';
import { Home } from './pages/Home';
import { ArticlePage } from './pages/Article';
import { About } from './pages/About';
import { Insights } from './pages/Insights';

export function App() {
  const [path] = usePath();
  let m = path.match(/^\/a\/([a-z0-9-]{2,40})\/?$/);
  if (m) return <ArticlePage slug={m[1]} key={m[1]} />;
  m = path.match(/^\/insights\/([a-z0-9-]{2,40})\/?$/);
  if (m) return <Insights slug={m[1]} key={m[1]} />;
  if (path.startsWith('/publishers')) return <About />;
  return <Home />;
}
