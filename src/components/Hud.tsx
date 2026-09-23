import { useState } from 'react';
import type { EggState } from '../game/levels';
import { clamp, MAX_LEVELS } from '../game/levels';
import type { Settings } from '../game/storage';
import { audio } from '../game/audio';
import { Dino } from './Dino';
import { Egg, GhostEgg } from './Egg';
import { Icon, RoundButton } from './ui';
import { cn } from '../utils/cn';

function MiniStatus({ egg, size }: { egg: EggState; size: number }) {
  if (egg.status === 'done') {
    return (
      <div className="baby-pop relative grid place-items-center rounded-full bg-amber-200" style={{ width: size * 1.1, height: size * 1.1 }}>
        <Dino kind={egg.kind} baby mood="happy" className="no-anim h-[92%] w-[92%]" />
      </div>
    );
  }
  return (
    <div className="grid place-items-center" style={{ width: size * 0.8, height: size * 1.04 }}>
      {egg.revealed ? <Egg kind={egg.kind} className="h-full w-full" /> : <GhostEgg className="h-full w-full" />}
    </div>
  );
}

export function SettingsToggles({
  settings,
  onToggle,
  size = 48,
  vertical,
}: {
  settings: Settings;
  onToggle: (k: keyof Settings) => void;
  size?: number;
  vertical?: boolean;
}) {
  const items: { k: keyof Settings; label: string; icon: 'sound' | 'mute' | 'music' | 'voice' }[] = [
    { k: 'sfx', label: 'Sounds', icon: settings.sfx ? 'sound' : 'mute' },
    { k: 'music', label: 'Music', icon: 'music' },
    { k: 'voice', label: 'Voice', icon: 'voice' },
  ];
  return (
    <div className={cn('flex gap-2', vertical ? 'flex-col' : 'flex-row')}>
      {items.map((it) => {
        const on = settings[it.k];
        return (
          <button
            key={it.k}
            type="button"
            aria-pressed={on}
            aria-label={`${it.label} ${on ? 'on' : 'off'}`}
            onClick={(e) => {
              e.stopPropagation();
              audio.unlock();
              audio.sfx('tap');
              onToggle(it.k);
            }}
            className={cn(
              'candy-btn flex items-center gap-2 rounded-full font-bold text-ink',
              vertical ? 'justify-start pr-4 pl-2' : 'justify-center',
              on ? 'bg-white' : 'bg-slate-300',
            )}
            style={{ height: size, minWidth: size, fontSize: size * 0.34 }}
          >
            <span className="relative grid place-items-center" style={{ width: size * 0.62, height: size * 0.62 }}>
              <Icon name={it.icon} className="h-full w-full" />
              {!on && it.k !== 'sfx' && (
                <span className="absolute inset-0 grid place-items-center">
                  <span className="block h-[3px] w-[120%] rotate-45 rounded bg-rose-500" />
                </span>
              )}
            </span>
            {vertical && <span>{it.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Hud({
  height,
  width,
  levelIndex,
  eggs,
  settings,
  onToggle,
  onHome,
}: {
  height: number;
  width: number;
  levelIndex: number;
  eggs: EggState[];
  settings: Settings;
  onToggle: (k: keyof Settings) => void;
  onHome: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btn = clamp(height * 0.74, 42, 60);
  const showText = width >= 540;
  const textW = showText ? btn * 2.3 : 0;
  const mini = clamp((width - btn * 2 - 70 - textW) / Math.max(1, eggs.length) - 6, 16, btn * 0.66);
  return (
    <div
      className="absolute inset-x-0 top-0 z-[600] flex items-center justify-between gap-2 px-3"
      style={{ height, paddingTop: 'env(safe-area-inset-top)' }}
    >
      <RoundButton label="Home" onClick={onHome} size={btn}>
        <Icon name="home" className="h-[56%] w-[56%]" />
      </RoundButton>
      <div
        className="flex min-w-0 items-center gap-2 rounded-full border-4 border-ink bg-white/90 px-3 shadow-[0_4px_0_#3a2a4d]"
        style={{ height: btn * 1.02 }}
      >
        {showText && (
          <span className="whitespace-nowrap font-bold text-ink" style={{ fontSize: btn * 0.38 }}>
            Island {Math.min(levelIndex + 1, MAX_LEVELS)} / {MAX_LEVELS}
          </span>
        )}
        <div className="flex items-center" style={{ gap: Math.max(2, mini * 0.18) }}>
          {eggs.map((e) => (
            <MiniStatus key={e.id + e.status + e.revealed} egg={e} size={mini} />
          ))}
        </div>
      </div>
      <div className="relative">
        <RoundButton label="Settings" onClick={() => setOpen((o) => !o)} size={btn} color={open ? '#FFE27A' : '#FFFFFF'}>
          <Icon name="gear" className="h-[56%] w-[56%]" />
        </RoundButton>
        {open && (
          <div className="fade-in absolute right-0 top-full mt-3 rounded-3xl border-4 border-ink bg-sky-100 p-3 shadow-[0_6px_0_#3a2a4d]">
            <SettingsToggles settings={settings} onToggle={onToggle} size={btn * 0.9} vertical />
          </div>
        )}
      </div>
    </div>
  );
}
