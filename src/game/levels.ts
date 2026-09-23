import { ALL_KINDS, type DinoKind } from './dinos';
import type { CritterKind, HiderType } from '../components/Hider';

export const MAX_LEVELS = 500;

/* ------------------------------------------------------------------ */
/* Seeded random helpers                                               */
/* ------------------------------------------------------------------ */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ------------------------------------------------------------------ */
/* Level plans                                                         */
/* ------------------------------------------------------------------ */

export interface LevelPlan {
  parents: DinoKind[];
  eggs: DinoKind[];
  hidden: number;
  empty: number;
}

const FIXED: LevelPlan[] = [
  { parents: ['trex', 'brachio', 'croc'], eggs: ['trex', 'brachio', 'croc'], hidden: 0, empty: 1 },
  { parents: ['trice', 'stego', 'ptero'], eggs: ['trice', 'stego', 'ptero'], hidden: 1, empty: 2 },
  { parents: ['ankylo', 'para', 'trex', 'brachio'], eggs: ['ankylo', 'para', 'trex', 'brachio'], hidden: 2, empty: 2 },
  {
    parents: ['croc', 'trice', 'stego', 'ptero'],
    eggs: ['croc', 'croc', 'trice', 'stego', 'ptero', 'ptero'],
    hidden: 3,
    empty: 2,
  },
  {
    parents: ['ankylo', 'para', 'trex', 'brachio', 'croc'],
    eggs: ['ankylo', 'para', 'trex', 'brachio', 'croc', 'para'],
    hidden: 3,
    empty: 3,
  },
];

export function getLevelPlan(index: number): LevelPlan {
  const level = clamp(Math.floor(index), 0, MAX_LEVELS - 1);
  if (level < FIXED.length) return FIXED[level];
  const rng = mulberry32(level * 7919 + 13);
  // Every few dozen islands add another species, more twins, and more hiding.
  const count = Math.min(ALL_KINDS.length, 3 + Math.floor((level - FIXED.length) / 70));
  const parents = shuffle(ALL_KINDS, rng).slice(0, count);
  const extra = Math.min(count, Math.floor(rng() * (1 + Math.min(4, Math.floor(level / 90)))));
  const eggs = [...parents, ...shuffle(parents, rng).slice(0, extra)];
  const hidden = Math.min(eggs.length - 1, Math.floor((level - 2) / 75) + 1, 7);
  return { parents, eggs, hidden, empty: Math.min(4, 2 + Math.floor(level / 160)) };
}

/* ------------------------------------------------------------------ */
/* Level state                                                         */
/* ------------------------------------------------------------------ */

export interface EggState {
  id: string;
  kind: DinoKind;
  hiderId?: string;
  revealed: boolean;
  justRevealed: boolean;
  status: 'map' | 'flying' | 'done';
  wrong: number;
}

export interface HiderState {
  id: string;
  type: HiderType;
  eggId?: string;
  critter?: CritterKind;
  searched: boolean;
  rustle: number;
  critterShown: number;
}

export interface LevelState {
  parents: DinoKind[];
  eggs: EggState[];
  hiders: HiderState[];
  /** item id (visible egg or hider) -> slot index */
  slots: Record<string, number>;
  itemCount: number;
  need: Partial<Record<DinoKind, number>>;
}

const HIDER_TYPES: HiderType[] = ['bush', 'fern', 'rock'];
const CRITTERS: CritterKind[] = ['butterfly', 'frog', 'ladybug'];

export function buildLevel(index: number, seed: number): LevelState {
  const level = clamp(Math.floor(index), 0, MAX_LEVELS - 1);
  const plan = getLevelPlan(level);
  const rng = mulberry32(seed + level * 101);
  const parents = shuffle(plan.parents, rng);
  const eggs: EggState[] = shuffle(plan.eggs, rng).map((kind, i) => ({
    id: `egg${i}`,
    kind,
    revealed: true,
    justRevealed: false,
    status: 'map',
    wrong: 0,
  }));
  const hiders: HiderState[] = [];
  const hiderTypes = shuffle([...HIDER_TYPES, ...HIDER_TYPES, ...HIDER_TYPES], rng);
  const critters = shuffle(CRITTERS, rng);
  const hiddenIdx = shuffle(
    eggs.map((_, i) => i),
    rng,
  ).slice(0, plan.hidden);
  hiddenIdx.forEach((ei, j) => {
    const h: HiderState = {
      id: `hid${j}`,
      type: hiderTypes[j % hiderTypes.length],
      eggId: eggs[ei].id,
      searched: false,
      rustle: 0,
      critterShown: 0,
    };
    eggs[ei].hiderId = h.id;
    eggs[ei].revealed = false;
    hiders.push(h);
  });
  for (let j = 0; j < plan.empty; j++) {
    hiders.push({
      id: `emp${j}`,
      type: hiderTypes[(plan.hidden + j) % hiderTypes.length],
      critter: critters[j % critters.length],
      searched: false,
      rustle: 0,
      critterShown: 0,
    });
  }
  const items = shuffle([...eggs.filter((e) => !e.hiderId).map((e) => e.id), ...hiders.map((h) => h.id)], rng);
  const slots: Record<string, number> = {};
  items.forEach((id, i) => (slots[id] = i));
  const need: Partial<Record<DinoKind, number>> = {};
  eggs.forEach((e) => (need[e.kind] = (need[e.kind] ?? 0) + 1));
  return { parents, eggs, hiders, slots, itemCount: items.length, need };
}

/* ------------------------------------------------------------------ */
/* Responsive layout                                                   */
/* ------------------------------------------------------------------ */

export interface Spot {
  x: number;
  y: number;
  /** perspective scale */
  s: number;
}

export interface ParentSlot {
  x: number;
  y: number;
  w: number;
  h: number;
  row: number;
}

export interface GameLayout {
  w: number;
  h: number;
  portrait: boolean;
  hudH: number;
  horizon: number;
  stripTop: number;
  stripH: number;
  eggH: number;
  spots: Spot[];
  parentSlots: ParentSlot[];
  parentSize: number;
}

/** how far right (fraction of parent size) each species' nest sits, so heads stay visible */
export const NEST_X: Record<DinoKind, number> = {
  trex: 0.6,
  brachio: 0.64,
  croc: 0.74,
  trice: 0.66,
  stego: 0.72,
  ptero: 0.56,
  ankylo: 0.74,
  para: 0.62,
};
export const NEST_W = 0.54;

export function computeLayout(w: number, h: number, itemCount: number, parentCount: number, seed: number): GameLayout {
  const portrait = h > w * 1.05;
  const vmin = Math.min(w, h);
  const hudH = clamp(vmin * 0.12, 54, 84);
  // In portrait, stack parents in two rows only when that makes them noticeably bigger.
  const strip1 = portrait ? clamp(h * 0.23, 120, 440) : clamp(h * (h < 520 ? 0.31 : 0.28), 104, 300);
  const strip2 = clamp(h * 0.34, 120, 440);
  const size1 = Math.min(strip1 * 0.9, w / Math.max(1, parentCount) / 1.3, 270);
  const size2 = Math.min((strip2 / 2) * 0.9, w / Math.ceil(parentCount / 2) / 1.3, 270);
  const rowsP = portrait && parentCount >= 3 && size2 > size1 * 1.12 ? 2 : 1;
  const stripH = rowsP === 2 ? strip2 : strip1;
  const stripTop = h - stripH;
  const rowH = stripH / rowsP;
  const perRow = rowsP === 2 ? [Math.floor(parentCount / 2), Math.ceil(parentCount / 2)] : [parentCount];
  const maxPerRow = Math.max(1, ...perRow);
  const parentSize = Math.min(rowH * 0.9, w / maxPerRow / 1.3, 270);
  const parentSlots: ParentSlot[] = [];
  perRow.forEach((cnt, r) => {
    const sw = w / Math.max(1, cnt);
    for (let i = 0; i < cnt; i++) parentSlots.push({ x: sw * i, y: stripTop + r * rowH, w: sw, h: rowH, row: r });
  });
  const horizon = Math.max(hudH + 24, h * (portrait ? 0.2 : 0.25));
  const avail = Math.max(60, stripTop - horizon);

  const N = Math.max(itemCount + 2, 6);
  const aspect = w / avail;
  const cols = Math.max(2, Math.round(Math.sqrt(N * aspect)));
  const rows = Math.max(2, Math.ceil(N / cols));
  const cellW = w / cols;
  const eggH = clamp(Math.min((avail / (rows + 0.35)) * 0.98, cellW * 0.7, parentSize * 0.88), 50, 150);

  const yMin = horizon + eggH * 0.74;
  const yMax = stripTop - 10;
  const xPad = Math.max(eggH * 0.7, w * 0.075);
  const rng = mulberry32(seed ^ (cols * 131 + rows * 17));
  const spots: Spot[] = [];
  const rowGap = rows > 1 ? (yMax - yMin) / (rows - 1) : 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = rows === 1 ? 1 : r / (rows - 1);
      let y = yMin + (yMax - yMin) * t + (rng() - 0.5) * rowGap * 0.16;
      let x = xPad + (w - 2 * xPad) * ((c + 0.5 + (r % 2 ? 0.16 : -0.16)) / cols) + (rng() - 0.5) * cellW * 0.2;
      y = clamp(y, yMin, yMax);
      x = clamp(x, xPad, w - xPad);
      spots.push({ x, y, s: 0.84 + 0.16 * t });
    }
  }
  const order = shuffle(
    spots.map((_, i) => i),
    rng,
  );
  return {
    w,
    h,
    portrait,
    hudH,
    horizon,
    stripTop,
    stripH,
    eggH,
    spots: order.map((i) => spots[i]),
    parentSlots,
    parentSize,
  };
}
