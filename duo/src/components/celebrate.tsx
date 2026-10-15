import { useEffect } from 'react';

const COLORS = ['#ff6a2b', '#ff3d6e', '#8b7bff', '#36d399', '#ffc24b', '#ffffff'];

/** Fire a burst of confetti over the whole screen. Skipped when the user prefers reduced motion. */
export function confetti(intensity = 1) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.className = 'confetti';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.remove();
  ctx.scale(dpr, dpr);

  const count = Math.round(140 * intensity);
  const parts = Array.from({ length: count }, (_, i) => {
    const fromLeft = i % 2 === 0;
    const angle = (fromLeft ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.9;
    const speed = 9 + Math.random() * 9;
    return {
      x: fromLeft ? -10 : w + 10,
      y: h * 0.75,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORS[i % COLORS.length],
      shape: i % 3,
    };
  });

  const start = performance.now();
  const frame = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.vy += 0.32;
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / 3200);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 0) ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      else if (p.shape === 1) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.6, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.fillRect(-p.size / 2, -p.size / 2, p.size * 0.6, p.size);
      ctx.restore();
    }
    if (t < 3200) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

export interface CelebrationInfo {
  emoji: string;
  title: string;
  text: string;
}

export function Celebration({ info, onClose }: { info: CelebrationInfo; onClose: () => void }) {
  useEffect(() => {
    confetti(1.4);
    navigator.vibrate?.([30, 60, 30]);
  }, []);
  return (
    <div className="backdrop celebrate" onClick={onClose}>
      <div className="celebrate-card" role="dialog" aria-modal="true" aria-label={info.title} onClick={(e) => e.stopPropagation()}>
        <div className="celebrate-emoji" aria-hidden>
          {info.emoji}
        </div>
        <h2>{info.title}</h2>
        <p>{info.text}</p>
        <button className="btn primary block" onClick={onClose} autoFocus>
          Let’s go
        </button>
      </div>
    </div>
  );
}
