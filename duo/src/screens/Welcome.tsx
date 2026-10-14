import { useEffect, useState } from 'react';
import { createChallenge, createSampleChallenge, fetchChallenge, markJoined } from '../lib/actions';
import { dateKey } from '../lib/dates';
import { normalizeCode, prettyCode } from '../lib/logic';
import { isSyncConfigured, type Session } from '../lib/store';
import type { Challenge, Mode, PlayerId } from '../lib/types';
import { ModeHelp, PenaltyStepper } from './Settings';

type Step = 'home' | 'create' | 'join';

export function Welcome({ joinCode, onReady }: { joinCode: string | null; onReady: (s: Session) => void }) {
  const [step, setStep] = useState<Step>(joinCode ? 'join' : 'home');

  return (
    <main className="welcome">
      <div className="brand">
        <div className="brand-mark">75</div>
        <div>
          75 Hard Duo
          <small>Accountability, with interest</small>
        </div>
      </div>

      {step === 'home' && (
        <>
          <h1 className="hero-title">
            75 days.
            <br />
            Two people.
            <br />
            <em>Real stakes.</em>
          </h1>
          <p className="hero-sub">Track your own tasks, see your partner tick theirs off live, and keep a running tab of who owes who.</p>
          <ul className="feature-list">
            <li>
              <span>✅</span>Your own daily tasks, your own rules
            </li>
            <li>
              <span>⚡</span>Live updates when your partner ticks something off
            </li>
            <li>
              <span>💷</span>Automatic tally of money owed
            </li>
          </ul>
          <div className="stack">
            <button className="btn primary block" onClick={() => setStep('create')}>
              Start a challenge
            </button>
            <button className="btn block" onClick={() => setStep('join')}>
              Join with a code
            </button>
          </div>
          {!isSyncConfigured && (
            <div className="banner warn small" style={{ marginTop: 22 }}>
              <span>⚠️</span>
              <span className="grow">
                Demo mode: sync isn’t set up yet, so data stays on this device.{' '}
                <button
                  className="link"
                  onClick={async () => {
                    const ch = await createSampleChallenge();
                    onReady({ code: ch.code, me: 'p1' });
                  }}
                >
                  Explore with sample data
                </button>
              </span>
            </div>
          )}
        </>
      )}

      {step === 'create' && <CreateForm onBack={() => setStep('home')} onReady={onReady} />}
      {step === 'join' && <JoinForm initialCode={joinCode ?? ''} onBack={() => setStep('home')} onReady={onReady} />}
    </main>
  );
}

function CreateForm({ onBack, onReady }: { onBack: () => void; onReady: (s: Session) => void }) {
  const [myName, setMyName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [startDate, setStartDate] = useState(dateKey());
  const [mode, setMode] = useState<Mode>('traditional');
  const [penalty, setPenalty] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const valid = myName.trim() && partnerName.trim() && startDate >= dateKey();

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const ch = await createChallenge({ myName, partnerName, startDate, mode, penalty });
      onReady({ code: ch.code, me: 'p1' });
    } catch (e) {
      setError((e as Error).message || 'Could not create the challenge.');
      setBusy(false);
    }
  };

  return (
    <form
      className="stack"
      style={{ marginTop: 28 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) submit();
      }}
    >
      <h1 className="hero-title" style={{ fontSize: 40, margin: '0 0 6px' }}>
        New challenge
      </h1>
      <label className="field">
        <span>Your name</span>
        <input className="input" value={myName} onChange={(e) => setMyName(e.target.value)} placeholder="e.g. Jacob" maxLength={24} autoFocus />
      </label>
      <label className="field">
        <span>Your partner’s name</span>
        <input className="input" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="e.g. your brother" maxLength={24} />
      </label>
      <label className="field">
        <span>Day 1</span>
        <input className="input" type="date" value={startDate} min={dateKey()} onChange={(e) => setStartDate(e.target.value)} />
      </label>
      <div className="field">
        <span>Rules</span>
        <div className="segmented">
          <button type="button" className={mode === 'traditional' ? 'on' : ''} onClick={() => setMode('traditional')}>
            Traditional
          </button>
          <button type="button" className={mode === 'forgiving' ? 'on' : ''} onClick={() => setMode('forgiving')}>
            Forgiving
          </button>
        </div>
      </div>
      <ModeHelp mode={mode} penalty={penalty} currency="£" />
      <div className="row between wrap">
        <span className="small muted">Owed per missed task</span>
        <PenaltyStepper value={penalty} onChange={setPenalty} currency="£" />
      </div>
      {error && <div className="error">{error}</div>}
      <button className="btn primary block" type="submit" disabled={!valid || busy}>
        {busy ? 'Creating…' : 'Create challenge'}
      </button>
      <button className="btn ghost block" type="button" onClick={onBack}>
        Back
      </button>
    </form>
  );
}

function JoinForm({ initialCode, onBack, onReady }: { initialCode: string; onBack: () => void; onReady: (s: Session) => void }) {
  const [code, setCode] = useState(normalizeCode(initialCode));
  const [found, setFound] = useState<Challenge | null>(null);
  const [who, setWho] = useState<PlayerId>('p2');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const lookup = async (c: string) => {
    setBusy(true);
    setError('');
    try {
      const ch = await fetchChallenge(c);
      if (!ch) setError('No challenge found with that code. Double-check it with your partner.');
      setFound(ch);
      if (ch) setWho(ch.players.p2.joined && !ch.players.p1.joined ? 'p1' : 'p2');
    } catch (e) {
      setError((e as Error).message || 'Could not look up that code.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (initialCode && normalizeCode(initialCode).length === 8) lookup(normalizeCode(initialCode));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const join = async () => {
    if (!found) return;
    setBusy(true);
    try {
      await markJoined(found.code, who);
      onReady({ code: found.code, me: who });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="stack" style={{ marginTop: 28 }}>
      <h1 className="hero-title" style={{ fontSize: 40, margin: '0 0 6px' }}>
        Join a challenge
      </h1>
      {!found ? (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 8) lookup(code);
          }}
        >
          <label className="field">
            <span>Challenge code</span>
            <input
              className="input code"
              value={code.length > 4 ? prettyCode(code) : code}
              onChange={(e) => setCode(normalizeCode(e.target.value).slice(0, 8))}
              placeholder="XXXX-XXXX"
              autoCapitalize="characters"
              autoComplete="off"
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="btn primary block" type="submit" disabled={code.length !== 8 || busy}>
            {busy ? 'Looking…' : 'Find challenge'}
          </button>
        </form>
      ) : (
        <>
          <p className="muted" style={{ margin: 0 }}>
            Found it. Which one are you?
          </p>
          <div className="who-pick">
            {(['p1', 'p2'] as PlayerId[]).map((pid) => (
              <button key={pid} className={`${pid}${who === pid ? ' on' : ''}`} onClick={() => setWho(pid)}>
                <span className="avatar">{found.players[pid].name.charAt(0).toUpperCase()}</span>
                {found.players[pid].name}
                <span className="small muted" style={{ fontWeight: 600 }}>
                  {found.players[pid].joined ? 'Already joined' : 'Not joined yet'}
                </span>
              </button>
            ))}
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn primary block" onClick={join} disabled={busy}>
            Join as {found.players[who].name}
          </button>
        </>
      )}
      <button className="btn ghost block" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
