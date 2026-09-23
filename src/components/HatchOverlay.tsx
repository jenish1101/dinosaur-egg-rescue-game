import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { DINOS, type DinoKind } from '../game/dinos';
import { audio } from '../game/audio';
import { clamp } from '../game/levels';
import { useViewport } from '../hooks/useViewport';
import { DinoActor } from './DinoActor';
import { Egg, NestBack, NestFront } from './Egg';
import { Burst, Confetti, Hearts, Icon } from './ui';

export function HatchOverlay({ kind, onDone }: { kind: DinoKind; onDone: () => void }) {
  const vp = useViewport();
  const info = DINOS[kind];
  const [stage, setStage] = useState(0);
  const [babySignal, setBabySignal] = useState(0);
  const [canGo, setCanGo] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const autoTimer = useRef<number | undefined>(undefined);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    window.clearTimeout(autoTimer.current);
    onDoneRef.current();
  }, []);

  const armAuto = useCallback(
    (ms: number) => {
      window.clearTimeout(autoTimer.current);
      autoTimer.current = window.setTimeout(finish, ms);
    },
    [finish],
  );

  useEffect(() => {
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    audio.sfx('whoosh');
    at(750, () => {
      setStage(1);
      audio.sfx('crack');
    });
    at(1450, () => {
      setStage(2);
      audio.sfx('crack');
    });
    at(2150, () => {
      setStage(3);
      audio.sfx('hatch');
    });
    at(2500, () => setBabySignal(1));
    at(3000, () => audio.speak(`Yay! It's baby ${info.name}, the ${info.species}!`));
    at(3000, () => setCanGo(true));
    armAuto(8800);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(autoTimer.current);
    };
  }, [armAuto, info.name, info.species]);

  const vmin = Math.min(vp.w, vp.h);
  const stageW = Math.min(vp.w * 0.94, 780, vp.h * 1.15);
  const stageH = stageW * 0.62;
  const parentS = stageW * 0.46;
  const nestW = stageW * 0.46;
  const nestH = nestW * 0.5;
  const eggW = nestW * 0.4;
  const eggH = eggW * 1.3;
  const babyS = nestW * 0.66;
  const eggLeft = (nestW - eggW) / 2;
  const eggBottom = nestH * 0.32;

  return (
    <div
      className="hatch-backdrop fade-in fixed inset-0 z-[800] flex flex-col items-center justify-center overflow-hidden"
      onClick={() => canGo && finish()}
    >
      <div className="rays" />
      <div className="relative" style={{ width: stageW, height: stageH }}>
        <div className="absolute" style={{ left: 0, bottom: nestH * 0.16, width: parentS, height: parentS }}>
          <DinoActor kind={kind} mood={stage >= 3 ? 'happy' : 'curious'} className="h-full w-full" voice={false} />
          {stage >= 3 && <Hearts count={6} size={parentS * 0.13} />}
        </div>

        <div className="absolute" style={{ right: stageW * 0.02, bottom: 0, width: nestW, height: nestH }}>
          <NestBack className="absolute inset-0 h-full w-full" />
          {stage < 3 && (
            <div className="egg-enter absolute" style={{ width: eggW, height: eggH, left: eggLeft, bottom: eggBottom }}>
              <div className={`hatch-wobble-${stage} h-full w-full`}>
                <Egg kind={kind} crack={stage as 0 | 1 | 2} className="h-full w-full" />
              </div>
            </div>
          )}
          {stage >= 3 && (
            <>
              <div className="shell-bottom-fade absolute" style={{ width: eggW, height: eggH, left: eggLeft, bottom: eggBottom * 0.8 }}>
                <Egg kind={kind} half="bottom" className="h-full w-full" />
              </div>
              <div
                className="baby-emerge absolute"
                style={{ width: babyS, height: babyS, left: (nestW - babyS) / 2, bottom: nestH * 0.3 }}
              >
                <DinoActor
                  kind={kind}
                  baby
                  flip
                  actSignal={babySignal}
                  tapToAct
                  onTap={() => {
                    armAuto(7000);
                    return false;
                  }}
                  className="h-full w-full"
                />
              </div>
              <div className="shell-top-fly pointer-events-none absolute" style={{ width: eggW, height: eggH, left: eggLeft, bottom: eggBottom }}>
                <Egg kind={kind} half="top" className="h-full w-full" />
              </div>
              <div className="absolute" style={{ left: nestW / 2, bottom: eggBottom + eggH * 0.5, width: 0, height: 0 }}>
                <Burst size={eggW * 2.4} />
              </div>
            </>
          )}
          <NestFront className="pointer-events-none absolute inset-0 h-full w-full" />
        </div>
      </div>

      <div className="relative mt-[2.5vh] flex flex-col items-center gap-2 px-4 text-center" style={{ minHeight: clamp(vmin * 0.2, 90, 170) }}>
        {stage >= 3 ? (
          <>
            <div
              className="banner-in outline-text font-bold leading-none text-white"
              style={{ fontSize: clamp(vmin * 0.1, 36, 80), '--delay': '0.3s' } as CSSProperties}
            >
              Baby {info.name}!
            </div>
            <div
              className="banner-in rounded-full border-4 border-ink bg-white px-4 py-1 font-bold text-ink shadow-[0_4px_0_#3a2a4d]"
              style={{ fontSize: clamp(vmin * 0.04, 16, 28), '--delay': '0.55s' } as CSSProperties}
            >
              {info.species} · {info.trait}
            </div>
          </>
        ) : (
          <div className="wiggle-slow outline-text font-bold text-white" style={{ fontSize: clamp(vmin * 0.075, 28, 60) }}>
            {stage === 0 ? 'Wobble wobble…' : stage === 1 ? 'Crack!' : 'CRACK!'}
          </div>
        )}
      </div>

      {canGo && (
        <button
          type="button"
          aria-label="Continue"
          onClick={(e) => {
            e.stopPropagation();
            audio.sfx('tap');
            finish();
          }}
          className="candy-btn btn-pulse fade-in absolute grid place-items-center rounded-full bg-lime-400 text-ink"
          style={{ right: '4vw', bottom: '4vh', width: clamp(vmin * 0.16, 64, 104), height: clamp(vmin * 0.16, 64, 104) }}
        >
          <Icon name="next" className="h-1/2 w-1/2" strokeWidth={3.4} />
        </button>
      )}
      {stage >= 3 && <Confetti count={46} />}
    </div>
  );
}
