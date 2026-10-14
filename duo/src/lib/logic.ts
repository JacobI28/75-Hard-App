import { addDays, diffDays } from './dates';
import type { Challenge, Mode, Payment, PlayerId, Rule, Task } from './types';

export const CHALLENGE_DAYS = 75;

export const other = (p: PlayerId): PlayerId => (p === 'p1' ? 'p2' : 'p1');

export function ruleFor(rules: Record<string, Rule>, date: string): Rule {
  const keys = Object.keys(rules).sort();
  let rule = rules[keys[0]] ?? { mode: 'traditional' as Mode, penalty: 10 };
  for (const k of keys) if (k <= date) rule = rules[k];
  return rule;
}

/** Tasks that count on a given day, in display order. */
export function activeTasks(tasks: Record<string, Task> | undefined, date: string): Task[] {
  return Object.values(tasks ?? {})
    .filter((t) => t.addedOn <= date && (!t.removedOn || t.removedOn > date))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

/** Tasks shown in the editor: everything counting today or scheduled to start later. */
export function editableTasks(tasks: Record<string, Task> | undefined, today: string): Task[] {
  return Object.values(tasks ?? {})
    .filter((t) => !t.removedOn || t.removedOn > today)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

/**
 * Edits to task lists and rules apply immediately up to and including day 1,
 * then only from tomorrow — so nobody can dodge today's task by deleting it.
 */
export function effectiveDate(ch: Pick<Challenge, 'startDate'>, today: string): string {
  return today <= ch.startDate ? today : addDays(today, 1);
}

export function isLocked(ch: Pick<Challenge, 'startDate'>, today: string): boolean {
  return today > ch.startDate;
}

export interface DayResult {
  date: string;
  /** Day number within the current attempt (resets in traditional mode). */
  dayNumber: number;
  tasks: Task[];
  missed: Task[];
  penalty: number;
  mode: Mode;
  perfect: boolean;
}

export interface PlayerSummary {
  started: boolean;
  daysUntilStart: number;
  attemptStart: string;
  /** Today's day number in the current attempt (1–75). */
  dayNumber: number;
  /** Consecutive perfect finished days. */
  streak: number;
  bestStreak: number;
  resets: number;
  missedTasks: number;
  /** Total penalties accrued (before payments). */
  debt: number;
  finishedOn: string | null;
  days: DayResult[];
  todayTasks: Task[];
  todayDone: Record<string, number>;
  todayComplete: boolean;
  /** What today would cost if nothing else gets ticked. */
  atRisk: number;
  todayRule: Rule;
}

export function summarize(ch: Challenge, pid: PlayerId, today: string): PlayerSummary {
  const start = ch.startDate;
  const yesterday = addDays(today, -1);
  let attemptStart = start;
  let streak = 0;
  let bestStreak = 0;
  let resets = 0;
  let debt = 0;
  let missedTasks = 0;
  let finishedOn: string | null = null;
  const days: DayResult[] = [];

  for (let d = start; d <= yesterday && !finishedOn; d = addDays(d, 1)) {
    const tasks = activeTasks(ch.tasks?.[pid], d);
    const doneMap = ch.done?.[pid]?.[d] ?? {};
    const missed = tasks.filter((t) => !doneMap[t.id]);
    const rule = ruleFor(ch.rules, d);
    const penalty = missed.length * rule.penalty;
    days.push({
      date: d,
      dayNumber: diffDays(d, attemptStart) + 1,
      tasks,
      missed,
      penalty,
      mode: rule.mode,
      perfect: missed.length === 0,
    });

    if (missed.length) {
      debt += penalty;
      missedTasks += missed.length;
      streak = 0;
      if (rule.mode === 'traditional') {
        attemptStart = addDays(d, 1);
        resets++;
      }
    } else {
      streak++;
      bestStreak = Math.max(bestStreak, streak);
    }
    if (diffDays(d, attemptStart) + 1 >= CHALLENGE_DAYS) finishedOn = d;
  }

  const todayTasks = activeTasks(ch.tasks?.[pid], today);
  const todayDone = ch.done?.[pid]?.[today] ?? {};
  const remaining = todayTasks.filter((t) => !todayDone[t.id]).length;
  const todayRule = ruleFor(ch.rules, today);

  return {
    started: today >= start,
    daysUntilStart: Math.max(0, diffDays(start, today)),
    attemptStart,
    dayNumber: Math.min(CHALLENGE_DAYS, Math.max(1, diffDays(today, attemptStart) + 1)),
    streak,
    bestStreak,
    resets,
    missedTasks,
    debt,
    finishedOn,
    days,
    todayTasks,
    todayDone,
    todayComplete: todayTasks.length > 0 && remaining === 0,
    atRisk: finishedOn || today < start ? 0 : remaining * todayRule.penalty,
    todayRule,
  };
}

export interface Balance {
  /** Who owes money right now, or null when square. */
  debtor: PlayerId | null;
  amount: number;
  penalties: Record<PlayerId, number>;
  paid: Record<PlayerId, number>;
}

/** Nets both players' penalties against each other and against payments made. */
export function balance(penalties: Record<PlayerId, number>, payments: Record<string, Payment> | undefined): Balance {
  const paid: Record<PlayerId, number> = { p1: 0, p2: 0 };
  for (const p of Object.values(payments ?? {})) paid[p.from] += p.amount;
  // Positive = p1 owes p2.
  const net = penalties.p1 - paid.p1 - (penalties.p2 - paid.p2);
  const amount = Math.round(Math.abs(net) * 100) / 100;
  return { debtor: amount === 0 ? null : net > 0 ? 'p1' : 'p2', amount, penalties, paid };
}

export function money(amount: number, currency = '£'): string {
  const n = Math.round(amount * 100) / 100;
  return `${currency}${Number.isInteger(n) ? n : n.toFixed(2)}`;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export const prettyCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`;

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
