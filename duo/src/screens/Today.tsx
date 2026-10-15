import { useState } from 'react';
import { Avatar, CheckIcon, ProgressRing } from '../components/ui';
import { formatDay } from '../lib/dates';
import { CHALLENGE_DAYS, money, other, prettyCode, type Balance, type PlayerSummary } from '../lib/logic';
import type { Challenge, PlayerId, Task } from '../lib/types';

interface Props {
  ch: Challenge;
  me: PlayerId;
  summaries: Record<PlayerId, PlayerSummary>;
  bal: Balance;
  onToggle: (date: string | null, taskId: string, done: boolean) => void;
  onSettle: () => void;
  onShare: () => void;
  onEditTasks: () => void;
}

export function Today({ ch, me, summaries, bal, onToggle, onSettle, onShare, onEditTasks }: Props) {
  const order: PlayerId[] = [me, other(me)];
  return (
    <>
      <DebtCard ch={ch} bal={bal} summaries={summaries} onSettle={onSettle} />
      <div className="players">
        {order.map((pid) => (
          <PlayerCard
            key={pid}
            ch={ch}
            pid={pid}
            isMe={pid === me}
            s={summaries[pid]}
            onToggle={onToggle}
            onShare={onShare}
            onEditTasks={onEditTasks}
          />
        ))}
      </div>
    </>
  );
}

function DebtCard({ ch, bal, summaries, onSettle }: { ch: Challenge; bal: Balance; summaries: Record<PlayerId, PlayerSummary>; onSettle: () => void }) {
  const cur = ch.currency;
  const rule = summaries.p1.todayRule;
  const { debtor } = bal;
  return (
    <section className={`card debt ${debtor ?? ''} ${debtor ? '' : 'square'}`} aria-label="Money owed">
      <div className="debt-label">The pot</div>
      <div className="debt-amount">{money(bal.amount, cur)}</div>
      <div className="debt-who">
        {debtor ? (
          <>
            <b>{ch.players[debtor].name}</b> owes {ch.players[other(debtor)].name}
          </>
        ) : (
          <>All square — nobody owes anything 🤝</>
        )}
      </div>

      <div className="debt-breakdown">
        {(['p1', 'p2'] as PlayerId[]).map((pid) => (
          <div key={pid} className={`debt-cell ${pid}`}>
            <div className="name">{ch.players[pid].name}</div>
            <div className="val">{money(bal.penalties[pid], cur)}</div>
            <div className="sub">
              {summaries[pid].missedTasks} missed task{summaries[pid].missedTasks === 1 ? '' : 's'}
              {bal.paid[pid] > 0 && ` · ${money(bal.paid[pid], cur)} paid`}
            </div>
          </div>
        ))}
      </div>

      <div className="debt-actions">
        <span className="chip">
          <strong>{money(rule.penalty, cur)}</strong> per missed task ·{' '}
          {rule.mode === 'traditional' ? 'Traditional' : 'Forgiving'}
        </span>
        <button className="btn sm" onClick={onSettle}>
          Settle up
        </button>
      </div>
    </section>
  );
}

interface CardProps {
  ch: Challenge;
  pid: PlayerId;
  isMe: boolean;
  s: PlayerSummary;
  onToggle: (date: string | null, taskId: string, done: boolean) => void;
  onShare: () => void;
  onEditTasks: () => void;
}

function PlayerCard({ ch, pid, isMe, s, onToggle, onShare, onEditTasks }: CardProps) {
  const player = ch.players[pid];
  const doneCount = s.todayTasks.filter((t) => s.todayDone[t.id]).length;
  const traditional = s.todayRule.mode === 'traditional';
  const progress = ((s.dayNumber - 1 + (s.todayComplete ? 1 : 0)) / CHALLENGE_DAYS) * 100;
  const canTick = isMe && s.started && !s.finishedOn;
  const graceOpen = s.grace && !s.grace.perfect ? s.grace : null;

  const sub = !player.joined
    ? 'Hasn’t joined yet'
    : !s.started
      ? `Starts ${formatDay(ch.startDate)} · in ${s.daysUntilStart} day${s.daysUntilStart === 1 ? '' : 's'}`
      : s.finishedOn
        ? `Finished ${formatDay(s.finishedOn)}`
        : `Day ${s.dayNumber} of ${CHALLENGE_DAYS}${s.resets ? ` · ${s.resets} restart${s.resets === 1 ? '' : 's'}` : ''}`;

  return (
    <section className={`card player ${pid}`} aria-label={`${player.name}'s day`}>
      <div className="player-head">
        <Avatar name={player.name} pid={pid} />
        <div style={{ minWidth: 0 }}>
          <div className="player-name">
            {player.name}
            {isMe && <span className="you-tag">You</span>}
          </div>
          <div className="player-sub">{sub}</div>
        </div>
        <ProgressRing value={doneCount} total={s.todayTasks.length} />
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-val">
            {s.finishedOn ? CHALLENGE_DAYS : s.started ? s.dayNumber : 0}
            <small>/{CHALLENGE_DAYS}</small>
          </div>
          <div className="stat-label">Day</div>
        </div>
        <div className="stat">
          <div className="stat-val">🔥{s.liveStreak}</div>
          <div className="stat-label">Streak</div>
        </div>
        <div className="stat">
          <div className="stat-val">{s.bestStreak}</div>
          <div className="stat-label">Best</div>
        </div>
      </div>
      <div className="daybar">
        <div style={{ width: `${s.finishedOn ? 100 : s.started ? progress : 0}%` }} />
      </div>

      {s.finishedOn ? (
        <div className="trophy">
          <div className="big">🏆</div>
          <strong>75 days complete.</strong>
          <div className="muted small">Absolute machine.</div>
        </div>
      ) : !player.joined && s.todayTasks.length === 0 && !graceOpen ? (
        <div className="empty">
          <p style={{ marginTop: 0 }}>Send {player.name} your challenge code so their phone joins this one.</p>
          <div className="code-display" style={{ marginBottom: 12 }}>
            {prettyCode(ch.code)}
          </div>
          <button className="btn accent" onClick={onShare}>
            Share invite
          </button>
        </div>
      ) : (
        <>
          {graceOpen && (
            <div className="grace">
              <div className="grace-head">
                <span>
                  <strong>Yesterday</strong> · {formatDay(graceOpen.date)}
                </span>
                <span className="risk">
                  {graceOpen.missed.length} left · {money(graceOpen.penalty, ch.currency)}
                  {graceOpen.mode === 'traditional' && ' + restart'}
                </span>
              </div>
              <div className="grace-note">
                {isMe ? 'Forgot to tick something? You’ve got until midnight tonight.' : `${player.name} has until midnight tonight to tick these off.`}
              </div>
              <TaskList
                tasks={graceOpen.tasks}
                done={graceOpen.done}
                canTick={canTick}
                onToggle={(id, d) => onToggle(graceOpen.date, id, d)}
              />
            </div>
          )}

          {s.started && !s.todayInChallenge ? (
            <div className="trophy">
              <div className="big">🏁</div>
              <strong>That was day 75.</strong>
              <div className="muted small">{graceOpen ? 'Finish yesterday’s tasks to complete the challenge.' : 'It locks in at midnight.'}</div>
            </div>
          ) : s.todayTasks.length === 0 ? (
            <div className="empty">
              {isMe ? (
                <>
                  <p style={{ marginTop: 0 }}>You haven’t added any tasks yet.</p>
                  <button className="btn accent" onClick={onEditTasks}>
                    Add your tasks
                  </button>
                </>
              ) : (
                <>No tasks set up yet.</>
              )}
            </div>
          ) : (
            <>
              {graceOpen && <div className="list-label">Today</div>}
              <TaskList tasks={s.todayTasks} done={s.todayDone} canTick={canTick} onToggle={(id, d) => onToggle(null, id, d)} />
            </>
          )}
        </>
      )}

      {s.started && s.todayInChallenge && s.todayTasks.length > 0 && (
        <div className="player-foot">
          {s.todayComplete ? (
            <span className="safe">All done for today ✓</span>
          ) : (
            <span>
              <span className="risk">{money(s.atRisk, ch.currency)} at stake</span>
              {traditional && ' + back to day 1'} if not ticked by midnight tomorrow
            </span>
          )}
        </div>
      )}
    </section>
  );
}

function TaskList({
  tasks,
  done: doneMap,
  canTick,
  onToggle,
}: {
  tasks: Task[];
  done: Record<string, number>;
  canTick: boolean;
  onToggle: (taskId: string, done: boolean) => void;
}) {
  const [popped, setPopped] = useState<string | null>(null);
  return (
    <ul className="tasks">
      {tasks.map((t) => {
        const done = Boolean(doneMap[t.id]);
        const cls = `task${done ? ' is-done' : ''}${canTick ? '' : ' readonly'}${popped === t.id ? ' pop' : ''}`;
        const inner = (
          <>
            <span className="task-emoji" aria-hidden>
              {t.emoji}
            </span>
            <span className="task-title">{t.title}</span>
            <span className="check">
              <CheckIcon />
            </span>
          </>
        );
        return (
          <li key={t.id}>
            {canTick ? (
              <button
                className={cls}
                role="checkbox"
                aria-checked={done}
                onClick={() => {
                  if (!done) {
                    setPopped(t.id);
                    navigator.vibrate?.(12);
                  }
                  onToggle(t.id, !done);
                }}
              >
                {inner}
              </button>
            ) : (
              <div className={cls} role="checkbox" aria-checked={done} aria-readonly>
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
