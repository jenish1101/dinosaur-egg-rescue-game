import { ALL_KINDS, type DinoKind } from './dinos';
import { MAX_LEVELS } from './levels';

export interface Settings {
  sfx: boolean;
  music: boolean;
  voice: boolean;
}

export interface Progress {
  /** index of the next island to play */
  level: number;
  /** how many of each baby have hatched */
  hatched: Partial<Record<DinoKind, number>>;
  /** collectible babies awarded after islands 10, 20, 30 ... */
  milestoneBabies: number[];
}

export interface SaveData {
  settings: Settings;
  progress: Progress;
}

const KEY = 'dino-egg-rescue:v1';

const DEFAULTS: SaveData = {
  settings: { sfx: true, music: true, voice: true },
  progress: { level: 0, hatched: {}, milestoneBabies: [] },
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const data = JSON.parse(raw) as Partial<SaveData>;
    const hatched: Partial<Record<DinoKind, number>> = {};
    ALL_KINDS.forEach((k) => {
      const v = data.progress?.hatched?.[k];
      if (typeof v === 'number' && v > 0) hatched[k] = v;
    });
    const milestoneBabies = Array.isArray(data.progress?.milestoneBabies)
      ? [...new Set(data.progress.milestoneBabies.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= MAX_LEVELS / 10))].sort((a, b) => a - b)
      : [];
    return {
      settings: { ...DEFAULTS.settings, ...(data.settings ?? {}) },
      progress: {
        level: Math.min(MAX_LEVELS - 1, Math.max(0, Math.floor(data.progress?.level ?? 0))),
        hatched,
        milestoneBabies,
      },
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable (private mode etc.) */
  }
}
