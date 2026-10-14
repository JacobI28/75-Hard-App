import { useEffect, useState } from 'react';
import { dateKey, msUntilMidnight } from './dates';
import { getBackend } from './store';
import type { Challenge } from './types';

/** Today's date key plus a countdown to midnight, refreshed every 20 seconds. */
export function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 20_000);
    const onVisible = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return { today: dateKey(now), msLeft: msUntilMidnight(now) };
}

export type ChallengeState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error'; error: string }
  | { status: 'ready'; challenge: Challenge };

export function useChallenge(code: string): ChallengeState {
  const [state, setState] = useState<ChallengeState>({ status: 'loading' });
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;
    setState({ status: 'loading' });
    getBackend()
      .then((b) => {
        if (cancelled) return;
        unsub = b.subscribe(
          code,
          (ch) => setState(ch ? { status: 'ready', challenge: ch } : { status: 'missing' }),
          (e) => setState({ status: 'error', error: e.message }),
        );
      })
      .catch((e: Error) => setState({ status: 'error', error: e.message }));
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [code]);
  return state;
}
