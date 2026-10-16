import { useState } from 'react';
import { Avatar, ConfirmButton } from '../components/ui';
import { deletePayment } from '../lib/actions';
import { addDays, formatDay } from '../lib/dates';
import { CHALLENGE_DAYS, money, other, type DayRace, type DayResult, type GapBonus, type PlayerSummary, type RaceTally } from '../lib/logic';
import { bonusLine } from './Today';
import type { Challenge, PlayerId, Task } from '../lib/types';

interface Props {
  ch: Challenge;
  me: PlayerId;
  today: string;
  summaries: Record<PlayerId, PlayerSummary>;
  tally: RaceTally;
  bonus: GapBonus;
}

export function History({ ch, me, today, summaries, tally, bonus }: Props) {
  return (
    <>
      <RaceHistory ch={ch} me={me} today={today} tally={tally} bonus={bonus} />
      {[me, other(me)].map((pid) => (
        <PlayerGrid key={pid} ch={ch} pid={pid} today={today} s={summaries[pid]} />
      ))}
      <Ledger ch={ch} summaries={summaries} />
    </>
  );
}

const clock = (ts: number) => new Date(ts).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });

/** Head-to-head tally of daily race wins, with one dot per day. */
function RaceHistory({ ch, me, today, tally, bonus }: { ch: Challenge; me: PlayerId; today: string; tally: RaceTally; bonus: GapBonus }) {
  const [selected, setSelected] = useState<DayRace | null>(null);
  const sides: PlayerId[] = [me, other(me)];
  const [a, b] = sides.map((pid) => tally.wins[pid]);
  const leader = a === b ? null : a > b ? sides[0] : sides[1];
  const name = (pid: PlayerId) => ch.players[pid].name;
  const describe = (r: DayRace) => {
    const when = r.date === today ? 'Today' : formatDay(r.date);
    if (r.winner === 'tie') return `${when}: dead heat`;
    if (!r.winner) return `${when}: ${r.date === today ? 'nobody has finished yet' : 'nobody finished'}`;
    const loser = other(r.winner);
    const gap = r.finishedAt[loser] ? `, ${name(loser)} at ${clock(r.finishedAt[loser]!)}` : `, ${name(loser)} didn’t finish`;
    return `${when}: ${name(r.winner)} finished first at ${clock(r.finishedAt[r.winner]!)}${gap}`;
  };

  return (
    <section>
      <h2 className="section-title" style={{ marginTop: 4 }}>
        Daily race
      </h2>
      <div className="card stack">
        <div className="race-board">
          {sides.map((pid, i) => (
            <div key={pid} className={`race-board-side ${pid}${i === 1 ? ' right' : ''}`}>
              <span className="race-board-name">
                {leader === pid && '👑 '}
                {name(pid)}
              </span>
              <span className="race-board-wins">{tally.wins[pid]}</span>
            </div>
          ))}
        </div>
        <div className="small muted" style={{ textAlign: 'center', marginTop: -6 }}>
          days won{tally.ties ? ` · ${tally.ties} dead heat${tally.ties === 1 ? '' : 's'}` : ''} · first to finish all their tasks wins the day
        </div>
        {tally.days.length === 0 && (
          <div className="banner small">
            {today < ch.startDate
              ? `The first race is on day 1, ${formatDay(ch.startDate, { weekday: 'long', day: 'numeric', month: 'long' })}. Each day you both have tasks gets a dot here in the winner’s colour.`
              : 'The race starts once you both have tasks set up. Each day gets a dot here in the winner’s colour.'}
          </div>
        )}
        <div className="race-dots">
          {tally.days.map((r) => (
            <button
              key={r.date}
              className={`race-dot ${r.winner === 'tie' ? 'tie' : r.winner ?? 'none'}${selected?.date === r.date ? ' selected' : ''}`}
              onClick={() => setSelected(selected?.date === r.date ? null : r)}
              aria-label={describe(r)}
            />
          ))}
        </div>
        {selected && <div className="banner small">{describe(selected)}</div>}
        {bonus.enabled && <div className="race-bonus">{bonusLine(ch, bonus)}</div>}
      </div>
    </section>
  );
}

interface Attempt {
  start: string;
  end: string;
  length: number;
}

/** Earlier runs that ended in a restart (traditional mode). */
function pastAttempts(s: PlayerSummary): Attempt[] {
  const out: Attempt[] = [];
  for (const d of s.days) {
    if (d.dayNumber === 1) out.push({ start: d.date, end: d.date, length: 0 });
    const cur = out[out.length - 1];
    if (cur) {
      cur.end = d.date;
      cur.length = d.dayNumber;
    }
  }
  // The last group is the current run unless it ended in a restart.
  return out.filter((a) => a.start < s.attemptStart);
}

function PlayerGrid({ ch, pid, today, s }: { ch: Challenge; pid: PlayerId; today: string; s: PlayerSummary }) {
  const [selected, setSelected] = useState<string | null>(null);
  const byDate = new Map(s.days.map((d) => [d.date, d]));
  if (s.grace) byDate.set(s.grace.date, s.grace);
  // Always show the current run as days 1–75, so both grids have the same shape.
  const cells = Array.from({ length: CHALLENGE_DAYS }, (_, i) => addDays(s.attemptStart, i));
  const attempts = pastAttempts(s);
  const perfect = s.days.filter((d) => d.perfect).length + (s.grace?.perfect ? 1 : 0);

  return (
    <section className={pid}>
      <h2 className="section-title">
        {ch.players[pid].name} · {perfect} perfect day{perfect === 1 ? '' : 's'}
      </h2>
      <div className="card stack">
        {attempts.length > 0 && (
          <div className="attempts">
            {attempts.map((a, i) => (
              <button key={a.start} className={`attempt${selected === a.end ? ' selected' : ''}`} onClick={() => setSelected(selected === a.end ? null : a.end)}>
                <span>Run {i + 1}</span>
                <strong>Day {a.length}</strong>
                <span className="muted">ended {formatDay(a.end, { day: 'numeric', month: 'short' })}</span>
              </button>
            ))}
            <div className="attempt current">
              <span>Run {attempts.length + 1}</span>
              <strong>Current</strong>
              <span className="muted">from {formatDay(s.attemptStart, { day: 'numeric', month: 'short' })}</span>
            </div>
          </div>
        )}
        <div className="grid75">
          {cells.map((date, i) => {
            const d = byDate.get(date);
            const isGrace = s.grace?.date === date;
            const cls = d ? (d.perfect ? 'perfect' : isGrace ? 'pending' : 'failed') : date === today ? 'today' : '';
            return (
              <button
                key={date}
                className={`cell ${cls}${selected === date ? ' selected' : ''}`}
                onClick={() => setSelected(selected === date ? null : date)}
                aria-label={`Day ${i + 1}, ${formatDay(date)}${d ? (d.perfect ? ', completed' : `, ${d.missed.length} not done`) : ''}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <div className="legend">
          <span>
            <i style={{ background: 'var(--accent)' }} /> All done
          </span>
          <span>
            <i style={{ background: 'var(--bad-soft)', boxShadow: 'inset 0 0 0 1.5px var(--bad)' }} /> Missed tasks
          </span>
          <span>
            <i style={{ boxShadow: 'inset 0 0 0 1.5px var(--gold)' }} /> Can still be ticked
          </span>
          <span>
            <i style={{ boxShadow: 'inset 0 0 0 2px var(--text)' }} /> Today
          </span>
        </div>
        {selected && (
          <DayDetail
            date={selected}
            day={byDate.get(selected) ?? s.days.find((d) => d.date === selected)}
            notes={ch.notes?.[pid]?.[selected]}
            tasks={ch.tasks?.[pid]}
            ch={ch}
            today={today}
          />
        )}
      </div>
    </section>
  );
}

function DayDetail({
  date,
  day,
  notes,
  tasks,
  ch,
  today,
}: {
  date: string;
  day?: DayResult;
  notes?: Record<string, string>;
  tasks?: Record<string, Task>;
  ch: Challenge;
  today: string;
}) {
  const inGrace = date === addDays(today, -1);
  const noteList = Object.entries(notes ?? {}).filter(([id]) => tasks?.[id]);
  return (
    <div className="banner" style={{ display: 'block' }}>
      <strong>{formatDay(date, { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
      {!day ? (
        <div className="muted small">{date === today ? 'Today, still in progress.' : date > today ? 'Not reached yet.' : 'Not counted.'}</div>
      ) : day.perfect ? (
        <div className="small" style={{ color: 'var(--good)' }}>
          Day {day.dayNumber} · all {day.tasks.length} tasks done ✓
        </div>
      ) : (
        <div className="small">
          <div className="muted">
            Day {day.dayNumber} · {day.tasks.length - day.missed.length}/{day.tasks.length} done ·{' '}
            {inGrace ? (
              <span style={{ color: 'var(--gold)' }}>can still be ticked until midnight</span>
            ) : (
              <>
                <span className="amt minus">−{money(day.penalty, ch.currency)}</span>
                {day.mode === 'traditional' && ' · reset to day 1'}
              </>
            )}
          </div>
          <div style={{ marginTop: 4 }}>
            {inGrace ? 'Still to tick' : 'Missed'}: {day.missed.map((t) => `${t.emoji} ${t.title}`).join(', ')}
          </div>
        </div>
      )}
      {noteList.length > 0 && (
        <ul className="day-notes">
          {noteList.map(([id, text]) => (
            <li key={id}>
              <span aria-hidden>{tasks![id].emoji}</span>
              <span>
                <strong>{tasks![id].title}</strong> “{text}”
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Entry =
  | { kind: 'miss'; at: string; pid: PlayerId; day: DayResult }
  | { kind: 'pay'; at: string; pid: PlayerId; id: string; amount: number; note?: string; to: PlayerId };

function Ledger({ ch, summaries }: { ch: Challenge; summaries: Record<PlayerId, PlayerSummary> }) {
  const entries: Entry[] = [];
  for (const pid of ['p1', 'p2'] as PlayerId[]) {
    for (const day of summaries[pid].days) if (!day.perfect && day.penalty > 0) entries.push({ kind: 'miss', at: day.date + 'T23:59', pid, day });
  }
  for (const p of Object.values(ch.payments ?? {})) {
    entries.push({ kind: 'pay', at: new Date(p.at).toISOString(), pid: p.from, to: p.to, id: p.id, amount: p.amount, note: p.note });
  }
  entries.sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <section>
      <h2 className="section-title">Ledger</h2>
      <div className="card" style={{ paddingTop: 6, paddingBottom: 6 }}>
        {entries.length === 0 ? (
          <div className="empty">No missed tasks or payments yet. Keep it that way.</div>
        ) : (
          <ul className="ledger">
            {entries.map((e) =>
              e.kind === 'miss' ? (
                <li key={`${e.pid}-${e.day.date}`} className={e.pid}>
                  <Avatar name={ch.players[e.pid].name} pid={e.pid} photo={ch.players[e.pid].photo} className="ledger-avatar" />
                  <div className="grow">
                    <div className="title">
                      {ch.players[e.pid].name} missed {e.day.missed.length} task{e.day.missed.length === 1 ? '' : 's'}
                    </div>
                    <div className="detail">
                      {formatDay(e.day.date)} · {e.day.missed.map((t) => t.title).join(', ')}
                    </div>
                  </div>
                  <div className="amt minus">+{money(e.day.penalty, ch.currency)}</div>
                </li>
              ) : (
                <li key={e.id} className={e.pid}>
                  <div className="icon paid">✓</div>
                  <div className="grow">
                    <div className="title">
                      {ch.players[e.pid].name} paid {ch.players[e.to].name}
                    </div>
                    <div className="detail">
                      {new Date(e.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {e.note ? ` · ${e.note}` : ''}
                    </div>
                  </div>
                  <div className="amt plus">−{money(e.amount, ch.currency)}</div>
                  <ConfirmButton className="icon-btn" label="✕" ariaLabel="Delete payment" confirmLabel="Delete?" onConfirm={() => deletePayment(ch, e.id)} />
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
