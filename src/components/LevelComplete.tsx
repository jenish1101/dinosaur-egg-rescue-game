import { useEffect, type CSSProperties } from 'react';
import { OUTLINE, type DinoKind, type MilestoneBaby } from '../game/dinos';
import { audio } from '../game/audio';
import { clamp, MAX_LEVELS } from '../game/levels';
import { useViewport } from '../hooks/useViewport';
import { DinoActor } from './DinoActor';
import { Confetti, Icon, RoundButton } from './ui';

function Star({ size, delay }: { size: number; delay: number }) {
  return (
    <svg viewBox="0 0 100 100" className="star-pop" style={{ width: size, height: size, '--delay': `${delay}s` } as CSSProperties} aria-hidden="true">
      <path
        d="M50 6 L62 36 L94 38 L69 58 L78 90 L50 72 L22 90 L31 58 L6 38 L38 36 Z"
        fill="#FFD447"
        stroke={OUTLINE}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <path d="M50 20 L57 38 L44 40 Z" fill="#FFF3B0" />
    </svg>
  );
}

export function LevelComplete({
  levelIndex,
  parents,
  need,
  onNext,
  onReplay,
  onHome,
  isFinal,
  milestoneBaby,
}: {
  levelIndex: number;
  parents: DinoKind[];
  need: Partial<Record<DinoKind, number>>;
  onNext: () => void;
  onReplay: () => void;
  onHome: () => void;
  isFinal: boolean;
  milestoneBaby?: MilestoneBaby;
}) {
  const vp = useViewport();
  const vmin = Math.min(vp.w, vp.h);
  const famW = Math.min((vp.w * 0.92) / parents.length, vmin * 0.3, vp.h * 0.26);
  const btn = clamp(vmin * 0.12, 52, 78);

  useEffect(() => {
    const timers = [0, 1, 2].map((i) => window.setTimeout(() => audio.sfx('star'), 450 + i * 250));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  return (
    <div
      className="fade-in fixed inset-0 z-[850] flex flex-col items-center justify-center gap-[2.2vh] overflow-hidden px-3"
      style={{ background: 'radial-gradient(circle at 50% 40%, rgba(255,250,222,0.97), rgba(255,208,140,0.95) 45%, rgba(116,78,170,0.96))' }}
    >
      <div className="rays" />
      <Confetti count={90} />
      <div className="banner-in outline-text relative font-bold leading-none text-white" style={{ fontSize: clamp(vmin * 0.14, 48, 120) }}>
        Hooray!
      </div>
      <div
        className="banner-in relative rounded-full border-4 border-ink bg-white px-5 py-1 text-center font-bold text-ink shadow-[0_4px_0_#3a2a4d]"
        style={{ fontSize: clamp(vmin * 0.045, 17, 32), '--delay': '0.2s' } as CSSProperties}
      >
        {isFinal ? `All ${MAX_LEVELS} islands rescued!` : 'All the babies are home!'}
      </div>
      <div className="relative flex gap-2">
        {[0, 1, 2].map((i) => (
          <Star key={i} size={clamp(vmin * 0.11, 44, 90)} delay={0.4 + i * 0.25} />
        ))}
      </div>
      {milestoneBaby && (
        <div
          className="banner-in relative flex items-center gap-2 rounded-3xl border-4 border-ink bg-white px-3 py-1 text-ink shadow-[0_5px_0_#3a2a4d]"
          style={{ '--delay': '0.55s' } as CSSProperties}
        >
          <div className="absolute -left-3 -top-3 rounded-full border-3 border-ink bg-amber-300 px-2 py-0.5 text-xs font-bold">
            NEW!
          </div>
          <div style={{ width: clamp(vmin * 0.17, 68, 120), height: clamp(vmin * 0.17, 68, 120), filter: `hue-rotate(${milestoneBaby.hue}deg) saturate(1.15)` }}>
            <DinoActor kind={milestoneBaby.kind} baby flip mood="happy" tapToAct className="h-full w-full" />
          </div>
          <div className="pr-2 text-left leading-tight">
            <div className="font-bold" style={{ fontSize: clamp(vmin * 0.045, 18, 30) }}>
              New baby found!
            </div>
            <div className="font-bold text-amber-600" style={{ fontSize: clamp(vmin * 0.038, 15, 24) }}>
              {milestoneBaby.name}
            </div>
            <div className="font-medium opacity-70" style={{ fontSize: clamp(vmin * 0.028, 12, 18) }}>
              Island {milestoneBaby.level} · {milestoneBaby.species}
            </div>
          </div>
        </div>
      )}
      <div className="relative flex items-end justify-center" style={{ gap: famW * 0.04 }}>
        {parents.map((k, i) => {
          const n = need[k] ?? 1;
          return (
            <div key={k} className="banner-in relative" style={{ width: famW, height: famW * 0.86, '--delay': `${0.5 + i * 0.12}s` } as CSSProperties}>
              <div className="absolute" style={{ left: 0, bottom: 0, width: famW * 0.8, height: famW * 0.8 }}>
                <DinoActor kind={k} mood="happy" tapToAct className="h-full w-full" />
              </div>
              {Array.from({ length: n }, (_, j) => (
                <div
                  key={j}
                  className="absolute"
                  style={{ right: j * famW * 0.2 - famW * 0.02, bottom: -famW * 0.02, width: famW * 0.42, height: famW * 0.42 }}
                >
                  <DinoActor kind={k} baby flip mood="happy" tapToAct className="h-full w-full" />
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="relative mt-1 flex items-center gap-3">
        <RoundButton label="Home" onClick={onHome} size={btn * 0.8}>
          <Icon name="home" className="h-[55%] w-[55%]" />
        </RoundButton>
        <RoundButton label="Play this island again" onClick={onReplay} size={btn * 0.8}>
          <Icon name="replay" className="h-[55%] w-[55%]" />
        </RoundButton>
        {isFinal ? (
          <div
            className="rounded-full border-4 border-ink bg-white px-5 font-bold text-ink shadow-[0_4px_0_#3a2a4d]"
            style={{ height: btn, display: 'grid', placeItems: 'center', fontSize: btn * 0.34 }}
          >
            You did it!
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              audio.sfx('tap');
              onNext();
            }}
            className="candy-btn btn-pulse flex items-center gap-2 rounded-full bg-lime-400 px-6 font-bold text-ink"
            style={{ height: btn, fontSize: btn * 0.4 }}
            aria-label={`Go to island ${levelIndex + 2}`}
          >
            Next
            <Icon name="next" className="h-[50%] w-auto" strokeWidth={3.4} />
          </button>
        )}
      </div>
    </div>
  );
}
