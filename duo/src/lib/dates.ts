const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as YYYY-MM-DD. */
export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toUTC(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUTC(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDays(key: string, n: number): string {
  return fromUTC(toUTC(key) + n * 86_400_000);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffDays(to: string, from: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000);
}

export function formatDay(key: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }): string {
  return new Date(toUTC(key)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
}

/** Milliseconds until local midnight. */
export function msUntilMidnight(now: Date = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}
