export type DinoKind =
  | 'trex'
  | 'brachio'
  | 'croc'
  | 'trice'
  | 'stego'
  | 'ptero'
  | 'ankylo'
  | 'para';

export const ALL_KINDS: DinoKind[] = ['trex', 'brachio', 'croc', 'trice', 'stego', 'ptero', 'ankylo', 'para'];

// The diary is a species collection, so twins never create duplicate cards.
export const UNIQUE_BABIES: DinoKind[] = [...new Set(ALL_KINDS)];

export interface MilestoneBaby {
  id: string;
  level: number;
  name: string;
  species: string;
  trait: string;
  hello: string;
  kind: DinoKind;
  hue: number;
}

const MILESTONE_NAMES = [
  'Pebble', 'Sprout', 'Bubbles', 'Waffle', 'Puddle', 'Ziggy', 'Mango', 'Pipkin', 'Dottie', 'Clover',
  'Noodle', 'Sunny', 'Button', 'Pickle', 'Taffy', 'Mochi', 'Biscuit', 'Poppy', 'Tinker', 'Coco',
  'Muffin', 'Roo', 'Pebbles', 'Jellybean', 'Cricket', 'Toffee', 'Bumble', 'Socks', 'Miso', 'Twinkle',
  'Sprinkle', 'Pancake', 'Dumpling', 'Kiwi', 'Marbles', 'Boo', 'Nibbles', 'Peanut', 'Pudding', 'Wiggles',
  'Cinnamon', 'Buttonbell', 'Daisy', 'Gingersnap', 'Lulu', 'Moonbeam', 'Tater Tot', 'Fizzy', 'Acorn', 'Starlight',
] as const;

const MILESTONE_SPECIES = [
  'Rainbow Raptor', 'Cloudosaurus', 'Puddleback', 'Sunstripe', 'Mossyhorn',
  'Cometclaw', 'Jellyjaw', 'Pebbletail', 'Starcrest', 'Bumblebeak',
] as const;

const MILESTONE_TRAITS = ['curious', 'snuggly', 'bouncy', 'sparkly', 'kind', 'silly', 'brave', 'musical', 'sleepy', 'wiggly'] as const;

/** One collectible baby is unlocked at the end of every tenth island. */
export const MILESTONE_BABIES: MilestoneBaby[] = MILESTONE_NAMES.map((name, index) => {
  const level = (index + 1) * 10;
  const kind = ALL_KINDS[index % ALL_KINDS.length];
  const species = `${MILESTONE_SPECIES[index % MILESTONE_SPECIES.length]} ${index + 1}`;
  const trait = MILESTONE_TRAITS[index % MILESTONE_TRAITS.length];
  return {
    id: `milestone-${level}`,
    level,
    name,
    species,
    trait,
    hello: `Hi! I'm ${name}, the ${species}. I'm ${trait}!`,
    kind,
    hue: (index * 37) % 360,
  };
});

export type EggPattern = 'stripes' | 'spots' | 'zigzag' | 'triangles' | 'diamonds' | 'hearts' | 'bumps' | 'waves';

export interface DinoPalette {
  body: string;
  dark: string;
  belly: string;
  accent: string;
  accent2: string;
  horn: string;
  beak: string;
}

export interface DinoInfo {
  kind: DinoKind;
  name: string;
  species: string;
  trait: string;
  /** word shown in the speech bubble when the dino does its thing */
  word: string;
  /** little floating particle character */
  particle: string;
  particleColor: string;
  /** what the baby says in the baby book */
  hello: string;
  /** spoken description of the egg, e.g. "orange with stripes" */
  eggDesc: string;
  pal: DinoPalette;
  egg: { base: string; mark: string; shade: string; pattern: EggPattern };
  actionMs: number;
  /** anchor (viewBox units 0-200) where speech bubbles / particles appear */
  fx: { x: number; y: number };
  /** where the baby's eggshell hat sits (viewBox units) */
  hat: { x: number; y: number; r: number; s: number };
}

export const OUTLINE = '#3A2A4D';

export const DINOS: Record<DinoKind, DinoInfo> = {
  trex: {
    kind: 'trex',
    eggDesc: 'orange with stripes',
    name: 'Rexy',
    species: 'T-Rex',
    trait: 'Brave & roary',
    word: 'RAWR!',
    particle: '!',
    particleColor: '#FF7A2F',
    hello: "Rawr! I'm Rexy, a brave little T-Rex!",
    pal: {
      body: '#FF9A47',
      dark: '#DB6E22',
      belly: '#FFE6BA',
      accent: '#C4501A',
      accent2: '#FFFFFF',
      horn: '#FFF6E6',
      beak: '#FFB36B',
    },
    egg: { base: '#FFA553', mark: '#C4501A', shade: '#E0782A', pattern: 'stripes' },
    actionMs: 1400,
    fx: { x: 186, y: 64 },
    hat: { x: 128, y: 43, r: -16, s: 0.95 },
  },
  brachio: {
    kind: 'brachio',
    eggDesc: 'blue with spots',
    name: 'Bronty',
    species: 'Long-Neck',
    trait: 'Sleepy & gentle',
    word: 'Yaaawn',
    particle: 'Z',
    particleColor: '#3A86C9',
    hello: "Hello... I'm Bronty the long-neck. I love naps!",
    pal: {
      body: '#5DB2F2',
      dark: '#3A86C9',
      belly: '#D6EEFF',
      accent: '#BDE3FF',
      accent2: '#FFFFFF',
      horn: '#FFFFFF',
      beak: '#9FD2FA',
    },
    egg: { base: '#66B8F3', mark: '#DDF2FF', shade: '#3F93D6', pattern: 'spots' },
    actionMs: 2000,
    fx: { x: 182, y: 24 },
    hat: { x: 160, y: 32, r: 10, s: 0.72 },
  },
  croc: {
    kind: 'croc',
    eggDesc: 'green with zigzags',
    name: 'Snappy',
    species: 'Crocodile',
    trait: 'Giggly & snappy',
    word: 'Snap snap!',
    particle: '✦',
    particleColor: '#2F9E3F',
    hello: "Snap snap! I'm Snappy the crocodile! Hee hee!",
    pal: {
      body: '#62C24F',
      dark: '#3C9138',
      belly: '#E3F6A8',
      accent: '#2F7D32',
      accent2: '#FFFFFF',
      horn: '#FFFFFF',
      beak: '#8AD66F',
    },
    egg: { base: '#6BC857', mark: '#2F7D32', shade: '#3F9A3A', pattern: 'zigzag' },
    actionMs: 1300,
    fx: { x: 188, y: 118 },
    hat: { x: 124, y: 138, r: -18, s: 0.7 },
  },
  trice: {
    kind: 'trice',
    eggDesc: 'yellow with triangles',
    name: 'Trixie',
    species: 'Triceratops',
    trait: 'Bouncy & bold',
    word: 'Boing!',
    particle: '★',
    particleColor: '#FFB020',
    hello: "Boing boing! I'm Trixie the triceratops! Let's play!",
    pal: {
      body: '#FFD447',
      dark: '#E3A812',
      belly: '#FFF3C2',
      accent: '#FF7D6B',
      accent2: '#FFB9AD',
      horn: '#FFF8E8',
      beak: '#F2A93B',
    },
    egg: { base: '#FFD94F', mark: '#FF7D6B', shade: '#E8B420', pattern: 'triangles' },
    actionMs: 1400,
    fx: { x: 190, y: 96 },
    hat: { x: 110, y: 74, r: -28, s: 0.8 },
  },
  stego: {
    kind: 'stego',
    eggDesc: 'purple with diamonds',
    name: 'Spike',
    species: 'Stegosaurus',
    trait: 'Shy & sweet',
    word: 'Eep!',
    particle: '♥',
    particleColor: '#FF6FA8',
    hello: "Oh! H-hi... I'm Spike the stegosaurus. I'm a little shy.",
    pal: {
      body: '#A77FF2',
      dark: '#7C55CC',
      belly: '#E6DAFF',
      accent: '#FF92C2',
      accent2: '#FFC4DE',
      horn: '#FFF3FA',
      beak: '#C7A8FF',
    },
    egg: { base: '#B08AF5', mark: '#FF9CC8', shade: '#8660D6', pattern: 'diamonds' },
    actionMs: 1600,
    fx: { x: 184, y: 118 },
    hat: { x: 164, y: 130, r: 12, s: 0.62 },
  },
  ptero: {
    kind: 'ptero',
    eggDesc: 'pink with hearts',
    name: 'Pip',
    species: 'Pterodactyl',
    trait: 'Flappy & free',
    word: 'Wheee!',
    particle: '✦',
    particleColor: '#FF5C9A',
    hello: "Wheee! I'm Pip the pterodactyl! Look, I can fly!",
    pal: {
      body: '#FF89B7',
      dark: '#E25C94',
      belly: '#FFDCEA',
      accent: '#FF5C8A',
      accent2: '#FFC2DA',
      horn: '#FFFFFF',
      beak: '#FFB347',
    },
    egg: { base: '#FF96BF', mark: '#FFFFFF', shade: '#E8679C', pattern: 'hearts' },
    actionMs: 1600,
    fx: { x: 172, y: 58 },
    hat: { x: 100, y: 60, r: -8, s: 0.78 },
  },
  ankylo: {
    kind: 'ankylo',
    eggDesc: 'brown and bumpy',
    name: 'Tank',
    species: 'Ankylosaurus',
    trait: 'Wiggly & happy',
    word: 'Wiggle!',
    particle: '✧',
    particleColor: '#B07A45',
    hello: "Hi hi! I'm Tank the ankylosaurus! Watch my tail wiggle!",
    pal: {
      body: '#CC9D6B',
      dark: '#936339',
      belly: '#F2DEC2',
      accent: '#9C6B3F',
      accent2: '#E6C197',
      horn: '#FFF6EA',
      beak: '#E0B98C',
    },
    egg: { base: '#D5A978', mark: '#8E6038', shade: '#B0824F', pattern: 'bumps' },
    actionMs: 1400,
    fx: { x: 188, y: 128 },
    hat: { x: 166, y: 138, r: 8, s: 0.66 },
  },
  para: {
    kind: 'para',
    eggDesc: 'blue-green with wavy lines',
    name: 'Tootie',
    species: 'Parasaurolophus',
    trait: 'Musical & merry',
    word: 'Toot toot!',
    particle: '♪',
    particleColor: '#FF8A1F',
    hello: "Toot toot! I'm Tootie the parasaurolophus! La la la!",
    pal: {
      body: '#3CC7BA',
      dark: '#219688',
      belly: '#CFF6F0',
      accent: '#FF9B3D',
      accent2: '#FFFFFF',
      horn: '#FFFFFF',
      beak: '#FFE08A',
    },
    egg: { base: '#48CFC1', mark: '#FFFFFF', shade: '#22A597', pattern: 'waves' },
    actionMs: 1800,
    fx: { x: 76, y: 30 },
    hat: { x: 154, y: 52, r: 14, s: 0.66 },
  },
};
