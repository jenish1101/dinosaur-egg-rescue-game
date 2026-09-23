import { useState, type CSSProperties } from 'react';
import { DINOS, MILESTONE_BABIES, UNIQUE_BABIES, type DinoKind, type MilestoneBaby } from '../game/dinos';
import { audio } from '../game/audio';
import { clamp } from '../game/levels';
import type { Progress } from '../game/storage';
import { useViewport } from '../hooks/useViewport';
import { DinoActor } from './DinoActor';
import { Egg } from './Egg';
import { Icon, RoundButton } from './ui';

function mix(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const m = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`;
}

function BookCard({ kind, count, index, small, bonus }: { kind: DinoKind; count: number; index: number; small: boolean; bonus?: MilestoneBaby }) {
  const info = DINOS[kind];
  const [sig, setSig] = useState(0);
  const unlocked = bonus ? count > 0 : count > 0;
  const name = bonus?.name ?? info.name;
  const species = bonus?.species ?? info.species;
  const trait = bonus?.trait ?? info.trait;
  const hue = bonus?.hue ?? 0;
  const tint = bonus ? `hue-rotate(${hue}deg) saturate(1.15)` : undefined;
  return (
    <button
      type="button"
      className="book-card banner-in relative flex min-h-0 flex-col items-center justify-between rounded-3xl border-4 border-ink p-2 text-ink shadow-[0_5px_0_#3a2a4d]"
      style={{ background: unlocked ? mix(info.pal.body, 0.72) : '#ECE6F3', '--delay': `${index * 0.05}s` } as CSSProperties}
      onClick={() => {
        audio.unlock();
        if (!unlocked) {
          audio.sfx('tap');
          audio.speak(bonus ? `Find Island ${bonus.level} to meet ${name}!` : `This ${info.eggDesc} egg is still waiting to be found!`, { force: true });
          return;
        }
        setSig((s) => s + 1);
        window.setTimeout(() => audio.speak(bonus?.hello ?? info.hello, { force: true }), 500);
      }}
      aria-label={unlocked ? `${name} the ${species}` : bonus ? `Island ${bonus.level} baby` : 'Mystery egg'}
    >
      <div className="relative min-h-0 w-full flex-1">
        {unlocked ? (
          <DinoActor kind={kind} baby actSignal={sig} style={{ filter: tint }} className="absolute inset-0 h-full w-full" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative max-w-full" style={{ height: '78%', aspectRatio: '100 / 130' }}>
              <div className="egg-idle h-full w-full" style={{ filter: tint }}>
                <Egg kind={kind} className="h-full w-full" />
              </div>
              <span
                className="outline-text absolute inset-0 grid place-items-center font-bold text-white"
                style={{ fontSize: small ? 30 : 44 }}
              >
                ?
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="mt-1 text-center leading-tight">
        <div className="font-bold" style={{ fontSize: small ? 17 : 22 }}>
          {unlocked ? name : bonus ? `Island ${bonus.level}` : '???'}
        </div>
        <div className="font-medium opacity-75" style={{ fontSize: small ? 12 : 15 }}>
          {unlocked ? `${species} · ${trait}` : bonus ? 'New baby waiting' : 'Not hatched yet'}
        </div>
      </div>
      {unlocked && !bonus && (
        <div className="absolute right-2 top-2 rounded-full border-[3px] border-ink bg-white px-2 font-bold" style={{ fontSize: small ? 12 : 15 }}>
          ×{count}
        </div>
      )}
    </button>
  );
}

export function BabyBook({ progress, onClose, onReset }: { progress: Progress; onClose: () => void; onReset: () => void }) {
  const vp = useViewport();
  const landscape = vp.w > vp.h;
  const cols = landscape ? 4 : 2;
  const small = Math.min(vp.w, vp.h) < 500;
  const uniqueFound = UNIQUE_BABIES.filter((k) => (progress.hatched[k] ?? 0) > 0).length;
  const milestoneFound = (progress.milestoneBabies ?? []).length;
  const count = uniqueFound + milestoneFound;
  const total = UNIQUE_BABIES.length + MILESTONE_BABIES.length;
  const btn = clamp(Math.min(vp.w, vp.h) * 0.11, 44, 60);
  return (
    <div
      className="fade-in fixed inset-0 z-[950] flex flex-col"
      style={{
        backgroundColor: '#FFF4DE',
        backgroundImage: 'radial-gradient(#F1D9AC 1.6px, transparent 1.6px)',
        backgroundSize: '22px 22px',
      }}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 px-3 py-2" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <RoundButton label="Close baby book" onClick={onClose} size={btn}>
          <Icon name="close" className="h-1/2 w-1/2" />
        </RoundButton>
        <h1 className="outline-text m-0 text-center font-bold leading-none text-amber-400" style={{ fontSize: clamp(vp.w * 0.065, 26, 54) }}>
          My Baby Dinos
        </h1>
        <div
          className="grid shrink-0 place-items-center rounded-full border-4 border-ink bg-white font-bold text-ink shadow-[0_4px_0_#3a2a4d]"
          style={{ height: btn, minWidth: btn * 1.3, fontSize: btn * 0.34 }}
        >
          {count}/{total}
        </div>
      </header>
      <div
        className="grid min-h-0 flex-1 gap-3 overflow-y-auto px-3 pb-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridAutoRows: landscape ? 'minmax(170px, 1fr)' : 'minmax(190px, 1fr)',
          touchAction: 'pan-y',
        }}
      >
        {UNIQUE_BABIES.map((k, i) => (
          <BookCard key={k} kind={k} count={progress.hatched[k] ?? 0} index={i} small={small} />
        ))}
        {MILESTONE_BABIES.map((baby, i) => (
          <BookCard
            key={baby.id}
            kind={baby.kind}
            count={(progress.milestoneBabies ?? []).includes(baby.level) ? 1 : 0}
            index={UNIQUE_BABIES.length + i}
            small={small}
            bonus={baby}
          />
        ))}
      </div>
      <footer className="flex shrink-0 items-center justify-between px-4 py-2 text-ink/70" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <span className="text-sm font-medium">Tap a baby to say hi!</span>
        <button
          type="button"
          className="rounded-full border-2 border-ink/30 bg-white/60 px-3 py-1 text-xs font-semibold text-ink/70"
          onClick={() => {
            if (window.confirm('Grown-ups: reset all islands and hatched babies?')) onReset();
          }}
        >
          Reset progress
        </button>
      </footer>
    </div>
  );
}
