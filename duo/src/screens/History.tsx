import { useState } from 'react';
import { deletePayment } from '../lib/actions';
import { addDays, diffDays, formatDay } from '../lib/dates';
import { CHALLENGE_DAYS, money, other, type DayResult, type PlayerSummary } from '../lib/logic';
import type { Challenge, PlayerId } from '../lib/types';

interface Props {
  ch: Challenge;
  me: PlayerId;
  today: string;
  summaries: Record<PlayerId, PlayerSummary>;
}

export function History({ ch, me, today, summaries }: Props) {
  return (
    <>
      {[me, other(me)].map((pid) => (
        <PlayerGrid key={pid} ch={ch} pid={pid} today={today} s={summaries[pid]} />
      ))}
      <Ledger ch={ch} summaries={summaries} />
    </>
  );
}

function PlayerGrid({ ch, pid, today, s }: { ch: Challenge; pid: PlayerId; today: string; s: PlayerSummary }) {
  const [selected, setSelected] = useState<string | null>(null);
  const byDate = new Map(s.days.map((d) => [d.date, d]));
  const elapsed = diffDays(today, ch.startDate) + 1;
  // Calendar days from the start until this player is due to finish (longer after restarts).
  const projected = s.finishedOn ? s.days.length : Math.max(0, elapsed) + CHALLENGE_DAYS - s.dayNumber;
  const total = Math.max(CHALLENGE_DAYS, projected);
  const cells = Array.from({ length: total }, (_, i) => addDays(ch.startDate, i));
  const sel = selected ? byDate.get(selected) : undefined;
  const perfect = s.days.filter((d) => d.perfect).length;

  return (
    <section className={pid}>
      <h2 className="section-title">
        {ch.players[pid].name} · {perfect} perfect day{perfect === 1 ? '' : 's'}
      </h2>
      <div className="card">
        <div className="grid75">
          {cells.map((date, i) => {
            const d = byDate.get(date);
            const cls = d ? (d.perfect ? 'perfect' : 'failed') : date === today ? 'today' : '';
            return (
              <button
                key={date}
                className={`cell ${cls}${selected === date ? ' selected' : ''}`}
                onClick={() => setSelected(selected === date ? null : date)}
                aria-label={`${formatDay(date)}${d ? (d.perfect ? ', completed' : `, missed ${d.missed.length}`) : ''}`}
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
            <i style={{ boxShadow: 'inset 0 0 0 2px var(--text)' }} /> Today
          </span>
        </div>
        {selected && <DayDetail date={selected} day={sel} ch={ch} today={today} />}
      </div>
    </section>
  );
}

function DayDetail({ date, day, ch, today }: { date: string; day?: DayResult; ch: Challenge; today: string }) {
  return (
    <div className="banner" style={{ marginTop: 14, display: 'block' }}>
      <strong>{formatDay(date, { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
      {!day ? (
        <div className="muted small">{date === today ? 'Today — still in progress.' : date > today ? 'Not reached yet.' : 'Not counted.'}</div>
      ) : day.perfect ? (
        <div className="small" style={{ color: 'var(--good)' }}>
          Day {day.dayNumber} · all {day.tasks.length} tasks done ✓
        </div>
      ) : (
        <div className="small">
          <div className="muted">
            Day {day.dayNumber} · {day.tasks.length - day.missed.length}/{day.tasks.length} done ·{' '}
            <span className="amt minus">−{money(day.penalty, ch.currency)}</span>
            {day.mode === 'traditional' && ' · reset to day 1'}
          </div>
          <div style={{ marginTop: 4 }}>Missed: {day.missed.map((t) => `${t.emoji} ${t.title}`).join(', ')}</div>
        </div>
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
                  <div className="icon">{ch.players[e.pid].name.charAt(0).toUpperCase()}</div>
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
                  <button
                    className="icon-btn"
                    aria-label="Delete payment"
                    onClick={() => confirm('Delete this payment?') && deletePayment(ch, e.id)}
                  >
                    ✕
                  </button>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
