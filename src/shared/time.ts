// Timezone helpers that work in browsers and in Cloudflare Workers (Intl only, no Temporal).

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function dtf(tz: string): Intl.DateTimeFormat {
  let f = dtfCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });
    dtfCache.set(tz, f);
  }
  return f;
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export interface WallClock {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: string; // Mon..Sun
}

export function wallClock(ts: number, tz: string): WallClock {
  const parts: Record<string, string> = {};
  for (const p of dtf(tz).formatToParts(new Date(ts))) parts[p.type] = p.value;
  return {
    year: +parts.year,
    month: +parts.month,
    day: +parts.day,
    hour: +parts.hour === 24 ? 0 : +parts.hour,
    minute: +parts.minute,
    second: +parts.second,
    weekday: parts.weekday,
  };
}

/** Offset (ms) of tz at instant ts: wall-clock-as-UTC minus ts. */
export function tzOffsetMs(ts: number, tz: string): number {
  const w = wallClock(ts, tz);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - Math.floor(ts / 1000) * 1000;
}

/** Convert a wall-clock date/time in tz to an epoch ms instant. */
export function zonedToUtc(date: string, time: string, tz: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm, 0);
  const off1 = tzOffsetMs(guess, tz);
  let ts = guess - off1;
  const off2 = tzOffsetMs(ts, tz);
  if (off2 !== off1) ts = guess - off2;
  return ts;
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function dateKey(ts: number, tz: string): string {
  const w = wallClock(ts, tz);
  return `${w.year}-${pad2(w.month)}-${pad2(w.day)}`;
}

export function timeKey(ts: number, tz: string): string {
  const w = wallClock(ts, tz);
  return `${pad2(w.hour)}:${pad2(w.minute)}`;
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + n * 86400000;
  const x = new Date(t);
  return `${x.getUTCFullYear()}-${pad2(x.getUTCMonth() + 1)}-${pad2(x.getUTCDate())}`;
}

export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

export function isDateString(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

export function isTimeString(s: unknown): s is string {
  return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

/** Next Monday (or today if Monday) as YYYY-MM-DD in tz. */
export function nextMonday(tz: string, now = Date.now()): string {
  let d = dateKey(now, tz);
  for (let i = 0; i < 8; i++) {
    const w = wallClock(zonedToUtc(d, '12:00', tz), tz);
    if (w.weekday === 'Mon' && i > 0) return d;
    d = addDays(d, 1);
  }
  return d;
}

export function fmtRange(start: number, end: number, tz: string): string {
  const s = wallClock(start, tz);
  const e = wallClock(end, tz);
  const md = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(start));
  return `${md} ${pad2(s.hour)}:${pad2(s.minute)}–${pad2(e.hour)}:${pad2(e.minute)}`;
}

export function fmtInstant(ts: number, tz: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ts));
}

export function tzShort(tz: string, ts = Date.now()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date(ts));
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? tz;
  } catch {
    return tz;
  }
}
