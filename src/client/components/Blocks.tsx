import { useEffect, useRef } from 'react';
import type { Article, Block, Lang } from '../../shared/content';
import { renderInline, renderList, renderParagraphs } from '../lib/markdown';
import { Interactive, type Params } from './Interactives';
import type { BlockFriction } from '../lib/friction';

interface Props {
  article: Article;
  blocks: Block[];
  lang: Lang;
  swaps: Record<string, string>;
  extras: Set<string>;
  friction: Map<string, BlockFriction>;
  highlight: Set<string>;
  focusIds?: Set<string>;
  interactives: Record<string, Params>;
  onInteractive: (id: string, params: Params) => void;
  onSimplify: (blockId: string) => void;
  onExpand: (sectionId: string) => void;
  canExpand: (sectionId: string) => boolean;
  showFriction: boolean;
}

export function Blocks({ article, blocks, lang, swaps, extras, friction, highlight, focusIds, interactives, onInteractive, onSimplify, onExpand, canExpand, showFriction }: Props) {
  const t = (en: string, ko: string) => (lang === 'ko' ? ko : en);
  return (
    <div className="blocks">
      {blocks.map((b) => {
        const swappedFrom = Object.entries(swaps).find(([, to]) => to === b.id)?.[0];
        const fr = friction.get(b.id);
        const cls = ['block', `k-${b.kind}`, highlight.has(b.id) ? 'hl' : '', extras.has(b.id) ? 'extra' : '', showFriction && fr && fr.score > 0 ? 'friction' : '', focusIds?.has(b.id) ? 'in-focus' : ''].filter(Boolean).join(' ');
        return (
          <div className={cls} data-block={b.id} id={`b-${b.id}`} key={b.id}>
            {showFriction && fr && fr.score > 0 && (
              <span className="fr-dot" title={t(`You paused here (${fr.visibleSeconds}s, re-read ${fr.reReads}×). Your agent can see this if it asks.`, `여기서 멈췄어요 (${fr.visibleSeconds}초, 되읽기 ${fr.reReads}회). 에이전트가 요청하면 볼 수 있습니다.`)} />
            )}
            {swappedFrom && <span className="tag swap">{t('plainer version', '쉬운 버전')}</span>}
            {extras.has(b.id) && <span className="tag deep">{t('deeper', '심화')}</span>}
            <BlockBody b={b} article={article} lang={lang} interactives={interactives} onInteractive={onInteractive} onExpand={onExpand} canExpand={canExpand} onSimplify={onSimplify} />
          </div>
        );
      })}
    </div>
  );
}

function BlockBody({ b, article, lang, interactives, onInteractive, onExpand, canExpand, onSimplify }: { b: Block; article: Article; lang: Lang; interactives: Record<string, Params>; onInteractive: (id: string, p: Params) => void; onExpand: (s: string) => void; canExpand: (s: string) => boolean; onSimplify: (id: string) => void }) {
  const text = b.text[lang] ?? b.text.en;
  const t = (en: string, ko: string) => (lang === 'ko' ? ko : en);
  switch (b.kind) {
    case 'heading':
      return (
        <h2 className="serif">
          {renderInline(text)}
          {canExpand(b.id) && (
            <button className="btn xs ghost expand" onClick={() => onExpand(b.id)} title={t('Show deeper material in this section', '이 섹션의 심화 내용 보기')}>
              + {t('deeper', '심화')}
            </button>
          )}
        </h2>
      );
    case 'para':
      return (
        <p>
          {renderParagraphs(text)}
          {(article.blocks.some((x) => x.simplerOf === b.id) || (b.teaches?.length && !b.levels.includes('novice'))) && (
            <button className="btn xs ghost simplify" onClick={() => onSimplify(b.id)} title={t('Show a plainer version', '쉬운 버전 보기')}>
              {t('plainer?', '더 쉽게?')}
            </button>
          )}
        </p>
      );
    case 'list':
      return <ul>{renderList(text)}</ul>;
    case 'code':
      return (
        <pre>
          <code>{text}</code>
        </pre>
      );
    case 'quote':
      return <blockquote className="serif">{renderParagraphs(text)}</blockquote>;
    case 'aside':
      return (
        <aside>
          <span className="aside-label">{t('Aside', '곁가지')}</span>
          {renderParagraphs(text)}
        </aside>
      );
    case 'figure':
      return (
        <figure>
          <FigureSvg svg={article.figures?.[b.figure ?? ''] ?? ''} />
          <figcaption>{renderInline(text)}</figcaption>
        </figure>
      );
    case 'interactive': {
      const id = b.interactive ?? '';
      return (
        <div className="interactive-wrap">
          <p className="ia-lead">{renderParagraphs(text)}</p>
          <Interactive id={id} params={interactives[id] ?? {}} lang={lang} onChange={(p) => onInteractive(id, p)} />
        </div>
      );
    }
    default:
      return <p>{renderParagraphs(text)}</p>;
  }
}

/** Renders author-provided inline SVG. Content is authored in this repo (not user input); scripts/handlers are stripped defensively. */
function FigureSvg({ svg }: { svg: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const clean = svg.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, '');
    ref.current.innerHTML = clean;
  }, [svg]);
  return <div className="fig" ref={ref} />;
}
