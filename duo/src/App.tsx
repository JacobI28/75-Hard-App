import { useEffect, useMemo, useRef, useState } from 'react';
import { Icons, Sheet, Toasts, useToasts } from './components/ui';
import { recordPayment, toggleTask } from './lib/actions';
import { useChallenge, useClock } from './lib/hooks';
import { balance, money, other, prettyCode, summarize } from './lib/logic';
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
  const { toasts, push } = useToasts();

  const summaries = useMemo(() => ({ p1: summarize(ch, 'p1', today), p2: summarize(ch, 'p2', today) }), [ch, today]);
  const bal = useMemo(() => balance({ p1: summaries.p1.debt, p2: summaries.p2.debt }, ch.payments), [summaries, ch.payments]);

  usePartnerToasts(ch, me, today, push);

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
      <Toasts toasts={toasts} />
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
            onToggle={(taskId, done) => toggleTask(ch, me, today, taskId, done)}
            onSettle={() => setSettling(true)}
            onShare={share}
            onEditTasks={() => setTab('settings')}
          />
        </>
      )}
      {tab === 'history' && <History ch={ch} me={me} today={today} summaries={summaries} />}
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
    </div>
  );
}

/** Pop a toast when the partner ticks something off (only for changes that arrive live). */
function usePartnerToasts(ch: Challenge, me: PlayerId, today: string, push: ReturnType<typeof useToasts>['push']) {
  const partner = other(me);
  const prev = useRef<Record<string, number> | null>(null);
  const prevDay = useRef(today);
  useEffect(() => {
    const now = ch.done?.[partner]?.[today] ?? {};
    if (prev.current && prevDay.current === today) {
      const tasks = ch.tasks?.[partner] ?? {};
      const added = Object.keys(now).filter((id) => !prev.current![id] && tasks[id]);
      const name = ch.players[partner].name;
      const s = summarize(ch, partner, today);
      if (added.length && s.todayComplete) push({ pid: partner, name, text: `${name} smashed all of today’s tasks 🔥` });
      else for (const id of added) push({ pid: partner, name, text: `${name} ticked off ${tasks[id].emoji} ${tasks[id].title}` });
    }
    prev.current = now;
    prevDay.current = today;
  }, [ch, partner, today, push]);
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
