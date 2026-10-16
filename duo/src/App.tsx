import { useEffect, useMemo, useRef, useState } from 'react';
import { Celebration, confetti, type CelebrationInfo } from './components/celebrate';
import { Icons, Sheet, Toasts, useToasts } from './components/ui';
import { NUDGE_PRESETS, recordPayment, sendNudge, setNote, toggleTask } from './lib/actions';
import { useChallenge, useClock } from './lib/hooks';
import { addDays } from './lib/dates';
import { balance, gapBonus, MILESTONES, money, other, prettyCode, raceEnd, raceFor, raceTally, summarize, type PlayerSummary } from './lib/logic';
import { isSyncConfigured, loadSession, saveSession, type Session } from './lib/store';
import type { Challenge, PlayerId } from './lib/types';
import { History } from './screens/History';
import { Settings } from './screens/Settings';
import { Today } from './screens/Today';
import { Welcome } from './screens/Welcome';

type Tab = 'today' | 'history' | 'settings';

function readJoinParam(): string | null {
  return new URLSearchParams(window.location.search).get('join');
}

function clearJoinParam() {
  const url = new URL(window.location.href);
  if (url.searchParams.has('join')) {
    url.searchParams.delete('join');
    history.replaceState(null, '', url.toString());
  }
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const s = loadSession();
    const join = readJoinParam();
    // An invite link for a different challenge takes priority over the saved one.
    return join && s && s.code !== join.toUpperCase().replace(/[^A-Z0-9]/g, '') ? null : s;
  });
  const [joinCode] = useState(readJoinParam);

  const update = (s: Session | null) => {
    saveSession(s);
    setSession(s);
    clearJoinParam();
  };

  if (!session) return <Welcome joinCode={joinCode} onReady={update} />;
  return <ChallengeView key={session.code} session={session} onSession={update} />;
}

function ChallengeView({ session, onSession }: { session: Session; onSession: (s: Session | null) => void }) {
  const state = useChallenge(session.code);
  const { today, msLeft } = useClock();

  if (state.status === 'loading') {
    return (
      <main className="welcome" style={{ textAlign: 'center' }}>
        <div className="brand-mark" style={{ margin: '30vh auto 0' }}>
          75
        </div>
      </main>
    );
  }
  if (state.status !== 'ready') {
    return (
      <main className="welcome stack">
        <h1 className="hero-title" style={{ fontSize: 36 }}>
          {state.status === 'missing' ? 'Challenge not found' : 'Couldn’t connect'}
        </h1>
        <p className="muted">
          {state.status === 'missing'
            ? `There’s no challenge with code ${prettyCode(session.code)} any more.`
            : `Error: ${state.error}. Check your connection and the Firebase setup in the README.`}
        </p>
        <button className="btn primary block" onClick={() => window.location.reload()}>
          Try again
        </button>
        <button className="btn block" onClick={() => onSession(null)}>
          Start over
        </button>
      </main>
    );
  }
  return <Dashboard ch={state.challenge} me={session.me} today={today} msLeft={msLeft} onSession={onSession} />;
}

function Dashboard({
  ch,
  me,
  today,
  msLeft,
  onSession,
}: {
  ch: Challenge;
  me: PlayerId;
  today: string;
  msLeft: number;
  onSession: (s: Session | null) => void;
}) {
  const [tab, setTab] = useState<Tab>('today');
  const [settling, setSettling] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [noteFor, setNoteFor] = useState<{ date: string; taskId: string } | null>(null);
  const [celebration, setCelebration] = useState<CelebrationInfo | null>(null);
  const { toasts, push } = useToasts();

  const summaries = useMemo(() => ({ p1: summarize(ch, 'p1', today), p2: summarize(ch, 'p2', today) }), [ch, today]);
  const tally = useMemo(() => raceTally(ch, today, raceEnd(summaries)), [ch, today, summaries]);
  const bonus = useMemo(() => gapBonus(ch, tally), [ch, tally]);
  const bal = useMemo(() => {
    // Once the race is over, the gap bonus joins the loser's penalties.
    const extra = (pid: PlayerId) => (bonus.due && bonus.payer === pid ? bonus.amount : 0);
    return balance({ p1: summaries.p1.debt + extra('p1'), p2: summaries.p2.debt + extra('p2') }, ch.payments);
  }, [summaries, ch.payments, bonus]);
  const wonToday = tally.days.find((d) => d.date === today)?.winner === me;

  usePartnerToasts(ch, me, today, push);
  useIncomingNudges(ch, me, push);
  useCelebrations(summaries[me], today, push, ch.players[me].name, me, setCelebration, wonToday);

  useEffect(() => window.scrollTo({ top: 0 }), [tab]);

  const share = async () => {
    const url = new URL(window.location.href);
    url.search = `?join=${ch.code}`;
    url.hash = '';
    const text = `Join my 75 Hard challenge! Code: ${prettyCode(ch.code)}`;
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        push({ pid: me, name: ch.players[me].name, text: 'Invite link copied' });
      } catch {
        push({ pid: me, name: ch.players[me].name, text: `Your code is ${prettyCode(ch.code)}` });
      }
    };
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title: '75 Hard Duo', text, url: url.toString() });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') await copy();
    }
  };

  const hours = Math.floor(msLeft / 3_600_000);
  const mins = Math.floor((msLeft % 3_600_000) / 60_000);
  const mySummary = summaries[me];
  const started = mySummary.started;

  return (
    <div className="app">
      <Toasts toasts={toasts} photos={{ p1: ch.players.p1.photo, p2: ch.players.p2.photo }} />
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">75</div>
          <div>
            75 Hard Duo
            <small>
              {ch.players.p1.name} vs {ch.players.p2.name}
            </small>
          </div>
        </div>
        <span className="chip" title={isSyncConfigured ? 'Changes sync instantly' : 'Data is only on this device'}>
          <span className={`dot${isSyncConfigured ? '' : ' off'}`} />
          {isSyncConfigured ? 'Live' : 'Demo'}
        </span>
      </header>

      {tab === 'today' && (
        <>
          <div className="daystrip">
            <span>
              {started ? (
                <>
                  <strong>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
                </>
              ) : (
                <>
                  Day 1 is <strong>in {mySummary.daysUntilStart} day{mySummary.daysUntilStart === 1 ? '' : 's'}</strong>
                </>
              )}
            </span>
            {started && !mySummary.finishedOn && (
              <span>
                <span className={`countdown${hours < 2 && !mySummary.todayComplete ? ' urgent' : ''}`}>
                  {hours}h {String(mins).padStart(2, '0')}m
                </span>{' '}
                left today
              </span>
            )}
          </div>
          <Today
            ch={ch}
            me={me}
            summaries={summaries}
            bal={bal}
            tally={tally}
            bonus={bonus}
            today={today}
            onToggle={(date, taskId, done) => toggleTask(ch, me, date ?? today, taskId, done)}
            onNote={(date, taskId) => setNoteFor({ date: date ?? today, taskId })}
            onNudge={() => setNudging(true)}
            onSettle={() => setSettling(true)}
            onShare={share}
            onEditTasks={() => setTab('settings')}
          />
        </>
      )}
      {tab === 'history' && <History ch={ch} me={me} today={today} summaries={summaries} tally={tally} bonus={bonus} />}
      {tab === 'settings' && (
        <Settings
          ch={ch}
          me={me}
          today={today}
          onShare={share}
          onSwitch={(pid) => onSession({ code: ch.code, me: pid })}
          onLeave={() => onSession(null)}
        />
      )}

      <nav className="tabbar" aria-label="Sections">
        {(
          [
            ['today', 'Today', Icons.today],
            ['history', 'History', Icons.history],
            ['settings', 'Setup', Icons.settings],
          ] as const
        ).map(([id, label, Icon]) => (
          <button key={id} className={`tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)} aria-current={tab === id}>
            <Icon />
            {label}
          </button>
        ))}
      </nav>

      {settling && <SettleSheet ch={ch} debtor={bal.debtor} amount={bal.amount} onClose={() => setSettling(false)} />}
      {nudging && (
        <NudgeSheet
          ch={ch}
          me={me}
          onClose={() => setNudging(false)}
          onSent={() => push({ pid: me, name: ch.players[me].name, text: `Nudge sent to ${ch.players[other(me)].name} 👊` })}
        />
      )}
      {noteFor && <NoteSheet ch={ch} me={me} date={noteFor.date} taskId={noteFor.taskId} today={today} onClose={() => setNoteFor(null)} />}
      {celebration && <Celebration info={celebration} onClose={() => setCelebration(null)} />}
    </div>
  );
}

/** Pop a toast when the partner ticks something off or adds a note (only for changes that arrive live). */
function usePartnerToasts(ch: Challenge, me: PlayerId, today: string, push: ReturnType<typeof useToasts>['push']) {
  const partner = other(me);
  const yesterday = addDays(today, -1);
  type Snap = { day: string; today: Record<string, number>; yesterday: Record<string, number>; notes: Record<string, string>; streak: number };
  const prev = useRef<Snap | null>(null);
  useEffect(() => {
    const s = summarize(ch, partner, today);
    const now: Snap = {
      day: today,
      today: ch.done?.[partner]?.[today] ?? {},
      yesterday: ch.done?.[partner]?.[yesterday] ?? {},
      notes: { ...(ch.notes?.[partner]?.[yesterday] ?? {}), ...(ch.notes?.[partner]?.[today] ?? {}) },
      streak: s.liveStreak,
    };
    const before = prev.current;
    if (before && before.day === today) {
      const tasks = ch.tasks?.[partner] ?? {};
      const name = ch.players[partner].name;
      const newly = (key: 'today' | 'yesterday') => Object.keys(now[key]).filter((id) => !before[key][id] && tasks[id]);
      const addedToday = newly('today');
      const addedLate = newly('yesterday');
      if (addedToday.length && s.todayComplete) {
        const first = raceFor(ch, today)?.winner === partner;
        push({ pid: partner, name, text: first ? `${name} finished first and won the day 🏁` : `${name} smashed all of today’s tasks 🔥` });
      }
      else for (const id of addedToday) push({ pid: partner, name, text: `${name} ticked off ${tasks[id].emoji} ${tasks[id].title}` });
      if (addedLate.length && s.grace?.perfect) push({ pid: partner, name, text: `${name} saved yesterday just in time 😅` });
      else for (const id of addedLate) push({ pid: partner, name, text: `${name} ticked off yesterday’s ${tasks[id].emoji} ${tasks[id].title}` });
      for (const [id, note] of Object.entries(now.notes)) {
        if (note !== before.notes[id] && tasks[id]) push({ pid: partner, name, text: `${tasks[id].emoji} ${name}: “${note}”` });
      }
      const hit = MILESTONES.filter((m) => m > before.streak && m <= now.streak).pop();
      if (hit) push({ pid: partner, name, text: `${name} just hit a ${hit}-day streak 🏆` });
    }
    prev.current = now;
  }, [ch, partner, today, yesterday, push]);
}

/** Show nudges from the partner: live while the app is open, and any missed while it was closed. */
function useIncomingNudges(ch: Challenge, me: PlayerId, push: ReturnType<typeof useToasts>['push']) {
  const key = `duo.nudgeSeen.${ch.code}.${me}`;
  const seen = useRef<number | null>(null);
  useEffect(() => {
    if (seen.current === null) {
      try {
        seen.current = Number(localStorage.getItem(key)) || Date.now() - 86_400_000;
      } catch {
        seen.current = Date.now() - 86_400_000;
      }
    }
    const fresh = Object.values(ch.nudges ?? {})
      .filter((n) => n.to === me && n.at > seen.current!)
      .sort((a, b) => a.at - b.at)
      .slice(-3);
    if (!fresh.length) return;
    for (const n of fresh) {
      const name = ch.players[n.from].name;
      const ago = Date.now() - n.at > 120_000 ? ` (${timeAgo(n.at)})` : '';
      push({ pid: n.from, name, text: `${name} nudged you: ${n.text}${ago}`, kind: 'nudge' });
    }
    navigator.vibrate?.([80, 60, 80]);
    seen.current = fresh[fresh.length - 1].at;
    try {
      localStorage.setItem(key, String(seen.current));
    } catch {
      /* fine — worst case a nudge shows again next visit */
    }
  }, [ch.nudges, ch.players, me, key, push]);
}

function timeAgo(at: number) {
  const mins = Math.round((Date.now() - at) / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

/** Confetti when you finish the day, and a full-screen moment at streak milestones. */
function useCelebrations(
  s: PlayerSummary,
  today: string,
  push: ReturnType<typeof useToasts>['push'],
  name: string,
  me: PlayerId,
  setCelebration: (c: CelebrationInfo) => void,
  wonToday: boolean,
) {
  const prev = useRef<{ day: string; streak: number; complete: boolean } | null>(null);
  useEffect(() => {
    const before = prev.current;
    prev.current = { day: today, streak: s.liveStreak, complete: s.todayComplete };
    if (!before || before.day !== today) return;
    // Ticking yesterday late can jump the streak by two, so look for any milestone crossed.
    const hit = MILESTONES.filter((m) => m > before.streak && m <= s.liveStreak).pop();
    if (hit) {
      const final = hit === 75;
      setCelebration({
        emoji: final ? '🏆' : '🔥',
        title: final ? '75 days. Done.' : `${hit}-day streak!`,
        text: final
          ? 'You finished 75 Hard without missing a thing. Legendary.'
          : `${hit} days in a row without missing a single task. ${hit >= 30 ? 'This is who you are now.' : 'Keep stacking them.'}`,
      });
    } else if (s.todayComplete && !before.complete) {
      confetti();
      push({ pid: me, name, text: wonToday ? 'All done, and you won the day 🏁' : 'All done for today 💪 Enjoy the rest of your day.' });
    }
  }, [s.liveStreak, s.todayComplete, today, push, name, me, setCelebration, wonToday]);
}

function NudgeSheet({ ch, me, onClose, onSent }: { ch: Challenge; me: PlayerId; onClose: () => void; onSent: () => void }) {
  const [custom, setCustom] = useState('');
  const partner = ch.players[other(me)].name;
  const send = async (text: string) => {
    if (!text.trim()) return;
    await sendNudge(ch, me, text);
    onSent();
    onClose();
  };
  return (
    <Sheet title={`Nudge ${partner}`} sub="Pops up on their screen straight away if the app is open, otherwise next time they open it." onClose={onClose}>
      <div className="stack">
        <div className="nudge-grid">
          {NUDGE_PRESETS.map((t) => (
            <button key={t} className="suggestion" onClick={() => send(t)}>
              {t}
            </button>
          ))}
        </div>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            send(custom);
          }}
        >
          <input
            id="nudge-text"
            className="input"
            placeholder="Or write your own…"
            value={custom}
            maxLength={80}
            onChange={(e) => setCustom(e.target.value)}
          />
          <button className="btn primary" type="submit" disabled={!custom.trim()}>
            Send
          </button>
        </form>
      </div>
    </Sheet>
  );
}

function NoteSheet({
  ch,
  me,
  date,
  taskId,
  today,
  onClose,
}: {
  ch: Challenge;
  me: PlayerId;
  date: string;
  taskId: string;
  today: string;
  onClose: () => void;
}) {
  const task = ch.tasks?.[me]?.[taskId];
  const existing = ch.notes?.[me]?.[date]?.[taskId] ?? '';
  const [text, setText] = useState(existing);
  if (!task) return null;
  const save = async (value: string) => {
    await setNote(ch, me, date, taskId, value);
    onClose();
  };
  return (
    <Sheet
      title={`${task.emoji} ${task.title}`}
      sub={`${date === today ? 'Today' : 'Yesterday'} · ${ch.players[other(me)].name} will see this note.`}
      onClose={onClose}
    >
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          save(text);
        }}
      >
        <textarea
          id="task-note"
          className="input textarea"
          placeholder="e.g. Deadlift PB 140kg, 5k in 24:10, finished Atomic Habits…"
          value={text}
          maxLength={200}
          rows={3}
          autoFocus
          onChange={(e) => setText(e.target.value)}
        />
        <div className="row between">
          <span className="small muted">{text.length}/200</span>
          <div className="row">
            {existing && (
              <button type="button" className="btn sm danger" onClick={() => save('')}>
                Remove
              </button>
            )}
            <button type="submit" className="btn sm accent" disabled={text.trim() === existing}>
              Save note
            </button>
          </div>
        </div>
      </form>
    </Sheet>
  );
}

function SettleSheet({ ch, debtor, amount, onClose }: { ch: Challenge; debtor: PlayerId | null; amount: number; onClose: () => void }) {
  const [from, setFrom] = useState<PlayerId>(debtor ?? 'p1');
  const [value, setValue] = useState(amount ? String(amount) : '');
  const [note, setNote] = useState('');
  const n = Number(value);
  const to = other(from);
  return (
    <Sheet
      title="Settle up"
      sub={debtor ? `${ch.players[debtor].name} currently owes ${money(amount, ch.currency)}.` : 'You’re all square right now.'}
      onClose={onClose}
    >
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!(n > 0)) return;
          await recordPayment(ch, from, to, n, note);
          onClose();
        }}
      >
        <div className="field">
          <span>Who paid?</span>
          <div className="segmented">
            {(['p1', 'p2'] as PlayerId[]).map((pid) => (
              <button type="button" key={pid} className={from === pid ? 'on' : ''} onClick={() => setFrom(pid)}>
                {ch.players[pid].name}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>Amount paid to {ch.players[to].name}</span>
          <input className="input" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" />
        </label>
        <label className="field">
          <span>Note (optional)</span>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bank transfer" maxLength={60} />
        </label>
        <button className="btn primary block" type="submit" disabled={!(n > 0)}>
          Record {n > 0 ? money(n, ch.currency) : ''} payment
        </button>
        <p className="small muted" style={{ margin: 0 }}>
          This just records the payment. Send the actual money however you like.
        </p>
      </form>
    </Sheet>
  );
}
