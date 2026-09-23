import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { audio } from '../game/audio';
import { cn } from '../utils/cn';

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

type IconName = 'home' | 'sound' | 'mute' | 'music' | 'voice' | 'book' | 'play' | 'replay' | 'next' | 'close' | 'gear' | 'hand';

export function Icon({ name, className, strokeWidth = 2.8 }: { name: IconName; className?: string; strokeWidth?: number }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  let body: ReactNode = null;
  switch (name) {
    case 'home':
      body = (
        <>
          <path d="M3 11.5 L12 4 L21 11.5" {...common} />
          <path d="M5.5 10 V20 H10 V14.5 H14 V20 H18.5 V10" {...common} />
        </>
      );
      break;
    case 'sound':
      body = (
        <>
          <path d="M4 9.5 H7.5 L12.5 5.5 V18.5 L7.5 14.5 H4 Z" {...common} fill="currentColor" />
          <path d="M15.5 9 Q 17.5 12 15.5 15 M18 6.5 Q 22 12 18 17.5" {...common} />
        </>
      );
      break;
    case 'mute':
      body = (
        <>
          <path d="M4 9.5 H7.5 L12.5 5.5 V18.5 L7.5 14.5 H4 Z" {...common} fill="currentColor" />
          <path d="M16 9.5 L21 14.5 M21 9.5 L16 14.5" {...common} />
        </>
      );
      break;
    case 'music':
      body = (
        <>
          <path d="M9 17.5 V5.5 L19.5 3.5 V15.5" {...common} />
          <circle cx={6.5} cy={17.5} r={2.8} fill="currentColor" />
          <circle cx={17} cy={15.5} r={2.8} fill="currentColor" />
        </>
      );
      break;
    case 'voice':
      body = (
        <>
          <path d="M4 5 H20 V15 H11 L6.5 19 V15 H4 Z" {...common} />
          <path d="M8 9 H16 M8 12 H13" {...common} />
        </>
      );
      break;
    case 'book':
      body = (
        <>
          <path d="M3.5 5.5 C 6.5 4.5, 9.5 4.5, 12 6.5 C 14.5 4.5, 17.5 4.5, 20.5 5.5 V19 C 17.5 18, 14.5 18, 12 20 C 9.5 18, 6.5 18, 3.5 19 Z" {...common} />
          <path d="M12 6.5 V20" {...common} />
        </>
      );
      break;
    case 'play':
      body = <path d="M8 4.5 L19.5 12 L8 19.5 Z" {...common} fill="currentColor" />;
      break;
    case 'replay':
      body = (
        <>
          <path d="M5 12.5 A 7.5 7.5 0 1 0 7.6 6.8" {...common} />
          <path d="M4.5 3.5 V8.5 H9.5" {...common} />
        </>
      );
      break;
    case 'next':
      body = <path d="M4.5 12 H19 M13 6 L19 12 L13 18" {...common} />;
      break;
    case 'close':
      body = <path d="M6 6 L18 18 M18 6 L6 18" {...common} />;
      break;
    case 'gear':
      body = (
        <>
          <path d="M4 7 H20 M4 12 H20 M4 17 H20" {...common} />
          <circle cx={9} cy={7} r={2.2} fill="currentColor" />
          <circle cx={15} cy={12} r={2.2} fill="currentColor" />
          <circle cx={8} cy={17} r={2.2} fill="currentColor" />
        </>
      );
      break;
    case 'hand':
      body = (
        <path
          d="M9 11 V4.5 a1.6 1.6 0 0 1 3.2 0 V10 M12.2 9.5 V8.3 a1.6 1.6 0 0 1 3.2 0 V10.5 M15.4 10 a1.6 1.6 0 0 1 3.2 0 V15 c0 3.5 -2.5 6 -6 6 h-1 c-2.2 0 -3.6 -1 -4.8 -2.6 L4 14.6 a1.6 1.6 0 0 1 2.5 -2 L9 15"
          {...common}
          fill="#fff"
        />
      );
      break;
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {body}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

export function RoundButton({
  onClick,
  label,
  color = '#FFFFFF',
  size = 52,
  children,
  className,
  style,
  silent,
}: {
  onClick?: () => void;
  label: string;
  color?: string;
  size?: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  silent?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        audio.unlock();
        if (!silent) audio.sfx('tap');
        onClick?.();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn('candy-btn grid shrink-0 place-items-center rounded-full text-ink', className)}
      style={{ width: size, height: size, background: color, ...style }}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Effects                                                             */
/* ------------------------------------------------------------------ */

const CONFETTI_COLORS = ['#FF6B8B', '#FFD447', '#5DB2F2', '#62C24F', '#A77FF2', '#FF9A47', '#3CC7BA', '#FFFFFF'];

export function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const round = Math.random() > 0.7;
        const w = 8 + Math.random() * 9;
        return {
          left: Math.random() * 100,
          delay: Math.random() * 0.9,
          dur: 2.4 + Math.random() * 1.8,
          dx: `${(Math.random() - 0.5) * 30}vw`,
          rot: `${Math.random() * 1080 - 540}deg`,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          w,
          h: round ? w : 10 + Math.random() * 10,
          round,
        };
      }),
    [count],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[900] overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="confetti"
          style={
            {
              left: `${p.left}%`,
              width: p.w,
              height: p.h,
              borderRadius: p.round ? '50%' : 3,
              background: p.color,
              border: '1.5px solid rgba(58,42,77,0.35)',
              '--delay': `${p.delay}s`,
              '--dur': `${p.dur}s`,
              '--dx': p.dx,
              '--rot': p.rot,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function Hearts({ count = 5, size = 22, char = '♥', color }: { count?: number; size?: number; char?: string; color?: string }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: 30 + Math.random() * 40,
        dx: (Math.random() - 0.5) * size * 3,
        delay: i * 0.22 + Math.random() * 0.1,
        s: 0.8 + Math.random() * 0.6,
      })),
    [count, size],
  );
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {items.map((h, i) => (
        <span
          key={i}
          className="float-heart"
          style={
            {
              left: `${h.left}%`,
              top: '30%',
              fontSize: size * h.s,
              color,
              '--dx': `${h.dx}px`,
              '--delay': `${h.delay}s`,
            } as CSSProperties
          }
        >
          {char}
        </span>
      ))}
    </div>
  );
}

export function Burst({ size = 200, colors = CONFETTI_COLORS }: { size?: number; colors?: string[] }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
        const d = size * (0.55 + Math.random() * 0.35);
        return {
          dx: `${Math.cos(a) * d}px`,
          dy: `${Math.sin(a) * d}px`,
          rot: `${Math.random() * 360}deg`,
          c: colors[i % colors.length],
          s: size * (0.1 + Math.random() * 0.08),
          ch: i % 3 === 0 ? '♥' : '★',
        };
      }),
    [size, colors],
  );
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden="true">
      <div className="burst-ring" style={{ width: size * 0.6, height: size * 0.6, left: 0, top: 0 }} />
      {stars.map((s, i) => (
        <span
          key={i}
          className="burst-star"
          style={{ left: 0, top: 0, fontSize: s.s, color: s.c, '--dx': s.dx, '--dy': s.dy, '--rot': s.rot } as CSSProperties}
        >
          {s.ch}
        </span>
      ))}
    </div>
  );
}
