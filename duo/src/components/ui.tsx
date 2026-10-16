import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { PlayerId } from '../lib/types';

export function ProgressRing({ value, total, size = 56 }: { value: number; total: number; size?: number }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? value / total : 0;
  const complete = total > 0 && value >= total;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={complete ? 'var(--good)' : 'var(--accent)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className={`ring-label${complete ? ' done' : ''}`}>{complete ? '✓' : `${value}/${total}`}</div>
    </div>
  );
}

export const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3 8.5 6.5 12 13 4.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Avatar({ name, pid, photo, className = '' }: { name: string; pid: PlayerId; photo?: string | null; className?: string }) {
  if (photo) {
    return (
      <div className={`avatar has-photo ${pid} ${className}`}>
        <img src={photo} alt="" />
      </div>
    );
  }
  return <div className={`avatar ${pid} ${className}`}>{(name || '?').trim().charAt(0).toUpperCase()}</div>;
}

export function Sheet({ title, sub, onClose, children }: { title: string; sub?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div>
            <h2>{title}</h2>
            {sub && <p className="muted small" style={{ margin: '0 0 16px' }}>{sub}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export interface Toast {
  id: number;
  pid: PlayerId;
  name: string;
  text: string;
  kind?: 'nudge';
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = nextId.current++;
    setToasts((ts) => [...ts.slice(-2), { ...t, id }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), t.kind === 'nudge' ? 6000 : 3800);
  }, []);
  return { toasts, push };
}

export function Toasts({ toasts, photos }: { toasts: Toast[]; photos?: Partial<Record<PlayerId, string | null>> }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.pid}${t.kind ? ` ${t.kind}` : ''}`}>
          <Avatar name={t.name} pid={t.pid} photo={photos?.[t.pid]} />
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/** A button that needs a second tap to fire. Avoids native confirm() dialogs. */
export function ConfirmButton({ className, label, confirmLabel, ariaLabel, onConfirm }: { className: string; label: ReactNode; confirmLabel: string; ariaLabel?: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(id);
  }, [armed]);
  return (
    <button
      className={`${className}${armed ? ' armed' : ''}`}
      aria-label={armed ? confirmLabel : ariaLabel}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}

export const EMOJIS = ['🏋️', '🏃', '🥗', '💧', '📖', '📸', '🚫', '😴', '🧘', '🤸', '🧊', '📵', '🍬', '👟', '✅', '💊', '🚴', '🏊', '🥩', '☕', '✍️', '🎯', '🧠', '🔥'];

const iconProps = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' } as const;

export const Icons = {
  today: () => (
    <svg {...iconProps}>
      <path d="M12 3c1.5 3 4.5 4.5 4.5 9a4.5 4.5 0 0 1-9 0c0-2 1-3.5 2-4.5.5 1.5 1.5 2.5 2.5 2.5 0-3-1-5 0-7z" />
    </svg>
  ),
  history: () => (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  ),
  settings: () => (
    <svg {...iconProps}>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  ),
};
