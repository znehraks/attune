import type { Article, Edition, Goal, Lang, Level } from '../../shared/content';
import { contextStore } from '../lib/context';
import { outline } from '../../shared/content';

interface Props {
  article: Article | null;
  edition: Edition | null;
  onChange: () => void;
  onJump?: (sectionId: string) => void;
  agentDetected: boolean;
}

const LEVELS: Level[] = ['novice', 'intermediate', 'expert'];
const GOALS: Goal[] = ['understand', 'decide', 'build'];

export function EditionPanel({ article, edition, onChange, onJump, agentDetected }: Props) {
  const ctx = contextStore.get();
  const lang: Lang = ctx.language;
  const t = (en: string, ko: string) => (lang === 'ko' ? ko : en);
  const set = (p: Parameters<typeof contextStore.update>[0]) => {
    contextStore.update(p, 'hand');
    onChange();
  };
  const last = contextStore.log[contextStore.log.length - 1];
  return (
    <section className="card handshake">
      <div className="card-h">
        <h3>{t('Handshake', '핸드셰이크')}</h3>
        <span className="muted small">{t('what this page knows about you', '이 페이지가 아는 것 전부')}</span>
      </div>
      <div className="card-b stack">
        <div className="facets">
          <div className="facet">
            <span>{t('Level', '수준')}</span>
            <div className="seg">
              {LEVELS.map((l) => (
                <button key={l} className={ctx.level === l ? 'on' : ''} onClick={() => set({ level: l })}>
                  {t(l, l === 'novice' ? '입문' : l === 'intermediate' ? '중급' : '전문가')}
                </button>
              ))}
            </div>
          </div>
          <div className="facet">
            <span>{t('Language', '언어')}</span>
            <div className="seg">
              <button className={ctx.language === 'en' ? 'on' : ''} onClick={() => set({ language: 'en' })}>
                English
              </button>
              <button className={ctx.language === 'ko' ? 'on' : ''} onClick={() => set({ language: 'ko' })}>
                한국어
              </button>
            </div>
          </div>
          <div className="facet">
            <span>{t('Time', '시간')}</span>
            <div className="seg">
              {[0, 2, 5, 10].map((m) => (
                <button key={m} className={ctx.timeMinutes === m ? 'on' : ''} onClick={() => set({ timeMinutes: m })}>
                  {m === 0 ? t('all', '전체') : `${m}′`}
                </button>
              ))}
            </div>
          </div>
          <div className="facet">
            <span>{t('Goal', '목적')}</span>
            <div className="seg">
              {GOALS.map((g) => (
                <button key={g} className={ctx.goal === g ? 'on' : ''} onClick={() => set({ goal: g })}>
                  {t(g, g === 'understand' ? '이해' : g === 'decide' ? '결정' : '구현')}
                </button>
              ))}
            </div>
          </div>
        </div>
        {article && (
          <div className="known">
            <span className="facet-label">{t('I already know', '이미 아는 것')}</span>
            <div className="chips">
              {article.concepts.map((c) => {
                const on = ctx.knows.includes(c.id);
                return (
                  <button key={c.id} className={`chip${on ? ' on' : ''}`} title={c.definition[lang]} onClick={() => (on ? set({ knows: ctx.knows.filter((k) => k !== c.id), replaceKnows: true }) : set({ knows: [c.id] }))}>
                    {on ? '✓ ' : ''}
                    {c.label[lang]}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {edition && (
          <div className="edition-meta">
            <div>
              <b>{edition.minutes}</b> {t('min of', '분 /')} <b>{edition.fullMinutes}</b> {t('· ', '분 · ')}
              <b>{edition.blocks.length}</b> {t('blocks', '블록')}
              {edition.context.timeMinutes ? ` · ${t('trimmed to', '')} ${edition.context.timeMinutes}${t(' min', '분에 맞춤')}` : ''}
            </div>
            {edition.gaps.length > 0 && <div className="muted small">{t('Assumes you know:', '알고 있다고 가정:')} {edition.gaps.join(', ')}</div>}
          </div>
        )}
        {ctx.note && <div className="note-box">“{ctx.note}”</div>}
        <div className="declared small">
          {last ? (
            <>
              <span className={`dot ${last.source === 'agent' ? 'agent' : ''}`} />
              {last.source === 'agent' ? t('Declared by your agent', '에이전트가 선언') : last.source === 'hand' ? t('Set by you', '직접 설정') : t('Reset', '초기화')} · {new Date(last.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {last.changes.join('; ')}
            </>
          ) : (
            <>{agentDetected ? t('Nothing declared yet. Tell your agent how much time you have, what you know, and what you want.', '아직 선언된 게 없어요. 에이전트에게 시간·아는 것·목적을 말해 보세요.') : t('Nothing declared yet. Use the controls above, or bring an agent.', '아직 선언된 게 없어요. 위 조절기를 쓰거나 에이전트를 데려오세요.')}</>
          )}
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="muted small">{t('Stored in this browser only. No cookies, no fingerprinting.', '이 브라우저에만 저장. 쿠키·핑거프린팅 없음.')}</span>
          <button
            className="btn xs ghost"
            onClick={() => {
              contextStore.reset();
              onChange();
            }}
          >
            {t('Forget me', '잊어줘')}
          </button>
        </div>
        {edition && onJump && (
          <div className="outline">
            <span className="facet-label">{t('In this edition', '이 판의 구성')}</span>
            {outline(edition, lang).map((s) => (
              <button key={s.id} className="outline-item" onClick={() => onJump(s.id)}>
                <span>{s.title}</span>
                <span className="muted">{s.minutes}′</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
