import type { Article, Edition, Goal, Lang, Level } from '../../shared/content';
import { outline } from '../../shared/content';
import { DISPLAY_PRESETS, type Display, type Needs } from '../../shared/needs';
import { contextStore } from '../lib/context';
import { displayStore } from '../lib/display';

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
  const { display, decisions, overridden } = displayStore.resolve();
  const needs = displayStore.needs;
  const lastDisplay = displayStore.log[displayStore.log.length - 1];
  const setNeed = (k: keyof Needs, v: string) => {
    displayStore.declareNeeds({ [k]: v } as Partial<Needs>, 'hand');
    onChange();
  };
  const setDisp = (p: Partial<Display>) => {
    displayStore.setOverrides(p, 'hand');
    onChange();
  };
  const seg = <T extends string | number>(current: T, options: readonly T[], on: (v: T) => void, label: (v: T) => string) => (
    <div className="seg">
      {options.map((o) => (
        <button key={String(o)} className={current === o ? 'on' : ''} onClick={() => on(o)}>
          {label(o)}
        </button>
      ))}
    </div>
  );
  const sel = (k: keyof Needs, options: readonly string[], labels: Record<string, string>) => (
    <div className="facet">
      <span>{labels._label}</span>
      <select value={String(needs[k] ?? '')} onChange={(e) => setNeed(k, e.target.value)} aria-label={labels._label}>
        {options.map((o) => (
          <option key={o} value={o}>
            {labels[o] ?? o}
          </option>
        ))}
      </select>
    </div>
  );

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
            {seg(ctx.level, LEVELS, (l) => set({ level: l }), (l) => t(l, l === 'novice' ? '입문' : l === 'intermediate' ? '중급' : '전문가'))}
          </div>
          <div className="facet">
            <span>{t('Language', '언어')}</span>
            {seg(ctx.language, ['en', 'ko'] as const, (l) => set({ language: l }), (l) => (l === 'en' ? 'English' : '한국어'))}
          </div>
          <div className="facet">
            <span>{t('Time', '시간')}</span>
            {seg(ctx.timeMinutes, [0, 2, 5, 10] as const, (m) => set({ timeMinutes: m }), (m) => (m === 0 ? t('all', '전체') : t(`${m} min`, `${m}분`)))}
          </div>
          <div className="facet">
            <span>{t('Goal', '목적')}</span>
            {seg(ctx.goal, GOALS, (g) => set({ goal: g }), (g) => t(g, g === 'understand' ? '이해' : g === 'decide' ? '결정' : '구현'))}
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
              {ctx.plainLanguage ? ` · ${t('plain language', '쉬운 말')}` : ''}
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

        <div className="stack" style={{ gap: 8 }}>
          <span className="facet-label">{t('How I read best', '내가 읽기 편한 방식')}</span>
          <div className="needs">
            {sel('vision', ['typical', 'low-vision', 'light-sensitive', 'color-blind', 'screen-reader'], { _label: t('Vision', '시각'), typical: t('typical', '보통'), 'low-vision': t('low vision', '저시력'), 'light-sensitive': t('light sensitive', '빛에 민감'), 'color-blind': t('color blind', '색각 이상'), 'screen-reader': t('screen reader', '스크린 리더') })}
            {sel('motor', ['typical', 'limited-precision', 'keyboard-only', 'one-handed'], { _label: t('Hands', '손'), typical: t('typical', '보통'), 'limited-precision': t('limited precision', '정밀 조작 어려움'), 'keyboard-only': t('keyboard only', '키보드만'), 'one-handed': t('one-handed', '한 손') })}
            {sel('reading', ['typical', 'dyslexia', 'easily-distracted', 'plain-language'], { _label: t('Reading', '읽기'), typical: t('typical', '보통'), dyslexia: t('dyslexia', '난독'), 'easily-distracted': t('easily distracted', '주의 분산 쉬움'), 'plain-language': t('plain language', '쉬운 말') })}
            {sel('device', ['unknown', 'desktop', 'phone', 'tablet'], { _label: t('Device', '기기'), unknown: t('unknown', '모름'), desktop: t('desktop', '데스크톱'), phone: t('phone', '폰'), tablet: t('tablet', '태블릿') })}
            {sel('light', ['normal', 'dark-room', 'bright-sunlight'], { _label: t('Lighting', '조명'), normal: t('normal', '보통'), 'dark-room': t('dark room', '어두운 방'), 'bright-sunlight': t('bright sunlight', '밝은 햇빛') })}
          </div>
          {decisions.filter((d) => !overridden.includes(d.setting)).length > 0 && (
            <div className="design-why">
              {decisions.filter((d) => !overridden.includes(d.setting)).map((d) => (
                <span key={`${d.setting}-${String(d.value)}`}>
                  <b>{d.setting}</b> → {String(d.value)} <span className="muted">({d.because})</span>
                </span>
              ))}
            </div>
          )}
          {needs.note && <div className="note-box">“{needs.note}”</div>}
        </div>

        <div className="stack" style={{ gap: 8 }}>
          <span className="facet-label">{t('Display', '화면')}{overridden.length ? ` · ${t('your preferences win', '내 설정 우선')}` : ''}</span>
          <div className="facet">
            <span>{t('Theme', '테마')}</span>
            {seg(display.theme, ['light', 'dark', 'sepia', 'high-contrast'] as const, (v) => setDisp({ theme: v }), (v) => t(v, v === 'light' ? '밝게' : v === 'dark' ? '어둡게' : v === 'sepia' ? '세피아' : '고대비'))}
          </div>
          <div className="facet">
            <span>{t('Text', '글자')}</span>
            {seg(display.textSize, ['small', 'normal', 'large', 'xl'] as const, (v) => setDisp({ textSize: v }), (v) => (v === 'small' ? 'A−' : v === 'normal' ? 'A' : v === 'large' ? 'A+' : 'A++'))}
          </div>
          <div className="facet">
            <span>{t('Font', '글꼴')}</span>
            {seg(display.font, ['serif', 'sans', 'readable'] as const, (v) => setDisp({ font: v }), (v) => t(v, v === 'serif' ? '세리프' : v === 'sans' ? '산세리프' : '읽기 쉬운'))}
          </div>
          <div className="facet">
            <span>{t('Layout', '배치')}</span>
            {seg(display.layout, ['standard', 'focus', 'wide'] as const, (v) => setDisp({ layout: v }), (v) => t(v, v === 'standard' ? '기본' : v === 'focus' ? '집중' : '넓게'))}
          </div>
          <div className="row" style={{ gap: 12 }}>
            <label className="row small" style={{ gap: 5 }}>
              <input type="checkbox" checked={display.spacing === 'relaxed'} onChange={(e) => setDisp({ spacing: e.target.checked ? 'relaxed' : 'normal' })} /> {t('roomy', '넓은 줄 간격')}
            </label>
            <label className="row small" style={{ gap: 5 }}>
              <input type="checkbox" checked={display.targets === 'large'} onChange={(e) => setDisp({ targets: e.target.checked ? 'large' : 'normal' })} /> {t('big buttons', '큰 버튼')}
            </label>
            <label className="row small" style={{ gap: 5 }}>
              <input type="checkbox" checked={display.spotlight} onChange={(e) => setDisp({ spotlight: e.target.checked })} /> {t('one section at a time', '한 섹션씩')}
            </label>
            <label className="row small" style={{ gap: 5 }}>
              <input type="checkbox" checked={display.reducedMotion} onChange={(e) => setDisp({ reducedMotion: e.target.checked })} /> {t('less motion', '움직임 줄이기')}
            </label>
          </div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(DISPLAY_PRESETS)
              .filter(([k]) => k !== 'default')
              .map(([k, p]) => (
                <button key={k} className="btn xs ghost" onClick={() => setDisp(p.display)}>
                  {p.label}
                </button>
              ))}
            {overridden.length > 0 && (
              <button
                className="btn xs ghost"
                onClick={() => {
                  displayStore.clearOverrides('hand');
                  onChange();
                }}
              >
                {t('back to inferred', '자동 설정으로')}
              </button>
            )}
          </div>
          {lastDisplay && (
            <div className="declared small">
              <span className={`dot ${lastDisplay.source === 'agent' ? 'agent' : ''}`} />
              {lastDisplay.source === 'agent' ? t('Set by your agent', '에이전트가 설정') : lastDisplay.source === 'hand' ? t('Set by you', '직접 설정') : t('Reset', '초기화')} · {new Date(lastDisplay.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {lastDisplay.changes.join('; ')}
            </div>
          )}
        </div>

        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="muted small">{t('Stored in this browser only. No cookies, no fingerprinting.', '이 브라우저에만 저장. 쿠키·핑거프린팅 없음.')}</span>
          <button
            className="btn xs ghost"
            onClick={() => {
              contextStore.reset();
              displayStore.reset();
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
