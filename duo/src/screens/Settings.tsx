import { useEffect, useState } from 'react';
import { Sheet, EMOJIS } from '../components/ui';
import {
  addTasks,
  editTask,
  moveTask,
  removeTask,
  renamePlayer,
  restoreTask,
  setRule,
  STANDARD_TASKS,
  suggestEmoji,
} from '../lib/actions';
import { addDays, formatDay } from '../lib/dates';
import { editableTasks, effectiveDate, isLocked, money, other, prettyCode, ruleFor } from '../lib/logic';
import { isSyncConfigured } from '../lib/store';
import type { Challenge, Mode, PlayerId, Task } from '../lib/types';

interface Props {
  ch: Challenge;
  me: PlayerId;
  today: string;
  onShare: () => void;
  onSwitch: (pid: PlayerId) => void;
  onLeave: () => void;
}

export function Settings({ ch, me, today, onShare, onSwitch, onLeave }: Props) {
  return (
    <>
      <TaskEditor ch={ch} me={me} today={today} />
      <RulesEditor ch={ch} today={today} />
      <PlayersEditor ch={ch} />
      <section>
        <h2 className="section-title">Invite</h2>
        <div className="card stack">
          <div className="muted small">Your partner opens the app, taps “Join a challenge” and enters this code — or just send the link.</div>
          <div className="code-display">{prettyCode(ch.code)}</div>
          <button className="btn primary block" onClick={onShare}>
            Share invite link
          </button>
        </div>
      </section>
      <section>
        <h2 className="section-title">This device</h2>
        <div className="card stack">
          <div className="row">
            <span className={`chip`}>
              <span className={`dot${isSyncConfigured ? '' : ' off'}`} />
              {isSyncConfigured ? 'Live sync on' : 'Demo mode — saved on this device only'}
            </span>
          </div>
          <div className="small muted">
            You’re signed in as <strong style={{ color: 'var(--text)' }}>{ch.players[me].name}</strong>.
            {!isSyncConfigured && ' In demo mode you can switch players to try both sides on one phone.'}
          </div>
          <div className="row wrap">
            <button className="btn sm" onClick={() => onSwitch(other(me))}>
              I’m actually {ch.players[other(me)].name}
            </button>
            <button className="btn sm danger" onClick={() => confirm('Leave this challenge on this device? You can rejoin with the code.') && onLeave()}>
              Leave on this device
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function TaskEditor({ ch, me, today }: { ch: Challenge; me: PlayerId; today: string }) {
  const [title, setTitle] = useState('');
  const [emojiFor, setEmojiFor] = useState<Task | null>(null);
  const tasks = editableTasks(ch.tasks?.[me], today);
  const locked = isLocked(ch, today);
  const from = effectiveDate(ch, today);
  const missingStandard = STANDARD_TASKS.filter((s) => !tasks.some((t) => t.title.toLowerCase() === s.title.toLowerCase()));

  const add = () => {
    const t = title.trim();
    if (!t) return;
    addTasks(ch, me, today, [{ title: t, emoji: suggestEmoji(t) }]);
    setTitle('');
  };

  return (
    <section className={me}>
      <h2 className="section-title" style={{ marginTop: 4 }}>
        My daily tasks
      </h2>
      <div className="card stack">
        {locked && (
          <div className="banner warn small">
            <span>🔒</span>
            <span className="grow">
              The challenge has started, so task changes kick in from <strong>tomorrow ({formatDay(from)})</strong>. No dodging today’s tasks!
            </span>
          </div>
        )}

        {tasks.length > 0 && (
          <ul className="editor-list">
            {tasks.map((t, i) => {
              const pending = t.addedOn > today;
              const leaving = Boolean(t.removedOn);
              return (
                <li key={t.id} className={`editor-item${pending ? ' pending' : ''}${leaving ? ' leaving' : ''}`}>
                  <button className="emoji-btn" onClick={() => setEmojiFor(t)} aria-label="Change icon" disabled={leaving}>
                    {t.emoji}
                  </button>
                  <TitleInput value={t.title} disabled={leaving} onSave={(v) => editTask(ch, me, t.id, { title: v })} />
                  {pending && <span className="tag new">From tmrw</span>}
                  {leaving ? (
                    <>
                      <span className="tag bye">Ends today</span>
                      <button className="btn sm ghost" onClick={() => restoreTask(ch, me, t.id)}>
                        Undo
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => moveTask(ch, me, today, t.id, -1)}>
                        ↑
                      </button>
                      <button className="icon-btn" aria-label="Remove task" onClick={() => removeTask(ch, me, today, t)}>
                        ✕
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <input className="input" placeholder="Add a task, e.g. 10k steps" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
          <button className="btn accent" type="submit" disabled={!title.trim()}>
            Add
          </button>
        </form>

        {missingStandard.length > 0 && (
          <div className="stack" style={{ gap: 8 }}>
            <div className="row between">
              <span className="small muted">Classic 75 Hard tasks</span>
              {missingStandard.length > 1 && (
                <button className="btn sm ghost" onClick={() => addTasks(ch, me, today, missingStandard)}>
                  Add all
                </button>
              )}
            </div>
            <div className="suggestions">
              {missingStandard.map((s) => (
                <button key={s.title} className="suggestion" onClick={() => addTasks(ch, me, today, [s])}>
                  {s.emoji} {s.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {emojiFor && (
        <Sheet title="Pick an icon" onClose={() => setEmojiFor(null)}>
          <div className="emoji-grid">
            {EMOJIS.map((e) => (
              <button
                key={e}
                className={e === emojiFor.emoji ? 'on' : ''}
                onClick={() => {
                  editTask(ch, me, emojiFor.id, { emoji: e });
                  setEmojiFor(null);
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </section>
  );
}

function TitleInput({ value, disabled, onSave }: { value: string; disabled?: boolean; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    const v = draft.trim();
    if (v && v !== value) onSave(v);
    else setDraft(value);
  };
  return (
    <input
      className="input"
      value={draft}
      disabled={disabled}
      maxLength={60}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      aria-label="Task name"
    />
  );
}

export function ModeHelp({ mode, penalty, currency }: { mode: Mode; penalty: number; currency: string }) {
  return mode === 'traditional' ? (
    <div className="mode-help">
      <strong>Traditional 75 Hard</strong>
      Miss any task and you go back to day 1 — plus you owe {money(penalty, currency)} for every task missed.
    </div>
  ) : (
    <div className="mode-help">
      <strong>Forgiving</strong>
      Miss a task and you owe {money(penalty, currency)} per task, but you keep your day count. The challenge ends after 75 days either way.
    </div>
  );
}

export function PenaltyStepper({ value, onChange, currency }: { value: number; onChange: (n: number) => void; currency: string }) {
  return (
    <div className="stepper">
      <button type="button" className="btn" onClick={() => onChange(Math.max(0, value - 1))} aria-label="Decrease">
        −
      </button>
      <input
        className="input"
        inputMode="decimal"
        value={`${currency}${value}`}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/[^0-9.]/g, ''));
          if (Number.isFinite(n)) onChange(Math.min(10_000, n));
        }}
        aria-label="Penalty per missed task"
      />
      <button type="button" className="btn" onClick={() => onChange(value + 1)} aria-label="Increase">
        +
      </button>
    </div>
  );
}

function RulesEditor({ ch, today }: { ch: Challenge; today: string }) {
  const from = effectiveDate(ch, today);
  const scheduled = ruleFor(ch.rules, from);
  const current = ruleFor(ch.rules, today);
  const [mode, setMode] = useState<Mode>(scheduled.mode);
  const [penalty, setPenalty] = useState(scheduled.penalty);
  useEffect(() => {
    setMode(scheduled.mode);
    setPenalty(scheduled.penalty);
  }, [scheduled.mode, scheduled.penalty]);
  const dirty = mode !== scheduled.mode || penalty !== scheduled.penalty;
  const locked = isLocked(ch, today);
  const pendingChange = locked && (scheduled.mode !== current.mode || scheduled.penalty !== current.penalty);

  return (
    <section>
      <h2 className="section-title">Challenge rules · shared</h2>
      <div className="card stack">
        <div className="segmented" role="radiogroup" aria-label="Rules">
          <button className={mode === 'traditional' ? 'on' : ''} role="radio" aria-checked={mode === 'traditional'} onClick={() => setMode('traditional')}>
            Traditional
          </button>
          <button className={mode === 'forgiving' ? 'on' : ''} role="radio" aria-checked={mode === 'forgiving'} onClick={() => setMode('forgiving')}>
            Forgiving
          </button>
        </div>
        <ModeHelp mode={mode} penalty={penalty} currency={ch.currency} />
        <div className="row between wrap">
          <span className="small muted">Owed per missed task</span>
          <PenaltyStepper value={penalty} onChange={setPenalty} currency={ch.currency} />
        </div>
        {pendingChange && !dirty && (
          <div className="small muted">
            Today: {current.mode} at {money(current.penalty, ch.currency)}. Switching to {scheduled.mode} at {money(scheduled.penalty, ch.currency)} from{' '}
            {formatDay(from)}.
          </div>
        )}
        {dirty && (
          <button className="btn primary block" onClick={() => setRule(ch, today, { mode, penalty })}>
            {locked ? `Save — applies from ${formatDay(addDays(today, 1))}` : 'Save rules'}
          </button>
        )}
        <div className="small muted">Rules apply to both of you. Changing them mid-challenge never rewrites past days.</div>
      </div>
    </section>
  );
}

function PlayersEditor({ ch }: { ch: Challenge }) {
  return (
    <section>
      <h2 className="section-title">Names</h2>
      <div className="card stack">
        {(['p1', 'p2'] as PlayerId[]).map((pid) => (
          <div key={pid} className={`row ${pid}`}>
            <span className="avatar" style={{ width: 36, height: 36, borderRadius: 11, fontSize: 15 }}>
              {ch.players[pid].name.charAt(0).toUpperCase()}
            </span>
            <TitleInput value={ch.players[pid].name} onSave={(v) => renamePlayer(ch.code, pid, v)} />
          </div>
        ))}
      </div>
    </section>
  );
}
