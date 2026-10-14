import { describe, expect, it } from 'vitest';
import { addDays, diffDays } from './dates';
import { activeTasks, balance, effectiveDate, ruleFor, summarize } from './logic';
import type { Challenge, Mode, Task } from './types';

const START = '2026-01-01';

function task(id: string, addedOn = START, removedOn?: string): Task {
  return { id, title: id, emoji: '', order: 0, addedOn, removedOn };
}

function makeChallenge(mode: Mode, penalty = 10): Challenge {
  return {
    code: 'TESTCODE',
    createdAt: 0,
    startDate: START,
    currency: '£',
    players: { p1: { name: 'A', joined: true }, p2: { name: 'B', joined: true } },
    rules: { [START]: { mode, penalty } },
    tasks: { p1: { a: task('a'), b: task('b') }, p2: { a: task('a') } },
    done: { p1: {}, p2: {} },
    payments: {},
  };
}

function tickAll(ch: Challenge, from: string, days: number, ids = ['a', 'b']) {
  for (let i = 0; i < days; i++) {
    const d = addDays(from, i);
    ch.done.p1[d] = Object.fromEntries(ids.map((id) => [id, 1]));
  }
}

describe('dates', () => {
  it('handles month and DST boundaries', () => {
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(diffDays('2026-11-01', '2026-10-25')).toBe(7);
  });
});

describe('summarize', () => {
  it('counts a streak and days in traditional mode', () => {
    const ch = makeChallenge('traditional');
    tickAll(ch, START, 5);
    const s = summarize(ch, 'p1', addDays(START, 5));
    expect(s.streak).toBe(5);
    expect(s.dayNumber).toBe(6);
    expect(s.debt).toBe(0);
  });

  it('resets to day 1 and charges per missed task in traditional mode', () => {
    const ch = makeChallenge('traditional');
    tickAll(ch, START, 3);
    ch.done.p1[addDays(START, 3)] = { a: 1 }; // missed b on day 4
    tickAll(ch, addDays(START, 4), 2);
    const s = summarize(ch, 'p1', addDays(START, 6));
    expect(s.resets).toBe(1);
    expect(s.debt).toBe(10);
    expect(s.dayNumber).toBe(3);
    expect(s.streak).toBe(2);
    expect(s.bestStreak).toBe(3);
  });

  it('keeps the day count in forgiving mode but still charges', () => {
    const ch = makeChallenge('forgiving', 5);
    tickAll(ch, START, 3);
    // day 4 untouched: both tasks missed
    const s = summarize(ch, 'p1', addDays(START, 4));
    expect(s.resets).toBe(0);
    expect(s.dayNumber).toBe(5);
    expect(s.debt).toBe(10);
    expect(s.missedTasks).toBe(2);
  });

  it('finishes after 75 days in forgiving mode even with failures', () => {
    const ch = makeChallenge('forgiving');
    const s = summarize(ch, 'p1', addDays(START, 100));
    expect(s.finishedOn).toBe(addDays(START, 74));
    expect(s.debt).toBe(75 * 2 * 10);
  });

  it('applies rule changes only from their effective date', () => {
    const ch = makeChallenge('traditional', 10);
    ch.rules[addDays(START, 2)] = { mode: 'forgiving', penalty: 20 };
    // miss everything for 4 days
    const s = summarize(ch, 'p1', addDays(START, 4));
    expect(s.resets).toBe(2);
    expect(s.debt).toBe(2 * 2 * 10 + 2 * 2 * 20);
    expect(ruleFor(ch.rules, START).penalty).toBe(10);
  });

  it('reports what is at risk today', () => {
    const ch = makeChallenge('traditional');
    ch.done.p1[START] = { a: 1 };
    const s = summarize(ch, 'p1', START);
    expect(s.atRisk).toBe(10);
    expect(s.todayComplete).toBe(false);
  });

  it('nothing is owed before the start date', () => {
    const ch = makeChallenge('traditional');
    const s = summarize(ch, 'p1', addDays(START, -3));
    expect(s.started).toBe(false);
    expect(s.daysUntilStart).toBe(3);
    expect(s.debt).toBe(0);
    expect(s.atRisk).toBe(0);
  });
});

describe('task scheduling', () => {
  it('respects addedOn / removedOn', () => {
    const tasks = { a: task('a'), b: task('b', '2026-01-05'), c: task('c', START, '2026-01-03') };
    expect(activeTasks(tasks, '2026-01-02').map((t) => t.id)).toEqual(['a', 'c']);
    expect(activeTasks(tasks, '2026-01-05').map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('locks edits to tomorrow after day 1', () => {
    const ch = { startDate: START };
    expect(effectiveDate(ch, START)).toBe(START);
    expect(effectiveDate(ch, '2026-01-04')).toBe('2026-01-05');
  });
});

describe('balance', () => {
  it('nets penalties and payments', () => {
    const b = balance({ p1: 30, p2: 50 }, { x: { id: 'x', from: 'p2', to: 'p1', amount: 10, at: 0 } });
    expect(b.debtor).toBe('p2');
    expect(b.amount).toBe(10);
    expect(balance({ p1: 20, p2: 20 }, {}).debtor).toBeNull();
  });
});
