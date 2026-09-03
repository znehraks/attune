import { useEffect, useMemo, useState } from 'react';
import type { Level } from '../../shared/content';
import { composeEdition } from '../../shared/content';
import { baseBySlug, bySlug } from '../content';
import { contextStore } from '../lib/context';
import { registry } from '../lib/webmcp';
import { buildStudioSurface } from '../lib/tools';
import { navigate } from '../lib/router';
import { coverage, proposalToBlock, studioStore, type Proposal } from '../lib/overlay';
import { AgentConsole } from '../components/AgentConsole';
import { renderParagraphs } from '../lib/markdown';
import { TopBar } from './Home';

const LEVELS: Level[] = ['novice', 'intermediate', 'expert'];

export function Studio({ slug }: { slug: string }) {
  const [, force] = useState(0);
  const rerender = () => force((x) => x + 1);
  useEffect(() => studioStore.subscribe(rerender), []);
  useEffect(() => registry.subscribe(rerender), []);
  useEffect(() => contextStore.subscribe(rerender), []);
  const [flash, setFlash] = useState<string | null>(null);
  const base = baseBySlug(slug);
  const article = bySlug(slug);
  const lang = contextStore.get().language;
  const t = (en: string, ko: string) => (lang === 'ko' ? ko : en);

  useEffect(() => {
    if (!article || !base) return;
    document.title = `${t('Studio', '스튜디오')} — ${article.title[lang]} — Attune`;
    const { name, specs } = buildStudioSurface({
      article,
      base,
      origin: location.origin,
      flash: (id) => {
        setFlash(id);
        window.setTimeout(() => setFlash((x) => (x === id ? null : x)), 3000);
      },
    });
    void registry.setSurface(name, specs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.blocks.length, article?.faq.length, slug, lang]);

  const cov = useMemo(() => (article ? coverage(article) : null), [article]);
  if (!article || !base || !cov) {
    return (
      <div className="container">
        <TopBar />
        <div className="empty">No such article.</div>
      </div>
    );
  }
  const pending = studioStore.pending(slug);
  const decided = studioStore.state(slug).proposals.filter((p) => p.status !== 'pending').slice(-12).reverse();
  const minutes = Object.fromEntries(LEVELS.map((l) => [l, composeEdition(article, { level: l, language: lang, timeMinutes: 0 }).minutes]));
  const baseMinutes = Object.fromEntries(LEVELS.map((l) => [l, composeEdition(base, { level: l, language: lang, timeMinutes: 0 }).minutes]));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(article, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.attune.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const card = (p: Proposal) => {
    const src = p.sourceId ? article.blocks.find((b) => b.id === p.sourceId) : undefined;
    const label = p.kind === 'faq' ? t('FAQ entry', 'FAQ 항목') : p.kind === 'plainer' ? t('plainer version of', '쉬운 버전 ←') : t(`${p.level} version of`, `${p.level} 판 ←`);
    return (
      <div className={`proposal card${flash === p.id ? ' hl' : ''}${p.status !== 'pending' ? ` ${p.status}` : ''}`} key={p.id}>
        <div className="card-h">
          <h3>
            {p.by === 'agent' ? '🤖 ' : '✋ '}
            {label} {src ? <code>{src.id}</code> : null}
          </h3>
          <span className={`pill ${p.status === 'approved' ? 'ok' : p.status === 'rejected' ? 'bad' : 'warn'}`}>{p.status}</span>
        </div>
        <div className="card-b">
          {p.rationale && <div className="muted small" style={{ marginBottom: 8 }}>“{p.rationale}”</div>}
          {p.kind === 'faq' && p.faq ? (
            <div className="stack" style={{ gap: 6 }}>
              <b>{p.faq.question[lang]}</b>
              <p style={{ margin: 0 }}>{renderParagraphs(p.faq.answer[lang])}</p>
            </div>
          ) : (
            <div className="diff">
              {src && (
                <div className="diff-col">
                  <span className="facet-label">{t('source', '원문')} · {src.levels.join('/')}</span>
                  <p>{renderParagraphs(src.text[lang])}</p>
                </div>
              )}
              <div className="diff-col draft">
                <span className="facet-label">{t('draft', '초안')} · {p.level ?? t('plainer', '쉬운')}</span>
                <p>{renderParagraphs(p.text?.[lang] ?? '')}</p>
              </div>
            </div>
          )}
          {p.status === 'pending' && (
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn sm" onClick={() => studioStore.decide(slug, p.id, 'rejected')}>
                {t('Reject', '거절')}
              </button>
              <button className="btn sm accent" onClick={() => { studioStore.decide(slug, p.id, 'approved'); registry.record('approve_proposal', { proposal_id: p.id }, { by: 'the author, on the page' }); }}>
                {t('Approve — publish this block', '승인 — 이 블록 게시')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <TopBar />
      <header className="room-h" style={{ padding: '10px 0 18px' }}>
        <div>
          <div className="pill accent" style={{ marginBottom: 8 }}>{t('Author studio', '저자 스튜디오')}</div>
          <h1 className="serif" style={{ fontSize: 40, lineHeight: 1.1 }}>{article.title[lang]}</h1>
          <p className="muted" style={{ margin: '8px 0 0', maxWidth: 720 }}>
            {t('Your agent drafts the versions you have not written yet — for other reader levels, plainer rewrites, FAQ entries. Nothing is published until you click Approve. Readers’ agents then compose from what you approved.', '에이전트가 아직 안 쓴 판을 초안으로 씁니다. 다른 수준용, 쉬운 버전, FAQ. 승인을 누르기 전에는 아무것도 게시되지 않습니다. 독자의 에이전트는 승인된 것만으로 판을 구성합니다.')}
          </p>
        </div>
        <div className="row">
          <a className="btn" href={`/a/${slug}`} onClick={(e) => { e.preventDefault(); navigate(`/a/${slug}`); }}>{t('Reader view', '독자 화면')}</a>
          <button className="btn primary" onClick={exportJson}>{t('Export JSON', 'JSON 내보내기')}</button>
        </div>
      </header>
      <div className="article-grid">
        <main>
          <section className="card" style={{ marginBottom: 16 }}>
            <div className="card-h">
              <h3>{t('Coverage', '커버리지')}</h3>
              <span className="muted small">{article.blocks.length} {t('blocks', '블록')} ({base.blocks.length} {t('original', '원본')} + {article.blocks.length - base.blocks.length} {t('approved', '승인')})</span>
            </div>
            <div className="card-b">
              <table className="cov">
                <thead>
                  <tr>
                    <th>{t('Section', '섹션')}</th>
                    {LEVELS.map((l) => <th key={l}>{l}</th>)}
                    <th>{t('weakest', '가장 얇은')}</th>
                  </tr>
                </thead>
                <tbody>
                  {cov.sections.map((s) => (
                    <tr key={s.section_id}>
                      <td>{s.title}</td>
                      {LEVELS.map((l) => <td key={l} className={s.by_level[l] === 0 ? 'zero' : ''}>{s.by_level[l]}</td>)}
                      <td><span className="pill warn">{s.weakest}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="row small muted" style={{ marginTop: 10, gap: 14 }}>
                <span>{t('without plainer version', '쉬운 버전 없음')}: <b>{cov.blocks_without_plainer_version.length}</b></span>
                <span>{t('one level only', '한 수준만')}: <b>{cov.blocks_written_for_one_level_only.length}</b></span>
                <span>FAQ: <b>{cov.faq_count}</b></span>
                <span>{t('reading time by level', '수준별 읽기 시간')}: {LEVELS.map((l) => `${l} ${minutes[l]}′${minutes[l] !== baseMinutes[l] ? ` (was ${baseMinutes[l]}′)` : ''}`).join(' · ')}</span>
              </div>
            </div>
          </section>
          <section style={{ marginBottom: 16 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 className="serif" style={{ fontSize: 26 }}>{t('Pending drafts', '대기 중인 초안')} <span className="pill warn">{pending.length}</span></h2>
              {registry.native ? <span className="muted small">{t('Ask your agent: “Read the coverage and draft plainer versions for the three densest blocks.”', '에이전트에게: “커버리지를 읽고 가장 어려운 블록 3개의 쉬운 버전을 써 줘.”')}</span> : null}
            </div>
            {pending.length === 0 && <div className="empty">{t('No drafts waiting. Your agent can propose some — or run a tool by hand in the console.', '대기 중인 초안이 없습니다. 에이전트에게 부탁하거나 콘솔에서 툴을 실행해 보세요.')}</div>}
            <div className="stack">{pending.map(card)}</div>
          </section>
          {decided.length > 0 && (
            <section>
              <h2 className="serif" style={{ fontSize: 22, marginBottom: 8 }}>{t('Decided', '결정됨')}</h2>
              <div className="stack">{decided.map(card)}</div>
            </section>
          )}
        </main>
        <aside className="side">
          <AgentConsole registry={registry} compact />
          <section className="card">
            <div className="card-b small muted">
              {t('Approving is a human act: no tool can approve. Approved blocks join the article in this browser and in the export; readers’ agents compose from them and simplify_block can use approved plainer versions.', '승인은 사람의 행위입니다. 어떤 툴도 승인할 수 없습니다. 승인된 블록은 이 브라우저와 내보내기에 반영되고, 독자의 에이전트가 그것으로 판을 구성하며 simplify_block이 승인된 쉬운 버전을 씁니다.')}
              <div style={{ marginTop: 8 }}>
                <button className="btn xs ghost" onClick={() => studioStore.clear(slug)}>{t('Clear all drafts', '초안 모두 지우기')}</button>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export { proposalToBlock };
