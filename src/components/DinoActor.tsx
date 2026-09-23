import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { DINOS, type DinoKind } from '../game/dinos';
import { audio } from '../game/audio';
import { Dino, type DinoMood } from './Dino';
import { cn } from '../utils/cn';

function DinoFx({ kind, flip }: { kind: DinoKind; flip?: boolean }) {
  const info = DINOS[kind];
  const particles = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        dx: `${(Math.random() * 40 + 5) * (flip ? -1 : 1)}cqw`,
        dy: `${-(22 + Math.random() * 30)}cqw`,
        rot: `${Math.random() * 60 - 30}deg`,
        delay: `${0.1 + i * 0.16}s`,
      })),
    [flip],
  );
  const x = flip ? 100 - info.fx.x / 2 : info.fx.x / 2;
  const left = `${Math.min(76, Math.max(24, x))}%`;
  const top = `${info.fx.y / 2}%`;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="fx-word" style={{ left, top, animationDuration: `${Math.max(1300, info.actionMs)}ms` }}>
        {info.word}
      </div>
      {particles.map((p, i) => (
        <span
          key={i}
          className="fx-particle"
          style={
            {
              left,
              top,
              color: info.particleColor,
              '--dx': p.dx,
              '--dy': p.dy,
              '--rot': p.rot,
              '--delay': p.delay,
            } as CSSProperties
          }
        >
          {info.particle}
        </span>
      ))}
    </div>
  );
}

export interface DinoActorProps {
  kind: DinoKind;
  baby?: boolean;
  mood?: DinoMood;
  shaking?: boolean;
  look?: { x: number; y: number };
  /** changing this number (non-zero) triggers the personality action */
  actSignal?: number;
  tapToAct?: boolean;
  /** return true to prevent the default tap action */
  onTap?: () => boolean | void;
  voice?: boolean;
  flip?: boolean;
  className?: string;
  style?: CSSProperties;
}

export const DinoActor = memo(function DinoActor({
  kind,
  baby = false,
  mood = 'idle',
  shaking = false,
  look,
  actSignal = 0,
  tapToAct = false,
  onTap,
  voice = true,
  flip = false,
  className,
  style,
}: DinoActorProps) {
  const [act, setAct] = useState(0);
  const [acting, setActing] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const info = DINOS[kind];

  const trigger = useCallback(() => {
    window.clearTimeout(timer.current);
    setAct((a) => a + 1);
    setActing(true);
    if (voice) audio.dinoVoice(kind, baby);
    timer.current = window.setTimeout(() => setActing(false), info.actionMs + 60);
  }, [kind, baby, voice, info.actionMs]);

  const lastSignal = useRef(actSignal);
  useEffect(() => {
    if (actSignal && actSignal !== lastSignal.current) trigger();
    lastSignal.current = actSignal;
  }, [actSignal, trigger]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div
      className={cn('dino-actor relative', (tapToAct || onTap) && 'cursor-pointer', className)}
      style={style}
      onClick={
        tapToAct || onTap
          ? (e) => {
              e.stopPropagation();
              audio.unlock();
              const handled = onTap?.();
              if (!handled && tapToAct) trigger();
            }
          : undefined
      }
    >
      <div className="h-full w-full" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
        <Dino
          key={act}
          kind={kind}
          baby={baby}
          mood={acting ? (mood === 'sad' ? 'idle' : mood === 'happy' ? 'idle' : mood) : mood}
          acting={acting}
          shaking={shaking}
          look={look}
          className="h-full w-full"
        />
      </div>
      {acting && <DinoFx key={act} kind={kind} flip={flip} />}
    </div>
  );
});
