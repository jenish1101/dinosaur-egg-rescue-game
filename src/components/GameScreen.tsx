import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react';
import { DINOS, MILESTONE_BABIES, type DinoKind } from '../game/dinos';
import { audio } from '../game/audio';
import { buildLevel, clamp, computeLayout, NEST_W, NEST_X, type EggState, type HiderState, type LevelState } from '../game/levels';
import type { Settings } from '../game/storage';
import { useViewport } from '../hooks/useViewport';
import { cn } from '../utils/cn';
import { DinoActor } from './DinoActor';
import { Egg, GhostEgg, NestBack, NestFront } from './Egg';
import { HatchOverlay } from './HatchOverlay';
import { Critter, HiderArt } from './Hider';
import { Hud } from './Hud';
import { LevelComplete } from './LevelComplete';
import { Scenery } from './Scenery';
import { Icon } from './ui';

type Phase = 'intro' | 'play' | 'hatch' | 'done';

interface Hint {
  type: 'egg' | 'hider' | 'hand';
  id: string;
  n: number;
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  kind?: DinoKind;
}

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const WRONG_LINES = ["Hmm, that's not my egg!", 'Oops! Not my egg. Try another dino!', 'Uh-oh! This egg belongs to someone else.'];
const FOUND_LINES = ['You found an egg!', 'Peekaboo! An egg!', 'Great finding! An egg!'];
const CRITTER_LINES: Record<string, string> = {
  butterfly: 'Oh, a butterfly! No egg here.',
  frog: 'Ribbit! Just a froggy. Keep looking!',
  ladybug: 'A little ladybug! No egg here.',
};

function introLine(levelIndex: number, level: LevelState) {
  if (levelIndex === 0) return 'Oh no! The dino eggs got lost! Can you bring each egg to its dino family?';
  const hidden = level.eggs.some((e) => e.hiderId);
  const twins = level.eggs.length > level.parents.length;
  if (levelIndex === 1 && hidden) return 'Some eggs are hiding! Tap the bushes and rocks to find them.';
  if (levelIndex === 3 && twins) return 'Look! Some dinos have two eggs this time!';
  return pick(["Let's find all the eggs!", 'Where did the eggs go? Let\'s help!', 'The dinos need your help again!']);
}

function Leaves() {
  const leaves = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = -Math.PI / 2 + (i - 2.5) * 0.5;
        return {
          dx: `${Math.cos(a) * 160}%`,
          dy: `${Math.sin(a) * 220}%`,
          rot: `${Math.random() * 360}deg`,
          left: 30 + Math.random() * 40,
        };
      }),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0">
      {leaves.map((l, i) => (
        <span key={i} className="leaf-burst" style={{ left: `${l.left}%`, top: '35%', '--dx': l.dx, '--dy': l.dy, '--rot': l.rot } as CSSProperties} />
      ))}
    </div>
  );
}

const LOOK_UP = { x: 0.2, y: -0.9 };

function Thought({ missing, size }: { missing: number; size: number }) {
  const s = size * 0.3;
  return (
    <div className="thought" style={{ left: size * 0.7, top: -size * 0.1 }}>
      <div className="thought-bubble flex items-center gap-[2px] px-[6px] py-[4px]">
        {Array.from({ length: Math.min(2, missing) }, (_, i) => (
          <div key={i} style={{ width: s * 0.62, height: s * 0.8 }}>
            <GhostEgg className="block h-full w-full" />
          </div>
        ))}
      </div>
      <div className="thought-bubble absolute" style={{ width: s * 0.22, height: s * 0.22, left: s * 0.08, bottom: -s * 0.2 }} />
      <div className="thought-bubble absolute" style={{ width: s * 0.13, height: s * 0.13, left: -s * 0.04, bottom: -s * 0.38 }} />
    </div>
  );
}

function HandDemo({ hint, size }: { hint: Hint; size: number }) {
  if (!hint.from || !hint.to || !hint.kind) return null;
  const style = {
    '--fx': `${hint.from.x - size * 0.3}px`,
    '--fy': `${hint.from.y - size * 0.1}px`,
    '--tx': `${hint.to.x - size * 0.3}px`,
    '--ty': `${hint.to.y - size * 0.1}px`,
  } as CSSProperties;
  return (
    <div className="hand-demo" style={style}>
      <div className="relative" style={{ width: size, height: size }}>
        <div className="hand-ghost absolute" style={{ left: -size * 0.35, top: -size * 0.75, width: size * 0.62, height: size * 0.8 }}>
          <Egg kind={hint.kind} className="h-full w-full" />
        </div>
        <Icon name="hand" className="h-full w-full text-ink drop-shadow-[0_3px_0_rgba(58,42,77,0.35)]" strokeWidth={1.6} />
      </div>
    </div>
  );
}

export interface GameScreenProps {
  levelIndex: number;
  settings: Settings;
  onToggle: (k: keyof Settings) => void;
  onHatch: (kind: DinoKind) => void;
  onComplete: (levelIndex: number) => void;
  onHome: () => void;
  onNext: () => void;
  onReplay: () => void;
}

export function GameScreen({ levelIndex, settings, onToggle, onHatch, onComplete, onHome, onNext, onReplay }: GameScreenProps) {
  const vp = useViewport();
  const [seed] = useState(() => (Math.random() * 1e9) | 0);
  const level = useMemo(() => buildLevel(levelIndex, seed), [levelIndex, seed]);
  const layout = useMemo(
    () => computeLayout(vp.w, vp.h, level.itemCount, level.parents.length, seed),
    [vp.w, vp.h, level, seed],
  );

  const [eggs, setEggs] = useState<EggState[]>(level.eggs);
  const [hiders, setHiders] = useState<HiderState[]>(level.hiders);
  const [got, setGot] = useState<Partial<Record<DinoKind, number>>>({});
  const [phase, setPhase] = useState<Phase>('intro');
  const [selected, setSelected] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [hover, setHover] = useState<DinoKind | null>(null);
  const [shake, setShake] = useState<DinoKind | null>(null);
  const [hatching, setHatching] = useState<{ eggId: string; kind: DinoKind } | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [parentSignals, setParentSignals] = useState<Partial<Record<DinoKind, number>>>({});
  const [newBaby, setNewBaby] = useState<DinoKind | null>(null);
  const [leafBurst, setLeafBurst] = useState<{ id: string; n: number } | null>(null);

  const eggsRef = useRef(eggs);
  eggsRef.current = eggs;
  const hidersRef = useRef(hiders);
  hidersRef.current = hiders;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const gotRef = useRef(got);
  gotRef.current = got;

  const movers = useRef(new Map<string, HTMLDivElement>());
  const itemEls = useRef(new Map<string, HTMLDivElement>());
  const parentEls = useRef(new Map<DinoKind, HTMLDivElement>());
  const nestEls = useRef(new Map<DinoKind, HTMLDivElement>());
  const dragRef = useRef<{ id: string; pid: number; sx: number; sy: number; moved: boolean } | null>(null);
  const hoverRef = useRef<DinoKind | null>(null);
  const lastAct = useRef(Date.now());
  const foundCount = useRef(0);
  const hiderHintSpoken = useRef(false);
  const timers = useRef<number[]>([]);

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const delivered = eggs.filter((e) => e.status === 'done').length;
  const tutorial = levelIndex === 0 && delivered === 0;
  const milestoneBaby = (levelIndex + 1) % 10 === 0 ? MILESTONE_BABIES[(levelIndex + 1) / 10 - 1] : undefined;

  const mark = useCallback(() => {
    lastAct.current = Date.now();
    setHint((h) => (h ? null : h));
  }, []);

  /* ------------------------------ intro ------------------------------ */
  useEffect(() => {
    const line = introLine(levelIndex, level);
    const t1 = window.setTimeout(() => audio.speak(line), 350);
    const t2 = window.setTimeout(() => {
      setPhase('play');
      lastAct.current = Date.now();
    }, 2300);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [levelIndex, level]);

  /* ------------------------------ hints ------------------------------ */
  useEffect(() => {
    if (phase !== 'play') return;
    const iv = window.setInterval(() => {
      if (dragRef.current || selectedRef.current) return;
      const idle = Date.now() - lastAct.current;
      if (idle < (tutorial ? 2600 : 9000)) return;
      lastAct.current = Date.now();
      const visible = eggsRef.current.filter((e) => e.revealed && e.status === 'map');
      if (tutorial && visible.length) {
        const e = visible[0];
        const ie = itemEls.current.get(e.id);
        const pe = parentEls.current.get(e.kind);
        if (ie && pe) {
          const ir = ie.getBoundingClientRect();
          const pr = pe.getBoundingClientRect();
          setHint({
            type: 'hand',
            id: e.id,
            n: Date.now(),
            kind: e.kind,
            from: { x: ir.left + ir.width * 0.5, y: ir.top + ir.height * 0.55 },
            to: { x: pr.left + pr.width * 0.5, y: pr.top + pr.height * 0.45 },
          });
          return;
        }
      }
      if (visible.length) {
        const e = pick(visible);
        setHint({ type: 'egg', id: e.id, n: Date.now() });
        audio.sfx('sparkle');
        return;
      }
      const hidden = eggsRef.current.find((e) => !e.revealed && e.hiderId);
      if (hidden?.hiderId) {
        setHint({ type: 'hider', id: hidden.hiderId, n: Date.now() });
        audio.sfx('rustle');
        if (!hiderHintSpoken.current) {
          hiderHintSpoken.current = true;
          audio.speak('Something is wiggling over there! Tap it!');
        }
      }
    }, 700);
    return () => window.clearInterval(iv);
  }, [phase, tutorial]);

  /* ----------------------------- dragging ----------------------------- */
  const hitParent = useCallback((cx: number, cy: number): DinoKind | null => {
    let best: DinoKind | null = null;
    let bestD = Infinity;
    parentEls.current.forEach((el, kind) => {
      const r = el.getBoundingClientRect();
      const padX = r.width * 0.04;
      const padY = r.height * 0.18;
      if (cx >= r.left - padX && cx <= r.right + padX && cy >= r.top - padY && cy <= r.bottom + padY) {
        const d = Math.hypot(cx - (r.left + r.width / 2), cy - (r.top + r.height / 2));
        if (d < bestD) {
          bestD = d;
          best = kind;
        }
      }
    });
    return best;
  }, []);

  const returnEgg = useCallback((id: string) => {
    const m = movers.current.get(id);
    if (!m) return;
    m.style.transition = 'transform 0.45s cubic-bezier(.3,1.6,.5,1)';
    m.style.transform = 'translate(0px, 0px)';
  }, []);

  const deliver = useCallback(
    (id: string, kind: DinoKind) => {
      const egg = eggsRef.current.find((e) => e.id === id);
      if (!egg || egg.status !== 'map' || phaseRef.current !== 'play') return;
      mark();
      setSelected(null);
      if (egg.kind !== kind) {
        audio.sfx('wrong');
        const info = DINOS[egg.kind];
        audio.speak(egg.wrong >= 1 ? `Look closely! This egg is ${info.eggDesc}. Which dino looks like that?` : pick(WRONG_LINES), {
          force: true,
        });
        setEggs((es) => es.map((e) => (e.id === id ? { ...e, wrong: e.wrong + 1 } : e)));
        setShake(kind);
        later(800, () => setShake((s) => (s === kind ? null : s)));
        returnEgg(id);
        return;
      }
      setEggs((es) => es.map((e) => (e.id === id ? { ...e, status: 'flying' } : e)));
      audio.sfx('right');
      const m = movers.current.get(id);
      const item = itemEls.current.get(id);
      const nest = nestEls.current.get(kind);
      if (m && item && nest) {
        const ir = item.getBoundingClientRect();
        const nr = nest.getBoundingClientRect();
        const tx = nr.left + nr.width / 2 - (ir.left + ir.width / 2);
        const ty = nr.top + nr.height * 0.15 - (ir.top + ir.height / 2);
        m.style.transition = 'transform 0.6s cubic-bezier(.45,-0.3,.35,1.2)';
        m.style.transform = `translate(${tx}px, ${ty}px) scale(0.5)`;
      }
      later(640, () => {
        setHatching({ eggId: id, kind });
        setPhase('hatch');
      });
    },
    [mark, later, returnEgg],
  );

  const onEggDown = (e: RPointerEvent<HTMLDivElement>, id: string) => {
    if (phaseRef.current !== 'play' || dragRef.current) return;
    const egg = eggsRef.current.find((x) => x.id === id);
    if (!egg || egg.status !== 'map' || !egg.revealed) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    audio.unlock();
    dragRef.current = { id, pid: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false };
    e.currentTarget.style.transition = 'none';
    setDragId(id);
    mark();
    audio.sfx('pickup');
  };

  const onEggMove = (e: RPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pid !== e.pointerId) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 9) {
      d.moved = true;
      setSelected(null);
    }
    if (!d.moved) return;
    const m = movers.current.get(d.id);
    if (m) m.style.transform = `translate(${dx}px, ${dy}px) scale(1.15) rotate(${clamp(dx * 0.04, -12, 12)}deg)`;
    const hp = hitParent(e.clientX, e.clientY);
    if (hp !== hoverRef.current) {
      hoverRef.current = hp;
      setHover(hp);
      if (hp) audio.sfx('tap');
    }
  };

  const endDrag = (e: RPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = dragRef.current;
    if (!d || d.pid !== e.pointerId) return;
    dragRef.current = null;
    setDragId(null);
    hoverRef.current = null;
    setHover(null);
    lastAct.current = Date.now();
    if (d.moved && !cancelled) {
      const target = hitParent(e.clientX, e.clientY);
      if (target) deliver(d.id, target);
      else {
        returnEgg(d.id);
        audio.sfx('drop');
      }
    } else if (d.moved) {
      returnEgg(d.id);
    } else {
      returnEgg(d.id);
      setSelected((s) => (s === d.id ? null : d.id));
    }
  };

  /* ----------------------------- hiders ----------------------------- */
  const tapHider = (id: string) => {
    if (phaseRef.current !== 'play') return;
    audio.unlock();
    mark();
    const h = hidersRef.current.find((x) => x.id === id);
    if (!h) return;
    setHiders((hs) => hs.map((x) => (x.id === id ? { ...x, rustle: x.rustle + 1, searched: true } : x)));
    setLeafBurst({ id, n: Date.now() });
    audio.sfx('rustle');
    if (h.eggId) {
      const egg = eggsRef.current.find((x) => x.id === h.eggId);
      if (egg && !egg.revealed) {
        later(260, () => {
          setEggs((es) => es.map((x) => (x.id === h.eggId ? { ...x, revealed: true, justRevealed: true } : x)));
          audio.sfx('pop');
          foundCount.current += 1;
          if (foundCount.current === 1 || Math.random() < 0.35) audio.speak(pick(FOUND_LINES));
        });
      }
    } else if (h.critter && !h.critterShown) {
      const critter = h.critter;
      later(200, () => {
        setHiders((hs) => hs.map((x) => (x.id === id ? { ...x, critterShown: Date.now() } : x)));
        audio.sfx(critter);
        audio.speak(CRITTER_LINES[critter]);
      });
    }
  };

  /* ----------------------------- parents ----------------------------- */
  const tapParent = (kind: DinoKind) => {
    if (phaseRef.current !== 'play') return;
    audio.unlock();
    const sel = selectedRef.current;
    if (sel) {
      deliver(sel, kind);
      return;
    }
    mark();
    setParentSignals((s) => ({ ...s, [kind]: (s[kind] ?? 0) + 1 }));
    const info = DINOS[kind];
    const missing = (level.need[kind] ?? 0) - (gotRef.current[kind] ?? 0);
    if (missing > 0) {
      audio.speak(`Have you seen my egg? It's ${info.eggDesc}, just like me!`, { force: true });
    } else {
      audio.speak(pick(['Thank you for finding my baby!', 'My baby is home! Thank you!']), { force: true });
    }
  };

  /* ----------------------------- hatching ----------------------------- */
  const hatchingRef = useRef(hatching);
  hatchingRef.current = hatching;
  const onHatchDone = useCallback(() => {
    const h = hatchingRef.current;
    if (!h) return;
    hatchingRef.current = null;
    const kind = h.kind;
    setHatching(null);
    setEggs((es) => es.map((e) => (e.id === h.eggId ? { ...e, status: 'done' } : e)));
    setGot((g) => ({ ...g, [kind]: (g[kind] ?? 0) + 1 }));
    setNewBaby(kind);
    onHatch(kind);
    const remaining = eggsRef.current.filter((e) => e.id !== h.eggId && e.status !== 'done').length;
    setPhase('play');
    lastAct.current = Date.now();
    if (remaining === 0) {
      later(1300, () => {
        setPhase('done');
        onComplete(levelIndex);
        audio.sfx('fanfare');
        audio.speak('Hooray! All the baby dinos are home!', { force: true });
      });
    }
  }, [later, onComplete, onHatch, levelIndex]);

  /* ----------------------------- render ----------------------------- */
  const vmin = Math.min(vp.w, vp.h);
  const activeEgg = eggs.find((e) => e.id === (dragId ?? selected));
  const holding = !!activeEgg;
  let popIndex = 0;

  const itemZ = (y: number) => 10 + Math.round((y / vp.h) * 200);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ touchAction: 'none' }}>
      <Scenery w={vp.w} h={vp.h} horizon={layout.horizon} stripTop={layout.stripTop} seed={seed % 1000} />

      {/* background tap area clears selection */}
      <div className="absolute inset-0" onClick={() => selected && setSelected(null)} />

      {/* hiders */}
      {hiders.map((h) => {
        const spot = layout.spots[level.slots[h.id]];
        if (!spot) return null;
        const w = layout.eggH * 1.45 * spot.s;
        const hh = w * 0.75;
        const egg = h.eggId ? eggs.find((e) => e.id === h.eggId) : undefined;
        const rolled = h.type === 'rock' && !!egg?.revealed;
        const wiggle = !!egg && !egg.revealed;
        const hinted = hint?.type === 'hider' && hint.id === h.id;
        const anim = rolled ? 'rock-rolled' : hinted ? 'hider-hint' : h.rustle ? 'hider-rustle' : wiggle ? 'hider-wiggle' : '';
        const delay = popIndex++ * 0.08;
        return (
          <div
            key={h.id}
            className="absolute"
            style={{ left: spot.x, top: spot.y, width: w, height: hh, transform: 'translate(-50%, -100%)', zIndex: itemZ(spot.y) }}
          >
            <div className="pop-in h-full w-full" style={{ '--pop-delay': `${0.15 + delay}s` } as CSSProperties}>
              <button
                type="button"
                aria-label="Look for an egg here"
                className="block h-full w-full cursor-pointer border-0 bg-transparent p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  tapHider(h.id);
                }}
              >
                <div
                  key={`${h.rustle}-${hinted ? hint?.n : 0}`}
                  className={cn('h-full w-full', anim, h.searched && !egg && 'hider-searched')}
                  style={{ '--wobble-delay': `${(h.id.charCodeAt(h.id.length - 1) % 5) * 0.9}s` } as CSSProperties}
                >
                  <HiderArt type={h.type} className="h-full w-full" />
                </div>
              </button>
            </div>
            {leafBurst?.id === h.id && h.type !== 'rock' && <Leaves key={leafBurst.n} />}
            {h.critterShown > 0 && h.critter && (
              <div
                key={h.critterShown}
                className={`critter critter-${h.critter}`}
                style={{ width: w * 0.34, height: w * 0.28, left: '33%', top: '28%', zIndex: 5 }}
              >
                <Critter kind={h.critter} />
              </div>
            )}
          </div>
        );
      })}

      {/* eggs */}
      {eggs.map((e) => {
        if (!e.revealed || e.status === 'done') return null;
        const slotId = e.hiderId ?? e.id;
        const spot = layout.spots[level.slots[slotId]];
        if (!spot) return null;
        const eh = layout.eggH * spot.s * (e.hiderId ? 0.9 : 1);
        const ew = (eh * 100) / 130;
        const isDrag = dragId === e.id;
        const isSel = selected === e.id;
        const hinted = hint?.type === 'egg' && hint.id === e.id;
        // Map eggs must stay above the family strip. On small screens their hit
        // area can overlap a parent dino, and the egg should receive the tap.
        const z = isDrag || e.status === 'flying' ? 800 : 520 + itemZ(spot.y);
        const anim = e.justRevealed ? 'egg-reveal' : isSel ? 'egg-selected' : hinted ? 'egg-hint' : isDrag ? '' : 'egg-idle';
        const delay = e.hiderId ? 0 : popIndex++ * 0.08;
        return (
          <div
            key={e.id}
            ref={(el) => {
              if (el) itemEls.current.set(e.id, el);
              else itemEls.current.delete(e.id);
            }}
            className="absolute"
            style={{
              left: spot.x + (e.hiderId ? ew * 0.12 : 0),
              top: spot.y + (e.hiderId ? eh * 0.08 : 0),
              width: ew,
              height: eh,
              transform: 'translate(-50%, -100%)',
              zIndex: z,
            }}
          >
            <div
              ref={(el) => {
                if (el) movers.current.set(e.id, el);
                else movers.current.delete(e.id);
              }}
              role="button"
              aria-label={`${DINOS[e.kind].eggDesc} egg`}
              className={cn('relative h-full w-full', e.status === 'map' ? 'cursor-grab' : '', isDrag && 'cursor-grabbing')}
              style={{ touchAction: 'none' }}
              onPointerDown={(ev) => onEggDown(ev, e.id)}
              onPointerMove={onEggMove}
              onPointerUp={(ev) => endDrag(ev, false)}
              onPointerCancel={(ev) => endDrag(ev, true)}
              onLostPointerCapture={(ev) => endDrag(ev, true)}
            >
              <div
                className={cn('relative h-full w-full', !e.hiderId && 'pop-in')}
                style={{ '--pop-delay': `${0.15 + delay}s` } as CSSProperties}
              >
                <div className="egg-shadow" />
                {isSel && <div className="select-ring" />}
                {hinted && <div key={hint?.n} className="sparkle-ring" />}
                <div
                  key={`${anim}-${hinted ? hint?.n : 0}`}
                  className={cn('h-full w-full', anim)}
                  style={{ '--wobble-delay': `${(e.id.charCodeAt(e.id.length - 1) % 6) * 0.6}s` } as CSSProperties}
                  onAnimationEnd={(ev) => {
                    if (ev.target !== ev.currentTarget) return;
                    if (e.justRevealed) setEggs((es) => es.map((x) => (x.id === e.id ? { ...x, justRevealed: false } : x)));
                    else if (hinted) setHint(null);
                  }}
                >
                  <Egg kind={e.kind} className="h-full w-full" />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* parents + nests */}
      {level.parents.map((kind, i) => {
        const slot = layout.parentSlots[i];
        if (!slot) return null;
        const need = level.need[kind] ?? 0;
        const have = got[kind] ?? 0;
        const missing = need - have;
        const size = layout.parentSize;
        const nx = NEST_X[kind];
        const nestW = size * NEST_W;
        const nestH = nestW * 0.5;
        const groupW = size * nx + nestW;
        const gx = (slot.w - groupW) / 2;
        const isHot = hover === kind;
        const hintMe = holding && !!activeEgg && activeEgg.wrong >= 2 && activeEgg.kind === kind;
        const mood = phase === 'done' ? 'happy' : isHot ? 'curious' : missing > 0 ? 'sad' : 'idle';
        const babySize = size * (need > 1 ? 0.4 : 0.46);
        return (
          <div
            key={kind}
            ref={(el) => {
              if (el) parentEls.current.set(kind, el);
              else parentEls.current.delete(kind);
            }}
            className="absolute cursor-pointer"
            style={{ left: slot.x, top: slot.y, width: slot.w, height: slot.h, zIndex: 300 + slot.row * 10 }}
            onClick={() => tapParent(kind)}
            role="button"
            aria-label={`${DINOS[kind].species} parent`}
          >
            {holding && missing > 0 && (
              <div className={cn('drop-glow', isHot && 'hot', hintMe && 'hint')} style={{ left: gx + groupW / 2, width: groupW * 1.1 }} />
            )}
            <div
              className={cn('parent-box absolute', isHot && 'parent-hot', hintMe && !isHot && 'parent-hint')}
              style={{ width: size, height: size, left: gx, bottom: nestH * 0.1 }}
            >
              <DinoActor
                kind={kind}
                mood={mood}
                shaking={shake === kind}
                actSignal={parentSignals[kind] ?? 0}
                look={holding ? LOOK_UP : undefined}
                className="h-full w-full"
              />
              {missing > 0 && phase !== 'done' && <Thought missing={missing} size={size} />}
            </div>
            <div
              ref={(el) => {
                if (el) nestEls.current.set(kind, el);
                else nestEls.current.delete(kind);
              }}
              className="absolute"
              style={{ width: nestW, height: nestH, left: gx + size * nx, bottom: -nestH * 0.04 }}
            >
              <NestBack className="absolute inset-0 h-full w-full" />
              {Array.from({ length: have }, (_, b) => {
                const spread = need > 1 ? (b - (need - 1) / 2) * (nestW * 0.46) : 0;
                return (
                  <div
                    key={b}
                    className={cn('absolute', newBaby === kind && b === have - 1 && 'baby-pop')}
                    style={{ width: babySize, height: babySize, left: nestW / 2 - babySize / 2 + spread, bottom: nestH * 0.24 }}
                  >
                    <DinoActor
                      kind={kind}
                      baby
                      flip
                      tapToAct
                      mood={phase === 'done' ? 'happy' : 'idle'}
                      onTap={() => {
                        mark();
                        const sel = selectedRef.current;
                        if (sel) {
                          deliver(sel, kind);
                          return true;
                        }
                        return false;
                      }}
                      className="h-full w-full"
                    />
                  </div>
                );
              })}
              <NestFront className="pointer-events-none absolute inset-0 h-full w-full" />
            </div>
          </div>
        );
      })}

      {hint?.type === 'hand' && <HandDemo key={hint.n} hint={hint} size={clamp(layout.eggH * 0.75, 48, 96)} />}

      <Hud
        height={layout.hudH}
        width={vp.w}
        levelIndex={levelIndex}
        eggs={eggs}
        settings={settings}
        onToggle={onToggle}
        onHome={onHome}
      />

      {phase === 'intro' && (
        <div className="pointer-events-none absolute inset-0 z-[750] flex items-center justify-center">
          <div className="intro-card flex flex-col items-center rounded-[2rem] border-4 border-ink bg-white/95 px-8 py-4 shadow-[0_8px_0_#3a2a4d]">
            <div className="font-bold leading-none text-amber-500 outline-text" style={{ fontSize: clamp(vmin * 0.11, 40, 90) }}>
              Island {levelIndex + 1}
            </div>
            <div className="mt-2 flex items-center gap-2">
              {level.eggs.map((e) => (
                <div key={e.id} style={{ width: clamp(vmin * 0.05, 22, 40), height: clamp(vmin * 0.065, 28, 52) }}>
                  {e.hiderId ? <GhostEgg className="h-full w-full" /> : <Egg kind={e.kind} className="h-full w-full" />}
                </div>
              ))}
            </div>
            <div className="mt-2 font-semibold text-ink/80" style={{ fontSize: clamp(vmin * 0.035, 15, 26) }}>
              {levelIndex === 0 ? 'Bring each egg to its dino family!' : `${level.eggs.length} eggs to rescue!`}
            </div>
          </div>
        </div>
      )}

      {hatching && <HatchOverlay key={hatching.eggId} kind={hatching.kind} onDone={onHatchDone} />}

      {phase === 'done' && (
        <LevelComplete
          levelIndex={levelIndex}
          parents={level.parents}
          need={level.need}
          onNext={onNext}
          onReplay={onReplay}
          onHome={onHome}
          isFinal={levelIndex >= 499}
          milestoneBaby={milestoneBaby}
        />
      )}
    </div>
  );
}
