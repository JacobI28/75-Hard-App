import { firebaseConfig } from '../firebaseConfig';
import type { Challenge } from './types';

export const DELETE = Symbol('delete');

/** A single field update: path segments (no escaping needed) → new value, or DELETE. */
export type Change = [path: string[], value: unknown];

export interface Backend {
  kind: 'firebase' | 'local';
  create(ch: Challenge): Promise<void>;
  get(code: string): Promise<Challenge | null>;
  subscribe(code: string, onData: (ch: Challenge | null) => void, onError: (e: Error) => void): () => void;
  update(code: string, changes: Change[]): Promise<void>;
}

export const isSyncConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

/* ---------------- Local (demo) backend ---------------- */

const LOCAL_PREFIX = 'duo.challenge.';
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('duo-sync') : null;

// Falls back to memory when the browser refuses storage, so the app still works for the visit.
const memory = new Map<string, string>();

function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function setItem(key: string, value: string) {
  memory.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch {
    /* memory copy is used instead */
  }
}

function readLocal(code: string): Challenge | null {
  try {
    const raw = getItem(LOCAL_PREFIX + code);
    return raw ? (JSON.parse(raw) as Challenge) : null;
  } catch {
    return null;
  }
}

function applyChange(target: Record<string, unknown>, [path, value]: Change) {
  let node = target;
  for (const key of path.slice(0, -1)) {
    if (typeof node[key] !== 'object' || node[key] === null) node[key] = {};
    node = node[key] as Record<string, unknown>;
  }
  const last = path[path.length - 1];
  if (value === DELETE) delete node[last];
  else node[last] = value;
}

const localBackend: Backend = {
  kind: 'local',
  async create(ch) {
    setItem(LOCAL_PREFIX + ch.code, JSON.stringify(ch));
    channel?.postMessage(ch.code);
  },
  async get(code) {
    return readLocal(code);
  },
  subscribe(code, onData) {
    const emit = () => onData(readLocal(code));
    const onMessage = (e: MessageEvent) => e.data === code && emit();
    const onStorage = (e: StorageEvent) => e.key === LOCAL_PREFIX + code && emit();
    channel?.addEventListener('message', onMessage);
    window.addEventListener('storage', onStorage);
    window.addEventListener('duo-local', emit);
    queueMicrotask(emit);
    return () => {
      channel?.removeEventListener('message', onMessage);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('duo-local', emit);
    };
  },
  async update(code, changes) {
    const ch = readLocal(code);
    if (!ch) throw new Error('Challenge not found');
    for (const c of changes) applyChange(ch as unknown as Record<string, unknown>, c);
    setItem(LOCAL_PREFIX + code, JSON.stringify(ch));
    channel?.postMessage(code);
    window.dispatchEvent(new Event('duo-local'));
  },
};

/* ---------------- Firebase backend (loaded lazily) ---------------- */

async function createFirebaseBackend(): Promise<Backend> {
  const { initializeApp } = await import('firebase/app');
  const fs = await import('firebase/firestore');
  const app = initializeApp(firebaseConfig);
  let db: import('firebase/firestore').Firestore;
  try {
    // Offline cache: ticks made with no signal sync as soon as the phone reconnects.
    db = fs.initializeFirestore(app, {
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
    });
  } catch {
    db = fs.getFirestore(app);
  }
  const ref = (code: string) => fs.doc(db, 'challenges', code);

  return {
    kind: 'firebase',
    async create(ch) {
      await fs.setDoc(ref(ch.code), ch);
    },
    async get(code) {
      const snap = await fs.getDoc(ref(code));
      return snap.exists() ? (snap.data() as Challenge) : null;
    },
    subscribe(code, onData, onError) {
      return fs.onSnapshot(
        ref(code),
        (snap) => onData(snap.exists() ? (snap.data() as Challenge) : null),
        (err) => onError(err),
      );
    },
    async update(code, changes) {
      const args: unknown[] = [];
      for (const [path, value] of changes) {
        args.push(new fs.FieldPath(...path), value === DELETE ? fs.deleteField() : value);
      }
      const [first, firstValue, ...rest] = args;
      await fs.updateDoc(ref(code), first as import('firebase/firestore').FieldPath, firstValue, ...rest);
    },
  };
}

let backendPromise: Promise<Backend> | null = null;

export function getBackend(): Promise<Backend> {
  backendPromise ??= isSyncConfigured ? createFirebaseBackend() : Promise.resolve(localBackend);
  return backendPromise;
}

/* ---------------- Which challenge / player this device is ---------------- */

export interface Session {
  code: string;
  me: 'p1' | 'p2';
}

const SESSION_KEY = 'duo.session';

export function loadSession(): Session | null {
  try {
    const raw = getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session | null) {
  if (s) return setItem(SESSION_KEY, JSON.stringify(s));
  memory.delete(SESSION_KEY);
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
}
