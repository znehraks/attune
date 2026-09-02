import { useMemo } from 'react';
import type { Lang } from '../../shared/content';

export type Params = Record<string, number | string | boolean>;

// ---------- tool-surface ----------
const SURFACES: Record<string, { name: string; note: string }[]> = {
  guest: [
    { name: 'get_rendezvous', note: 'read state' },
    { name: 'join_rendezvous', note: 'join on behalf of a person' },
    { name: 'read_notes', note: 'untrusted content' },
  ],
  participant: [
    { name: 'get_rendezvous', note: 'read state' },
    { name: 'get_candidate_slots', note: 'read' },
    { name: 'set_my_availability', note: 'write' },
    { name: 'mark_me_busy', note: 'write' },
    { name: 'propose_time', note: 'write' },
    { name: 'respond_to_proposal', note: 'write' },
    { name: 'post_note', note: 'write' },
    { name: 'read_notes', note: 'untrusted content' },
    { name: 'get_invite_link', note: 'read' },
  ],
  organizer: [
    { name: '…everything a participant has', note: '' },
    { name: 'finalize_time', note: 'human confirms on the page' },
    { name: 'update_settings', note: 'write' },
  ],
  agreed: [
    { name: 'get_rendezvous', note: 'read state' },
    { name: 'get_calendar_links', note: 'read' },
    { name: 'read_notes', note: 'untrusted content' },
    { name: 'post_note', note: 'write' },
    { name: 'reopen_rendezvous', note: 'organizer, human confirms' },
  ],
};

export function computeToolSurface(p: Params) {
  const state = String(p.state ?? 'guest');
  const tools = SURFACES[state] ?? SURFACES.guest;
  return { state, tools: tools.map((t) => t.name), count: tools.length, states: Object.keys(SURFACES) };
}

function ToolSurface({ params, lang }: { params: Params; lang: Lang }) {
  const r = computeToolSurface(params);
  const tools = SURFACES[r.state] ?? SURFACES.guest;
  return (
    <div className="ia">
      <div className="ia-h">
        <span className="ia-t">{lang === 'ko' ? '페이지 상태에 따른 툴 표면' : 'Tool surface by page state'}</span>
        <span className="pill">{r.state}</span>
      </div>
      <div className="ia-states">
        {r.states.map((s) => (
          <span key={s} className={`seg-item${s === r.state ? ' on' : ''}`}>
            {s}
          </span>
        ))}
      </div>
      <ul className="ia-tools">
        {tools.map((t) => (
          <li key={t.name}>
            <code>{t.name}</code> {t.note && <span className="muted small">— {t.note}</span>}
          </li>
        ))}
      </ul>
      <div className="muted small">{lang === 'ko' ? '실제 WebMCP 앱(Rendezvous)의 툴 표면입니다. 같은 페이지가 상태마다 다른 툴을 등록합니다.' : 'A real WebMCP app’s (Rendezvous) surfaces: the same page registers different tools in each state.'}</div>
    </div>
  );
}

// ---------- compound-calculator ----------
export function computeCompound(p: Params) {
  const principal = Number(p.principal ?? 10000);
  const monthly = Number(p.monthly ?? 200);
  const rate = Number(p.rate ?? 7) / 100;
  const fee = Number(p.fee ?? 0) / 100;
  const years = Math.max(1, Math.min(60, Math.round(Number(p.years ?? 30))));
  const series: { year: number; value: number; contributed: number; noFee: number }[] = [];
  let v = principal;
  let vNoFee = principal;
  const r = (rate - fee) / 12;
  const r0 = rate / 12;
  for (let m = 1; m <= years * 12; m++) {
    v = v * (1 + r) + monthly;
    vNoFee = vNoFee * (1 + r0) + monthly;
    if (m % 12 === 0) series.push({ year: m / 12, value: v, contributed: principal + monthly * m, noFee: vNoFee });
  }
  const final = series[series.length - 1];
  return {
    final_value: Math.round(final.value),
    total_contributed: Math.round(final.contributed),
    growth: Math.round(final.value - final.contributed),
    final_without_fee: Math.round(final.noFee),
    fee_cost: Math.round(final.noFee - final.value),
    years,
    series,
  };
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function CompoundCalculator({ params, lang, onChange }: { params: Params; lang: Lang; onChange: (p: Params) => void }) {
  const r = useMemo(() => computeCompound(params), [params]);
  const W = 640;
  const H = 260;
  const pad = { l: 56, r: 12, t: 12, b: 28 };
  const max = Math.max(...r.series.map((s) => Math.max(s.value, s.noFee)), 1);
  const x = (year: number) => pad.l + ((W - pad.l - pad.r) * year) / r.years;
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const path = (key: 'value' | 'contributed' | 'noFee') => r.series.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(s.year).toFixed(1)},${y(s[key]).toFixed(1)}`).join(' ');
  const t = (en: string, ko: string) => (lang === 'ko' ? ko : en);
  const field = (key: string, label: string, min: number, max: number, step: number) => (
    <label className="ia-field">
      <span>{label}</span>
      <input type="number" min={min} max={max} step={step} value={Number(params[key] ?? 0)} onChange={(e) => onChange({ ...params, [key]: Number(e.target.value) })} />
    </label>
  );
  return (
    <div className="ia">
      <div className="ia-h">
        <span className="ia-t">{t('Compound growth calculator', '복리 성장 계산기')}</span>
        <span className="pill">{t('illustrative', '예시')}</span>
      </div>
      <div className="ia-fields">
        {field('principal', t('Starting amount', '초기 금액'), 0, 10000000, 100)}
        {field('monthly', t('Monthly contribution', '매월 적립'), 0, 100000, 10)}
        {field('rate', t('Annual return %', '연 수익률 %'), 0, 30, 0.5)}
        {field('years', t('Years', '기간(년)'), 1, 60, 1)}
        {field('fee', t('Annual fee %', '연 수수료 %'), 0, 5, 0.1)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="ia-chart" role="img" aria-label="growth chart">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} stroke="#e6e1d6" />
            <text x={pad.l - 6} y={y(max * f) + 4} textAnchor="end" fontSize="10" fill="#7a7a82">
              {fmt(max * f)}
            </text>
          </g>
        ))}
        {[0, Math.round(r.years / 2), r.years].map((yr) => (
          <text key={yr} x={x(yr)} y={H - 8} textAnchor="middle" fontSize="10" fill="#7a7a82">
            {t('year', '')} {yr}
            {lang === 'ko' ? '년' : ''}
          </text>
        ))}
        <path d={path('contributed')} fill="none" stroke="#7a7a82" strokeDasharray="4 4" strokeWidth="1.5" />
        {Number(params.fee) > 0 && <path d={path('noFee')} fill="none" stroke="#1fa66a" strokeWidth="1.5" strokeDasharray="2 3" />}
        <path d={path('value')} fill="none" stroke="#e8462b" strokeWidth="2.5" />
      </svg>
      <div className="ia-stats">
        <div>
          <b>{fmt(r.final_value)}</b>
          <span>{t('final value', '최종 금액')}</span>
        </div>
        <div>
          <b>{fmt(r.total_contributed)}</b>
          <span>{t('you put in', '납입 합계')}</span>
        </div>
        <div>
          <b>{fmt(r.growth)}</b>
          <span>{t('growth', '증가분')}</span>
        </div>
        {Number(params.fee) > 0 && (
          <div>
            <b>{fmt(r.fee_cost)}</b>
            <span>{t('lost to fees', '수수료로 잃은 금액')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- trilateration ----------
const C = 0.299792458; // metres per nanosecond

export function computeTrilateration(p: Params) {
  const clockErrorNs = Math.max(0, Math.min(5000, Number(p.clockErrorNs ?? 100)));
  const satellites = Number(p.satellites ?? 4) >= 4 ? 4 : 3;
  const multipath = Boolean(p.multipath);
  const clockErrorM = clockErrorNs * C;
  // With 4 satellites the receiver solves for its clock bias as a 4th unknown; with 3 it cannot.
  const baseError = satellites >= 4 ? 1.5 : clockErrorM;
  const multipathError = multipath ? 25 : 0;
  const positionErrorM = Math.round((baseError + multipathError) * 10) / 10;
  return { clock_error_ns: clockErrorNs, clock_error_m: Math.round(clockErrorM * 10) / 10, satellites, multipath, solves_clock_bias: satellites >= 4, position_error_m: positionErrorM };
}

function Trilateration({ params, lang, onChange }: { params: Params; lang: Lang; onChange: (p: Params) => void }) {
  const r = useMemo(() => computeTrilateration(params), [params]);
  const t = (en: string, ko: string) => (lang === 'ko' ? ko : en);
  const W = 640;
  const H = 300;
  const you = { x: 330, y: 170 };
  const sats = [
    { x: 110, y: 60 },
    { x: 560, y: 80 },
    { x: 430, y: 280 },
    { x: 150, y: 250 },
  ].slice(0, r.satellites);
  const scale = 0.12; // px per metre of error, for the drawing only
  const bias = r.solves_clock_bias ? 0 : r.clock_error_m * scale;
  const dist = (s: { x: number; y: number }) => Math.hypot(s.x - you.x, s.y - you.y);
  return (
    <div className="ia">
      <div className="ia-h">
        <span className="ia-t">{t('Trilateration with a wrong clock', '틀린 시계로 하는 삼변측량')}</span>
        <span className="pill">{r.position_error_m} m</span>
      </div>
      <div className="ia-fields">
        <label className="ia-field">
          <span>{t('Clock error (ns)', '시계 오차 (ns)')}</span>
          <input type="range" min={0} max={5000} step={10} value={r.clock_error_ns} onChange={(e) => onChange({ ...params, clockErrorNs: Number(e.target.value) })} />
          <b>{r.clock_error_ns} ns = {r.clock_error_m} m</b>
        </label>
        <label className="ia-field">
          <span>{t('Satellites', '위성 수')}</span>
          <select value={r.satellites} onChange={(e) => onChange({ ...params, satellites: Number(e.target.value) })}>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </label>
        <label className="ia-field">
          <span>{t('Multipath (city)', '다중경로(도심)')}</span>
          <input type="checkbox" checked={r.multipath} onChange={(e) => onChange({ ...params, multipath: e.target.checked })} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="ia-chart" role="img" aria-label="trilateration">
        {sats.map((s, i) => (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r={dist(s) + bias + (r.multipath && i === 1 ? 18 : 0)} fill="none" stroke={i === 1 && r.multipath ? '#c9a227' : '#1fa66a'} strokeWidth="1.5" opacity="0.8" />
            <rect x={s.x - 7} y={s.y - 7} width="14" height="14" fill="#1b1b1f" transform={`rotate(45 ${s.x} ${s.y})`} />
            <text x={s.x + 12} y={s.y - 10} fontSize="11" fill="#1b1b1f">
              sat {i + 1}
            </text>
          </g>
        ))}
        <circle cx={you.x} cy={you.y} r={4} fill="#e8462b" />
        <circle cx={you.x} cy={you.y} r={Math.max(6, r.position_error_m * scale)} fill="rgba(232,70,43,0.15)" stroke="#e8462b" strokeDasharray="3 3" />
        <text x={you.x + 10} y={you.y + 4} fontSize="11" fill="#e8462b">
          {t('you', '나')} ±{r.position_error_m} m
        </text>
      </svg>
      <div className="muted small">
        {r.solves_clock_bias
          ? t('Four satellites: the receiver solves for its own clock error as a fourth unknown, so the circles snap back together.', '위성 4개: 수신기가 자기 시계 오차를 네 번째 미지수로 풀어내므로 원들이 다시 한 점에서 만납니다.')
          : t('Three satellites: every circle is too big by the same amount, and the fix drifts by the clock error.', '위성 3개: 모든 원이 같은 만큼 커져서 위치가 시계 오차만큼 어긋납니다.')}
      </div>
    </div>
  );
}

export function computeInteractive(id: string, params: Params): Record<string, unknown> {
  if (id === 'tool-surface') return computeToolSurface(params);
  if (id === 'compound-calculator') {
    const r = computeCompound(params);
    return { final_value: r.final_value, total_contributed: r.total_contributed, growth: r.growth, final_without_fee: r.final_without_fee, fee_cost: r.fee_cost, years: r.years };
  }
  if (id === 'trilateration') return computeTrilateration(params);
  return {};
}

export function Interactive({ id, params, lang, onChange }: { id: string; params: Params; lang: Lang; onChange: (p: Params) => void }) {
  if (id === 'tool-surface') return <ToolSurface params={params} lang={lang} />;
  if (id === 'compound-calculator') return <CompoundCalculator params={params} lang={lang} onChange={onChange} />;
  if (id === 'trilateration') return <Trilateration params={params} lang={lang} onChange={onChange} />;
  return <div className="muted">Unknown interactive {id}</div>;
}
