import { editableTasks, effectiveDate, newCode, newId } from './logic';
import { DELETE, getBackend, type Change } from './store';
import type { Challenge, Mode, PlayerId, Task } from './types';

async function update(code: string, ...changes: Change[]) {
  const b = await getBackend();
  await b.update(code, changes);
}

export async function createChallenge(opts: {
  myName: string;
  partnerName: string;
  startDate: string;
  mode: Mode;
  penalty: number;
}): Promise<Challenge> {
  const b = await getBackend();
  let code = newCode();
  // Astronomically unlikely, but never clobber someone else's challenge.
  while (await b.get(code)) code = newCode();
  const ch: Challenge = {
    code,
    createdAt: Date.now(),
    startDate: opts.startDate,
    currency: '£',
    players: {
      p1: { name: opts.myName.trim(), joined: true },
      p2: { name: opts.partnerName.trim(), joined: false },
    },
    rules: { [opts.startDate]: { mode: opts.mode, penalty: opts.penalty } },
    tasks: { p1: {}, p2: {} },
    done: { p1: {}, p2: {} },
    payments: {},
  };
  await b.create(ch);
  return ch;
}

export async function fetchChallenge(code: string) {
  return (await getBackend()).get(code);
}

export const markJoined = (code: string, pid: PlayerId) => update(code, [['players', pid, 'joined'], true]);

export const renamePlayer = (code: string, pid: PlayerId, name: string) =>
  update(code, [['players', pid, 'name'], name.trim()]);

export function toggleTask(ch: Challenge, pid: PlayerId, today: string, taskId: string, done: boolean) {
  return update(ch.code, [['done', pid, today, taskId], done ? Date.now() : DELETE]);
}

export function addTasks(ch: Challenge, pid: PlayerId, today: string, items: { title: string; emoji: string }[]) {
  const from = effectiveDate(ch, today);
  const existing = Object.values(ch.tasks?.[pid] ?? {});
  let order = existing.reduce((m, t) => Math.max(m, t.order), 0);
  const changes: Change[] = items.map(({ title, emoji }) => {
    const task: Task = { id: newId(), title: title.trim(), emoji, order: ++order, addedOn: from, removedOn: null };
    return [['tasks', pid, task.id], task];
  });
  return update(ch.code, ...changes);
}

export function editTask(ch: Challenge, pid: PlayerId, taskId: string, patch: { title?: string; emoji?: string }) {
  const changes: Change[] = [];
  if (patch.title !== undefined) changes.push([['tasks', pid, taskId, 'title'], patch.title.trim()]);
  if (patch.emoji !== undefined) changes.push([['tasks', pid, taskId, 'emoji'], patch.emoji]);
  return update(ch.code, ...changes);
}

export function removeTask(ch: Challenge, pid: PlayerId, today: string, task: Task) {
  const from = effectiveDate(ch, today);
  // Never counted on a finished day → remove it outright; otherwise keep it for history.
  const neverCounted = task.addedOn >= from;
  return update(ch.code, neverCounted ? [['tasks', pid, task.id], DELETE] : [['tasks', pid, task.id, 'removedOn'], from]);
}

export const restoreTask = (ch: Challenge, pid: PlayerId, taskId: string) =>
  update(ch.code, [['tasks', pid, taskId, 'removedOn'], null]);

export function moveTask(ch: Challenge, pid: PlayerId, today: string, taskId: string, dir: -1 | 1) {
  const list = editableTasks(ch.tasks[pid], today);
  const i = list.findIndex((t) => t.id === taskId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return Promise.resolve();
  const [a, b] = [list[i], list[j]];
  // Swap positions; if the two share an order value, nudge past the neighbour instead.
  const aOrder = a.order === b.order ? b.order + dir : b.order;
  return update(ch.code, [['tasks', pid, a.id, 'order'], aOrder], [['tasks', pid, b.id, 'order'], a.order]);
}

export function setRule(ch: Challenge, today: string, rule: { mode: Mode; penalty: number }) {
  const from = effectiveDate(ch, today);
  if (from <= ch.startDate) {
    // Before the challenge has really begun: just replace the rules outright.
    return update(ch.code, [['rules'], { [ch.startDate]: rule }]);
  }
  return update(ch.code, [['rules', from], rule]);
}

export function recordPayment(ch: Challenge, from: PlayerId, to: PlayerId, amount: number, note?: string) {
  const id = newId();
  return update(ch.code, [['payments', id], { id, from, to, amount, at: Date.now(), note: note?.trim() || '' }]);
}

export const deletePayment = (ch: Challenge, id: string) => update(ch.code, [['payments', id], DELETE]);

/** Guess a fitting emoji from the task name. */
export function suggestEmoji(title: string): string {
  const t = title.toLowerCase();
  const table: [RegExp, string][] = [
    [/water|drink|hydrat|gallon|litre|liter/, '💧'],
    [/read|book|page/, '📖'],
    [/photo|picture|selfie/, '📸'],
    [/outdoor|outside|run|walk|jog|hike/, '🏃'],
    [/workout|gym|train|lift|exercise|weights/, '🏋️'],
    [/diet|eat|meal|food|calor|protein/, '🥗'],
    [/alcohol|drink|beer|booze|sober/, '🚫'],
    [/sleep|bed/, '😴'],
    [/medit|breath|journal|gratitude/, '🧘'],
    [/stretch|yoga|mobility/, '🤸'],
    [/cold|shower|ice/, '🧊'],
    [/phone|screen|social/, '📵'],
    [/sugar|sweet|chocolate/, '🍬'],
    [/step/, '👟'],
  ];
  return table.find(([re]) => re.test(t))?.[1] ?? '✅';
}

export const STANDARD_TASKS = [
  { title: '45-min workout', emoji: '🏋️' },
  { title: '45-min outdoor workout', emoji: '🏃' },
  { title: 'Follow your diet — no cheat meals or alcohol', emoji: '🥗' },
  { title: 'Drink a gallon (3.8L) of water', emoji: '💧' },
  { title: 'Read 10 pages of non-fiction', emoji: '📖' },
  { title: 'Take a progress photo', emoji: '📸' },
];
