/** Shared course calendar — Vietnam timezone for all "today" logic. */

export const VN_TZ = 'Asia/Ho_Chi_Minh';

export type ScheduleEntry = { session: number; date: string };
export type SessionStatus = 'past' | 'today' | 'future';

export const TOTAL_SESSIONS = 45;

export const schedule: ScheduleEntry[] = [
  { session: 1, date: '2026-05-19' }, { session: 2, date: '2026-05-21' }, { session: 3, date: '2026-05-23' },
  { session: 4, date: '2026-05-26' }, { session: 5, date: '2026-05-28' }, { session: 6, date: '2026-05-30' },
  { session: 7, date: '2026-06-02' }, { session: 8, date: '2026-06-04' }, { session: 9, date: '2026-06-06' },
  { session: 10, date: '2026-06-09' }, { session: 11, date: '2026-06-11' }, { session: 12, date: '2026-06-13' },
  { session: 13, date: '2026-06-16' }, { session: 14, date: '2026-06-18' }, { session: 15, date: '2026-06-20' },
  { session: 16, date: '2026-06-23' }, { session: 17, date: '2026-06-25' }, { session: 18, date: '2026-06-27' },
  { session: 19, date: '2026-06-30' }, { session: 20, date: '2026-07-02' }, { session: 21, date: '2026-07-04' },
  { session: 22, date: '2026-07-07' }, { session: 23, date: '2026-07-09' }, { session: 24, date: '2026-07-11' },
  { session: 25, date: '2026-07-14' }, { session: 26, date: '2026-07-16' }, { session: 27, date: '2026-07-18' },
  { session: 28, date: '2026-07-21' }, { session: 29, date: '2026-07-23' }, { session: 30, date: '2026-07-25' },
  { session: 31, date: '2026-07-28' }, { session: 32, date: '2026-07-30' }, { session: 33, date: '2026-08-01' },
  { session: 34, date: '2026-08-04' }, { session: 35, date: '2026-08-06' }, { session: 36, date: '2026-08-08' },
  { session: 37, date: '2026-08-11' }, { session: 38, date: '2026-08-13' }, { session: 39, date: '2026-08-15' },
  { session: 40, date: '2026-08-18' }, { session: 41, date: '2026-08-20' }, { session: 42, date: '2026-08-22' },
  { session: 43, date: '2026-08-25' }, { session: 44, date: '2026-08-27' }, { session: 45, date: '2026-08-29' },
];

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** Today's calendar date in Vietnam as YYYY-MM-DD */
export function vnTodayISO(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Hour 0–23 in Vietnam (for greetings) */
export function vnHour(now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: VN_TZ,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now);
  return parseInt(parts.find((p) => p.type === 'hour')?.value || '12', 10);
}

export function formatScheduleDate(isoDate: string): { display: string; day: string } {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return { display: isoDate, day: '?' };
  const date = new Date(y, m - 1, d);
  return {
    display: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
    day: DAY_LABELS[date.getDay()],
  };
}

export function getSessionStatus(date: string, todayVN = vnTodayISO()): SessionStatus {
  if (date < todayVN) return 'past';
  if (date === todayVN) return 'today';
  return 'future';
}

/**
 * Latest session with date <= today (VN).
 * On a non-class day this is still the most recent past/today session — "current path", not always "class today".
 */
export function getCurrentSession(todayVN = vnTodayISO()): number {
  return schedule.filter((s) => s.date <= todayVN).pop()?.session || 1;
}

/** Session entry if today is a class day in VN; otherwise null */
export function getTodaysSession(todayVN = vnTodayISO()): ScheduleEntry | null {
  return schedule.find((s) => s.date === todayVN) || null;
}

export function getScheduleEntry(sessionNum: number): ScheduleEntry | undefined {
  return schedule.find((s) => s.session === sessionNum);
}

export function greetingJa(now = new Date()): string {
  const h = vnHour(now);
  if (h < 5) return 'こんばんは';
  if (h < 11) return 'おはようございます';
  if (h < 18) return 'こんにちは';
  return 'こんばんは';
}
