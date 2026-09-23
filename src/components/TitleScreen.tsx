import { useEffect, useState, type CSSProperties } from 'react';
import { DINOS, MILESTONE_BABIES, UNIQUE_BABIES, type DinoKind } from '../game/dinos';
import { audio } from '../game/audio';
import { clamp, MAX_LEVELS } from '../game/levels';
import type { Progress, Settings } from '../game/storage';
import { useViewport } from '../hooks/useViewport';
import { DinoActor } from './DinoActor';
import { Egg } from './Egg';
import { SettingsToggles } from './Hud';
import { Scenery } from './Scenery';
import { Icon } from './ui';

const LETTER_COLORS = ['#FF9A47', '#5DB2F2', '#62C24F', '#FFD447', '#A77FF2', '#FF89B7', '#3CC7BA'];

function TitleWord({ text, size, offset = 0 }: { text: string; size: number; offset?: number }) {
  let n = 0;
  return (
    <div className="flex items-end justify-center whitespace-nowrap font-bold leading-none" style={{ fontSize: size }}>
      {text.split('').map((ch, i) => {
        if (ch === ' ') return <span key={i} style={{ width: size * 0.3 }} />;
        const idx = n++;
        return (
          <span
            key={i}
            className="title-letter outline-text"
            style={
              {
                color: LETTER_COLORS[(idx + offset) % LETTER_COLORS.length],
                '--delay': `${(idx + offset) * 0.09}s`,
                '--tilt': `${idx % 2 ? 4 : -4}deg`,
                textShadow: `0 ${size * 0.06}px 0 rgba(58,42,77,0.35)`,
              } as CSSProperties
            }
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
}

const TITLE_DINOS: DinoKind[] = ['trex', 'brachio', 'croc'];

export function TitleScreen({
  progress,
  settings,
  onToggle,
  onPlay,
  onBook,
}: {
  progress: Progress;
  settings: Settings;
  onToggle: (k: keyof Settings) => void;
  onPlay: () => void;
  onBook: () => void;
}) {
  const vp = useViewport();
  const vmin = Math.min(vp.w, vp.h);
  const portrait = vp.h > vp.w;
  const horizon = vp.h * (portrait ? 0.54 : 0.58);
  const [signals, setSignals] = useState<Record<string, number>>({});

  useEffect(() => {
    let i = 0;
    const iv = window.setInterval(() => {
      const k = TITLE_DINOS[i++ % TITLE_DINOS.length];
      setSignals((s) => ({ ...s, [k]: (s[k] ?? 0) + 1 }));
    }, 3600);
    return () => window.clearInterval(iv);
  }, []);

  const hatchedKinds = UNIQUE_BABIES.filter((k) => (progress.hatched[k] ?? 0) > 0).length + (progress.milestoneBabies ?? []).length;
  const totalBabies = UNIQUE_BABIES.length + MILESTONE_BABIES.length;
  const titleSize = clamp(Math.min(vp.w * (portrait ? 0.145 : 0.12), vp.h * 0.11), 40, 120);
  const dinoS = Math.min(vp.w * (portrait ? 0.27 : 0.22), vp.h * 0.27, 290);
  const rowBottom = vp.h - (horizon + (vp.h - horizon) * (portrait ? 0.42 : 0.4));
  const playH = clamp(vmin * 0.15, 64, 110);

  return (
    <div className="fixed inset-0 overflow-hidden" onPointerUp={() => audio.unlock()}>
      <Scenery w={vp.w} h={vp.h} horizon={horizon} seed={11} />

      <div className="absolute right-3 top-3 z-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <SettingsToggles settings={settings} onToggle={onToggle} size={clamp(vmin * 0.075, 40, 54)} />
      </div>

      <div className="absolute inset-x-0 z-10 flex flex-col items-center" style={{ top: Math.max(vp.h * 0.07, 58) }}>
        <TitleWord text="Dinosaur" size={titleSize * 0.82} />
        <TitleWord text="Egg Rescue" size={titleSize} offset={3} />
        <div
          className="banner-in mt-3 rounded-full border-4 border-ink bg-white/95 px-4 py-1 text-center font-semibold text-ink shadow-[0_4px_0_#3a2a4d]"
          style={{ fontSize: clamp(vmin * 0.036, 14, 26), '--delay': '0.3s' } as CSSProperties}
        >
          Help every egg find its dino family!
        </div>
      </div>

      <div className="absolute inset-x-0 z-10 flex items-end justify-center" style={{ bottom: rowBottom, gap: dinoS * 0.16, paddingRight: dinoS * 0.16 }}>
        {TITLE_DINOS.map((k, i) => (
          <div key={k} className="relative" style={{ width: dinoS, height: dinoS }}>
            <DinoActor
              kind={k}
              mood="idle"
              voice={false}
              tapToAct
              actSignal={signals[k] ?? 0}
              onTap={() => {
                audio.dinoVoice(k, false);
                audio.speak(`${DINOS[k].species}!`);
                return false;
              }}
              className="h-full w-full"
            />
            <div
              className="pointer-events-none absolute"
              style={{ width: dinoS * 0.22, height: dinoS * 0.286, right: -dinoS * 0.19, bottom: -dinoS * 0.01 }}
            >
              <div className="egg-idle h-full w-full" style={{ '--wobble-delay': `${i * 1.1}s` } as CSSProperties}>
                <Egg kind={k} className="h-full w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="absolute inset-x-0 z-10 flex items-center justify-center gap-4 px-4"
        style={{ bottom: Math.max(vp.h * 0.05, 16) }}
      >
        <button
          type="button"
          onClick={() => {
            audio.unlock();
            audio.sfx('pop');
            onBook();
          }}
          className="candy-btn flex items-center gap-2 rounded-full bg-amber-300 px-4 font-bold text-ink"
          style={{ height: playH * 0.78, fontSize: playH * 0.24 }}
          aria-label="Open baby book"
        >
          <Icon name="book" className="h-[55%] w-auto" />
          <span className="flex flex-col items-start leading-none">
            <span>Babies</span>
            <span style={{ fontSize: playH * 0.18 }} className="opacity-75">
              {hatchedKinds}/{totalBabies}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            audio.unlock();
            audio.sfx('pop');
            onPlay();
          }}
          className="candy-btn btn-pulse flex items-center gap-3 rounded-full bg-lime-400 font-bold text-ink"
          style={{ height: playH, paddingLeft: playH * 0.34, paddingRight: playH * 0.44, fontSize: playH * 0.38 }}
          aria-label={`Play island ${Math.min(progress.level + 1, MAX_LEVELS)}`}
        >
          <span className="grid place-items-center rounded-full bg-white/70" style={{ width: playH * 0.66, height: playH * 0.66 }}>
            <Icon name="play" className="ml-[8%] h-[58%] w-[58%]" />
          </span>
          <span className="flex flex-col items-start leading-none">
            <span>Play</span>
            <span style={{ fontSize: playH * 0.19 }} className="mt-1 opacity-75">
              Island {Math.min(progress.level + 1, MAX_LEVELS)} of {MAX_LEVELS}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
