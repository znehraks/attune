import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Block, Edition } from '../../shared/content';
import { blockMinutes, composeEdition, deeperBlocks, simplerVersion } from '../../shared/content';
import { bySlug, articles } from '../content';
import { contextStore } from '../lib/context';
import { displayStore } from '../lib/display';
import { FrictionTracker, type BlockFriction } from '../lib/friction';
import { registry } from '../lib/webmcp';
import { buildSurface, type ArticleBridge } from '../lib/tools';
import { navigate } from '../lib/router';
import { Blocks } from '../components/Blocks';
import { EditionPanel } from '../components/EditionPanel';
import { AgentConsole } from '../components/AgentConsole';
import type { Params } from '../components/Interactives';
import { computeInteractive } from '../components/Interactives';
import { TopBar } from './Home';

function timeBucket(m: number): string {
  if (!m) return 'all';
  if (m <= 2) return '<=2';
  if (m <= 5) return '<=5';
  if (m <= 10) return '<=10';
  return '>10';
}

export function ArticlePage({ slug }: { slug: string }) {
  const article = bySlug(slug);
  const [, force] = useState(0);
  const rerender = useCallback(() => force((x) => x + 1), []);
  const [edition, setEdition] = useState<Edition | null>(() => (article ? composeEdition(article, contextStore.get()) : null));
  const [extras, setExtras] = useState<string[]>([]);
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const [interactives, setInteractives] = useState<Record<string, Params>>(() => {
    const out: Record<string, Params> = {};
    for (const [id, spec] of Object.entries(article?.interactives ?? {})) out[id] = Object.fromEntries(Object.entries(spec.params).map(([k, p]) => [k, p.default]));
    return out;
  });
  const [showFriction, setShowFriction] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const frictionRef = useRef(new FrictionTracker());
  const mainRef = useRef<HTMLDivElement>(null);
  const [frictionMap, setFrictionMap] = useState<Map<string, BlockFriction>>(new Map());

  const showToast = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast((x) => (x === t ? null : x)), 2800);
  }, []);

  useEffect(() => contextStore.subscribe(rerender), [rerender]);
  useEffect(() => displayStore.subscribe(rerender), [rerender]);

  // Spotlight: keep the section in view (or the focused section) bright, dim the rest.
  const [inFocus, setInFocus] = useState<string | null>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const explicit = displayStore.focusSection;
      if (explicit) {
        setInFocus(explicit);
        return;
      }
      if (!displayStore.display.spotlight) {
        setInFocus(null);
        return;
      }
      const mid = window.innerHeight * 0.4;
      let best: string | null = null;
      for (const el of document.querySelectorAll<HTMLElement>('[data-block]')) {
        const r = el.getBoundingClientRect();
        if (r.top <= mid) best = el.dataset.block ?? best;
      }
      setInFocus(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    const unsub = displayStore.subscribe(update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      unsub();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Friction tracking over the rendered blocks
  useEffect(() => {
    if (!article || !mainRef.current || !edition) return;
    const fr = frictionRef.current;
    fr.start(mainRef.current, (id) => {
      const b = article.blocks.find((x) => x.id === id);
      return b ? blockMinutes(b, edition.context.language) : 0.3;
    });
    const unsub = fr.subscribe(() => setFrictionMap(new Map(fr.report().map((r) => [r.blockId, r]))));
    return () => {
      unsub();
      fr.stop();
    };
    // re-observe when the set of blocks changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article, edition?.blocks.map((b) => b.id).join(','), extras.join(','), Object.values(swaps).join(',')]);

  const flash = useCallback((ids: string[]) => {
    setHighlight(new Set(ids));
    window.setTimeout(() => setHighlight(new Set()), 2600);
  }, []);

  const report = useCallback(
    (kind: 'edition' | 'simplify' | 'expand' | 'ask' | 'interactive', source: 'agent' | 'hand') => {
      if (!article) return;
      const c = contextStore.get();
      const body = { slug: article.slug, level: c.level, language: c.language, timeBucket: timeBucket(c.timeMinutes), goal: c.goal, source, knownCount: c.knows.length, kind };
      fetch('/api/edition', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(() => undefined);
    },
    [article],
  );

  const recompose = useCallback(
    (source: 'agent' | 'hand') => {
      if (!article) throw new Error('no article');
      const ed = composeEdition(article, contextStore.get());
      setEdition(ed);
      setExtras([]);
      setSwaps({});
      if (source === 'hand') report('edition', 'hand');
      return ed;
    },
    [article, report],
  );

  const scrollTo = useCallback((blockId: string) => {
    const el = document.getElementById(`b-${blockId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const simplify = useCallback(
    (blockId: string): Block | null => {
      if (!article) return null;
      const s = simplerVersion(article, blockId);
      if (!s) return null;
      setSwaps((m) => ({ ...m, [blockId]: s.id }));
      flash([s.id]);
      window.setTimeout(() => scrollTo(s.id), 50);
      return s;
    },
    [article, flash, scrollTo],
  );

  const expand = useCallback(
    (sectionId: string): Block[] => {
      if (!article || !edition) return [];
      const added = deeperBlocks(article, edition, sectionId).filter((b) => !extras.includes(b.id));
      if (added.length) {
        setExtras((x) => [...x, ...added.map((b) => b.id)]);
        flash(added.map((b) => b.id));
      }
      return added;
    },
    [article, edition, extras, flash],
  );

  const setInteractive = useCallback(
    (id: string, params: Params) => {
      setInteractives((m) => ({ ...m, [id]: params }));
      const b = article?.blocks.find((x) => x.kind === 'interactive' && x.interactive === id);
      if (b) flash([b.id]);
      return computeInteractive(id, params);
    },
    [article, flash],
  );

  const placeKey = `attune:place:${slug}`;
  const savePlace = useCallback(
    (blockId?: string) => {
      let id = blockId ?? null;
      if (!id) {
        const els = [...document.querySelectorAll<HTMLElement>('[data-block]')];
        const mid = window.innerHeight / 2;
        const best = els.map((e) => ({ e, d: Math.abs(e.getBoundingClientRect().top - mid) })).sort((a, b) => a.d - b.d)[0];
        id = best?.e.dataset.block ?? null;
      }
      if (id) {
        try {
          localStorage.setItem(placeKey, id);
        } catch {
          /* ignore */
        }
        showToast(contextStore.get().language === 'ko' ? '위치를 저장했어요' : 'Place saved');
      }
      return id;
    },
    [placeKey, showToast],
  );
  const resumePlace = useCallback(() => {
    let id: string | null = null;
    try {
      id = localStorage.getItem(placeKey);
    } catch {
      /* ignore */
    }
    if (id) {
      scrollTo(id);
      flash([id]);
    }
    return id;
  }, [placeKey, scrollTo, flash]);

  // Plain language: show the author's plainer rewrite wherever one exists.
  const effectiveSwaps = useMemo(() => {
    if (!article || !edition || !edition.context.plainLanguage) return swaps;
    const auto: Record<string, string> = {};
    for (const b of edition.blocks) {
      const plainer = article.blocks.find((x) => x.simplerOf === b.id);
      if (plainer) auto[b.id] = plainer.id;
    }
    return { ...auto, ...swaps };
  }, [article, edition, swaps]);

  // Visible block list = edition blocks with swaps applied, plus extras placed after their section's last block.
  const visible = useMemo(() => {
    if (!article || !edition) return [] as Block[];
    const out: Block[] = [];
    const extraBlocks = extras.map((id) => article.blocks.find((b) => b.id === id)).filter(Boolean) as Block[];
    const bySection = new Map<string, Block[]>();
    for (const b of extraBlocks) {
      const list = bySection.get(b.section ?? '') ?? [];
      list.push(b);
      bySection.set(b.section ?? '', list);
    }
    let currentSection = '';
    const flushSection = () => {
      const list = bySection.get(currentSection);
      if (list) {
        out.push(...list);
        bySection.delete(currentSection);
      }
    };
    for (const b of edition.blocks) {
      if (b.kind === 'heading') {
        flushSection();
        currentSection = b.id;
      }
      const swap = effectiveSwaps[b.id];
      out.push(swap ? article.blocks.find((x) => x.id === swap) ?? b : b);
    }
    flushSection();
    for (const list of bySection.values()) out.push(...list);
    return out;
  }, [article, edition, extras, effectiveSwaps]);

  // Which blocks belong to the focused section (a section id, or '_intro' for blocks before the first heading)?
  const focusIds = useMemo(() => {
    if (!inFocus) return new Set<string>();
    const target = inFocus;
    // If the focus is a block id (from scroll tracking), resolve to its section.
    const blk = visible.find((b) => b.id === target);
    const sectionId = blk ? (blk.kind === 'heading' ? blk.id : blk.section ?? '_intro') : target;
    return new Set(visible.filter((b) => (sectionId === '_intro' ? !b.section && b.kind !== 'heading' : b.id === sectionId || b.section === sectionId)).map((b) => b.id));
  }, [inFocus, visible]);

  // Bridge for tools
  const bridgeRef = useRef<ArticleBridge | null>(null);
  if (article && edition) {
    bridgeRef.current = { article, edition, extras, swaps, interactives, friction: frictionRef.current, recompose, simplify, expand, setInteractive, scrollTo, savePlace, resumePlace, report };
  }

  useEffect(() => {
    if (!article || !edition) return;
    const { name, specs } = buildSurface({ articles, bridge: bridgeRef.current, navigate, origin: location.origin });
    void registry.setSurface(name, specs);
  }, [article, edition, extras, swaps, interactives, recompose, simplify, expand, setInteractive, savePlace, resumePlace, report]);

  useEffect(() => {
    const unsub = registry.subscribe(rerender);
    return unsub;
  }, [rerender]);

  if (!article || !edition) {
    return (
      <div className="container">
        <TopBar />
        <div className="card" style={{ marginTop: 40, padding: 30, textAlign: 'center' }}>
          <h2 className="serif" style={{ fontSize: 34 }}>No such article</h2>
          <a className="btn primary" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Back to the front page</a>
        </div>
      </div>
    );
  }

  const lang = edition.context.language;
  const t = (en: string, ko: string) => (lang === 'ko' ? ko : en);
  const canExpand = (sectionId: string) => deeperBlocks(article, edition, sectionId).some((b) => !extras.includes(b.id));
  const frictionCount = [...frictionMap.values()].filter((f) => f.score > 0).length;

  return (
    <div className="container article-page">
      <TopBar />
      <div className="article-grid">
        <main ref={mainRef} className={lang === 'ko' ? 'ko' : ''}>
          <header className="article-h">
            <div className="row" style={{ gap: 8 }}>
              <span className="pill accent">{t(edition.context.level, edition.context.level === 'novice' ? '입문' : edition.context.level === 'intermediate' ? '중급' : '전문가')} {t('edition', '판')}</span>
              <span className="pill">{edition.minutes} {t('min', '분')}{edition.context.timeMinutes ? ` · ${t('trimmed from', '원본')} ${edition.fullMinutes}${t('', '분에서 축약')}` : ` · ${t('full', '전체')}`}</span>
              {edition.context.knows.length > 0 && <span className="pill ok">{t(`skips ${edition.context.knows.length} known concept${edition.context.knows.length > 1 ? 's' : ''}`, `아는 개념 ${edition.context.knows.length}개 건너뜀`)}</span>}
            </div>
            <h1 className="serif">{article.title[lang]}</h1>
            <p className="deck">{article.deck[lang]}</p>
            <div className="byline muted small">
              {article.author} · {article.date} · <a href={`/insights/${article.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/insights/${article.slug}`); }}>{t('what readers asked for', '독자들이 요청한 판')}</a>
            </div>
          </header>
          {registry.native && contextStore.log.length === 0 && (
            <div className="banner info">
              <span>🤖</span>
              <span>{t('Your agent can shape this page. Try: “I have three minutes, I already know MCP, give me the expert version.”', '에이전트가 이 페이지를 바꿀 수 있어요. 이렇게 말해 보세요: “3분밖에 없고 MCP는 아니까 전문가 판으로.”')}</span>
            </div>
          )}
          <Blocks
            article={article}
            blocks={visible}
            lang={lang}
            swaps={effectiveSwaps}
            extras={new Set(extras)}
            focusIds={focusIds}
            friction={frictionMap}
            highlight={highlight}
            interactives={interactives}
            onInteractive={(id, p) => {
              setInteractive(id, p);
              report('interactive', 'hand');
            }}
            onSimplify={(id) => {
              const s = simplify(id);
              report('simplify', 'hand');
              if (!s) showToast(t('No plainer version for this block', '이 블록의 쉬운 버전이 없어요'));
            }}
            onExpand={(s) => {
              expand(s);
              report('expand', 'hand');
            }}
            canExpand={canExpand}
            showFriction={showFriction}
          />
          <footer className="article-f muted small">
            <label className="row" style={{ gap: 6 }}>
              <input type="checkbox" checked={showFriction} onChange={(e) => setShowFriction(e.target.checked)} />
              {t('Show where I paused (visible to my agent only if it asks)', '내가 멈춘 곳 표시 (에이전트가 요청할 때만 볼 수 있음)')}
              {frictionCount > 0 && <span className="pill warn">{frictionCount}</span>}
            </label>
            <span>{t('Every word above was written by the author. Editions are composed, never generated.', '위의 모든 문장은 저자가 썼습니다. 판은 조합될 뿐, 생성되지 않습니다.')}</span>
          </footer>
        </main>
        <aside className="side">
          <EditionPanel article={article} edition={edition} onChange={() => recompose('hand')} onJump={(id) => scrollTo(id)} agentDetected={registry.native} />
          <AgentConsole registry={registry} compact />
        </aside>
      </div>
      {(displayStore.display.layout === 'focus' || displayStore.focusSection) && (
        <div className="display-fab row" style={{ gap: 8 }}>
          {displayStore.focusSection && (
            <button className="btn sm" onClick={() => displayStore.setFocus(null, 'hand')}>
              {t('Show whole article', '전체 보기')}
            </button>
          )}
          {displayStore.display.layout === 'focus' && (
            <button className="btn sm primary" onClick={() => displayStore.setOverrides({ layout: 'standard', showPanels: true }, 'hand')} title={t('Show the Handshake panel', '핸드셰이크 패널 보기')}>
              ⚙ {t('Display', '화면')}
            </button>
          )}
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
