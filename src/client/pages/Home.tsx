import { useEffect, useState } from 'react';
import { composeEdition, type Level } from '../../shared/content';
import { articles } from '../content';
import { contextStore } from '../lib/context';
import { displayStore } from '../lib/display';
import { registry } from '../lib/webmcp';
import { buildSurface } from '../lib/tools';
import { navigate } from '../lib/router';
import { AgentConsole } from '../components/AgentConsole';
import { EditionPanel } from '../components/EditionPanel';

export function TopBar() {
  const lang = contextStore.get().language;
  return (
    <div className="topbar">
      <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
        <span className="logo"><i /><i /><i /></span>
        Attune
      </a>
      <nav>
        <a href="/publishers" onClick={(e) => { e.preventDefault(); navigate('/publishers'); }}>{lang === 'ko' ? '퍼블리셔용' : 'For publishers'}</a>
        <a href="https://github.com/znehraks/attune" target="_blank" rel="noreferrer">GitHub</a>
      </nav>
    </div>
  );
}

const LEVELS: Level[] = ['novice', 'intermediate', 'expert'];

export function Home() {
  const [, force] = useState(0);
  useEffect(() => contextStore.subscribe(() => force((x) => x + 1)), []);
  useEffect(() => displayStore.subscribe(() => force((x) => x + 1)), []);
  useEffect(() => {
    const { name, specs } = buildSurface({ articles, bridge: null, navigate, origin: location.origin });
    void registry.setSurface(name, specs);
    return registry.subscribe(() => force((x) => x + 1));
  }, []);
  const ctx = contextStore.get();
  const lang = ctx.language;
  const t = (en: string, ko: string) => (lang === 'ko' ? ko : en);
  return (
    <div className="container">
      <TopBar />
      <section className="hero">
        <div>
          <div className="pill accent" style={{ marginBottom: 14 }}>{t('Built on WebMCP · OpenAI WebMCP Challenge 2026', 'WebMCP 기반 · OpenAI WebMCP Challenge 2026')}</div>
          <h1 className="serif">{t('Pages that ', '')}<em>{t('negotiate', '추적')}</em>{t(' with your agent,', ' 대신 ')}<br />{t('not track you.', '')}<em>{t('', '협상')}</em>{t('', '하는 페이지.')}</h1>
          <p className="lede">
            {t(
              'Tell your agent how much time you have, what you already know, and what you are trying to do. Each page here composes an edition for you — from the author’s own blocks, never generated — and shows you exactly what it was told. No cookies. No profile. Interactives your agent can operate. A page that notices where you got stuck.',
              '에이전트에게 시간이 얼마나 있는지, 무엇을 이미 아는지, 무엇을 하려는지 말하세요. 여기 있는 모든 페이지는 저자가 직접 쓴 블록만으로 당신을 위한 판을 구성하고, 무엇을 전달받았는지 그대로 보여줍니다. 쿠키도 프로필도 없습니다. 에이전트가 조작할 수 있는 인터랙티브, 당신이 어디서 막혔는지 알아채는 페이지.',
            )}
          </p>
          <div className="cta">
            <a className="btn accent" href={`/a/${articles[0]?.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/a/${articles[0]?.slug}`); }}>
              {t('Read the first article', '첫 번째 기사 읽기')}
            </a>
            <a className="btn" href="/publishers" onClick={(e) => { e.preventDefault(); navigate('/publishers'); }}>
              {t('How a page does this', '페이지가 이걸 하는 법')}
            </a>
          </div>
        </div>
        <div className="art">
          <AgentConsole registry={registry} />
        </div>
      </section>

      <section className="section">
        <h2 className="serif">{t('Articles', '기사')}</h2>
        <p className="sub">{t('Three articles, each written at three levels in two languages, with an interactive your agent can drive. Reading times below are for your current handshake.', '기사 3편, 각각 3개 수준 × 2개 언어로 저자가 직접 썼고, 에이전트가 조작할 수 있는 인터랙티브가 하나씩 있습니다. 아래 읽기 시간은 현재 핸드셰이크 기준입니다.')}</p>
        <div className="cards-3">
          {articles.map((a) => {
            const mins = Object.fromEntries(LEVELS.map((l) => [l, composeEdition(a, { ...ctx, level: l, timeMinutes: 0 }).minutes]));
            return (
              <a className="card step article-card" key={a.slug} href={`/a/${a.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/a/${a.slug}`); }}>
                <div className="n">{a.date} · {Object.keys(a.interactives ?? {}).length ? t('interactive', '인터랙티브') : ''}</div>
                <h3 className="serif" style={{ fontSize: 26 }}>{a.title[lang]}</h3>
                <p>{a.deck[lang]}</p>
                <div className="row small muted" style={{ marginTop: 12, gap: 10 }}>
                  {LEVELS.map((l) => (
                    <span key={l}>{t(l, l === 'novice' ? '입문' : l === 'intermediate' ? '중급' : '전문가')} {mins[l]}′</span>
                  ))}
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="grid-2">
          <div>
            <h2 className="serif">{t('How it works', '작동 방식')}</h2>
            <ol className="how">
              <li><b>{t('Your agent declares.', '에이전트가 선언합니다.')}</b> {t('Level, language, time budget, goal, concepts you know — and how you read best: vision, hands, attention, device, lighting. Your agent already knows these from its memory; it declares them on arrival, before you ask.', '수준, 언어, 시간, 목적, 아는 개념 — 그리고 시각·손·주의력·기기·조명 같은 읽기 편한 방식. 에이전트는 이미 메모리로 알고 있어서, 묻기 전에 도착하자마자 선언합니다.')}</li>
              <li><b>{t('The page composes — words and screen.', '페이지가 구성합니다. 글도, 화면도.')}</b> {t('Author-written blocks are filtered by level, prerequisites pulled in, lower-priority blocks trimmed to your time; the page itself picks type size, contrast, font, spacing and layout from what you need. Every decision has a reason you can see.', '저자가 쓴 블록을 수준으로 거르고, 선행 개념을 끌어오고, 시간에 맞춰 덜어냅니다. 글자 크기·대비·글꼴·간격·배치도 페이지가 당신의 필요에서 고릅니다. 모든 결정에는 볼 수 있는 이유가 있습니다.')}</li>
              <li><b>{t('You stay in charge.', '주도권은 당신에게.')}</b> {t('Everything the page knows is on the page. Change it by hand, or say “forget me”.', '페이지가 아는 것은 전부 페이지 위에 있습니다. 직접 바꾸거나 “잊어줘”라고 하세요.')}</li>
              <li><b>{t('The page notices.', '페이지가 알아챕니다.')}</b> {t('Re-read a paragraph twice and your agent can ask the page where you got stuck — then swap in the author’s plainer version, right there.', '같은 문단을 두 번 되읽으면, 에이전트가 페이지에게 어디서 막혔는지 물을 수 있고, 저자가 쓴 쉬운 버전을 그 자리에 바꿔 넣습니다.')}</li>
            </ol>
          </div>
          <EditionPanel article={null} edition={null} onChange={() => force((x) => x + 1)} agentDetected={registry.native} />
        </div>
      </section>

      <section className="section" id="test">
        <h2 className="serif">{t('Test it with your agent', '에이전트로 테스트하기')}</h2>
        <div className="cards-3">
          <div className="card step">
            <div className="n">ChatGPT desktop</div>
            <p>{t('Open this site in the built-in browser (model Sol or Terra) and say: “I have three minutes, I’m a web developer who knows MCP, and I read Korean. Open the WebMCP article.”', '내장 브라우저(모델 Sol 또는 Terra)에서 이 사이트를 열고 말하세요: “3분밖에 없고, MCP를 아는 웹 개발자이고, 한국어로 읽을게. WebMCP 기사 열어줘.”')}</p>
          </div>
          <div className="card step">
            <div className="n">Chrome 149+</div>
            <p>{t('Enable chrome://flags/#enable-webmcp-testing, install the Model Context Tool Inspector, and call declare_reader_context yourself.', 'chrome://flags/#enable-webmcp-testing 를 켜고 Model Context Tool Inspector를 설치해 declare_reader_context를 직접 호출해 보세요.')}</p>
          </div>
          <div className="card step">
            <div className="n">{t('No agent?', '에이전트가 없다면?')}</div>
            <p>{t('The Handshake panel on every page does the same thing by hand, and the Agent console lets you run any tool.', '모든 페이지의 핸드셰이크 패널로 같은 일을 직접 할 수 있고, 에이전트 콘솔에서 어떤 툴이든 실행할 수 있습니다.')}</p>
          </div>
        </div>
      </section>
      <footer className="footer">
        <span>Attune · MIT · Cloudflare Workers · React · WebMCP</span>
        <span>{t('Server-side, the only thing stored is an anonymous count of which edition shapes were requested — see “what readers asked for” on any article.', '서버에는 어떤 형태의 판이 요청됐는지의 익명 집계만 남습니다 — 각 기사의 “독자들이 요청한 판”에서 볼 수 있습니다.')}</span>
      </footer>
    </div>
  );
}
