export type PlayerId = 'p1' | 'p2';
export const PLAYER_IDS: PlayerId[] = ['p1', 'p2'];

/** Traditional: miss a task and you restart at day 1. Forgiving: you pay but keep your day count. */
export type Mode = 'traditional' | 'forgiving';

export interface Task {
  id: string;
  title: string;
  emoji: string;
  order: number;
  /** First day (YYYY-MM-DD) the task counts. */
  addedOn: string;
  /** First day the task no longer counts. */
  removedOn?: string | null;
}

export interface Rule {
  mode: Mode;
  /** Amount owed per missed task. */
  penalty: number;
}

export interface Payment {
  id: string;
  from: PlayerId;
  to: PlayerId;
  amount: number;
  at: number;
  note?: string;
}

export interface Nudge {
  id: string;
  from: PlayerId;
  to: PlayerId;
  text: string;
  at: number;
}

export interface Player {
  name: string;
  joined: boolean;
  /** Small square JPEG as a data URL (about 10KB), shown in place of the initial. */
  photo?: string | null;
}

/**
 * Everything lives in one document so both phones subscribe to a single source of truth.
 * Maps (not arrays) are used throughout so each field can be updated independently
 * without the two players overwriting each other.
 */
export interface Challenge {
  code: string;
  createdAt: number;
  startDate: string;
  currency: string;
  players: Record<PlayerId, Player>;
  /** Keyed by the date the rule takes effect from. */
  rules: Record<string, Rule>;
  tasks: Record<PlayerId, Record<string, Task>>;
  /** done[player][date][taskId] = timestamp it was ticked. */
  done: Record<PlayerId, Record<string, Record<string, number>>>;
  payments: Record<string, Payment>;
  /** notes[player][date][taskId] = what you wrote when ticking it off. */
  notes?: Record<PlayerId, Record<string, Record<string, string>>>;
  /** Recent nudges between the two players (pruned after a few days). */
  nudges?: Record<string, Nudge>;
}
