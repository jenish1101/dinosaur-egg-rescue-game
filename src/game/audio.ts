import type { DinoKind } from './dinos';

export type Sfx =
  | 'tap'
  | 'pickup'
  | 'drop'
  | 'pop'
  | 'wrong'
  | 'right'
  | 'crack'
  | 'hatch'
  | 'rustle'
  | 'whoosh'
  | 'sparkle'
  | 'fanfare'
  | 'star'
  | 'butterfly'
  | 'frog'
  | 'ladybug';

interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  attack?: number;
  delay?: number;
  slide?: number;
  slideTime?: number;
  vibrato?: number;
  vibratoDepth?: number;
  filter?: number;
  dest?: AudioNode | null;
}

interface NoiseOpts {
  vol?: number;
  freq?: number;
  q?: number;
  type?: BiquadFilterType;
  delay?: number;
  sweep?: number;
  attack?: number;
}

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// Cheerful I - vi - IV - V loop
const CHORDS = [
  [60, 64, 67],
  [57, 60, 64],
  [53, 57, 60],
  [55, 59, 62],
];
const MELODY: (number | null)[] = [
  76, null, 79, null, 84, null, 79, 76,
  81, null, 79, null, 76, null, 72, null,
  77, null, 81, null, 84, 83, 81, null,
  79, null, 83, null, 86, null, 83, null,
  76, 77, 79, null, 76, null, 72, null,
  72, null, 76, null, 81, null, 79, null,
  77, null, 76, null, 74, null, 72, null,
  74, null, 71, null, 67, null, null, null,
];
const ARP = [0, 1, 2, 1, 0, 1, 2, 1];

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const en = voices.filter((v) => /^en([-_]|$)/i.test(v.lang));
  const prefs = [
    'Samantha',
    'Google US English',
    'Microsoft Jenny',
    'Microsoft Aria',
    'Karen',
    'Tessa',
    'Moira',
    'Serena',
    'Microsoft Zira',
    'Female',
  ];
  for (const p of prefs) {
    const v = en.find((x) => x.name.includes(p));
    if (v) return v;
  }
  return en.find((v) => v.lang.replace('_', '-') === 'en-US') ?? en[0] ?? null;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private musicTimer: number | null = null;
  private nextNote = 0;
  private step = 0;
  private voice: SpeechSynthesisVoice | null = null;
  private lastSpeech = '';
  private lastSpeechAt = 0;
  private speakTimer: number | undefined = undefined;

  sfxOn = true;
  musicOn = true;
  voiceOn = true;

  constructor() {
    if (typeof window === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) {
        this.ctx.suspend().catch(() => undefined);
        try {
          window.speechSynthesis?.cancel();
        } catch {
          /* ignore */
        }
      } else {
        this.ctx.resume().catch(() => undefined);
      }
    });
    if ('speechSynthesis' in window) {
      const pick = () => {
        this.voice = pickVoice();
      };
      pick();
      try {
        window.speechSynthesis.addEventListener('voiceschanged', pick);
      } catch {
        /* older browsers */
      }
    }
  }

  /** must be called from a user gesture at least once */
  unlock() {
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        this.ctx = ctx;
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -12;
        comp.ratio.value = 4;
        comp.connect(ctx.destination);
        this.master = ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(comp);
        this.sfxBus = ctx.createGain();
        this.sfxBus.connect(this.master);
        this.musicBus = ctx.createGain();
        this.musicBus.gain.value = 0;
        this.musicBus.connect(this.master);
        const len = ctx.sampleRate;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => undefined);
      this.applyMusic();
    } catch {
      /* audio not available */
    }
    this.primeSpeech();
  }

  private speechPrimed = false;
  /** iOS only allows speech after one utterance was started inside a user gesture */
  private primeSpeech() {
    if (this.speechPrimed || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.speechPrimed = true;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  }

  setSfx(on: boolean) {
    this.sfxOn = on;
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    this.applyMusic();
  }

  setVoice(on: boolean) {
    this.voiceOn = on;
    if (!on) {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    }
  }

  private ready() {
    return !!(this.ctx && this.sfxBus && this.ctx.state !== 'closed');
  }

  private tone(freq: number, dur: number, o: ToneOpts = {}) {
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + (o.delay ?? 0) + 0.005;
    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t0 + (o.slideTime ?? dur));
    const g = ctx.createGain();
    const vol = o.vol ?? 0.25;
    const a = o.attack ?? 0.008;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    if (o.vibrato) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = o.vibrato;
      const lg = ctx.createGain();
      lg.gain.value = o.vibratoDepth ?? 10;
      lfo.connect(lg);
      lg.connect(osc.frequency);
      lfo.start(t0);
      lfo.stop(t0 + dur + 0.05);
    }
    if (o.filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.filter;
      osc.connect(f);
      f.connect(g);
    } else {
      osc.connect(g);
    }
    g.connect(o.dest ?? this.sfxBus!);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private noise(dur: number, o: NoiseOpts = {}) {
    const ctx = this.ctx!;
    if (!this.noiseBuf) return;
    const t0 = ctx.currentTime + (o.delay ?? 0) + 0.005;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.type ?? 'bandpass';
    f.frequency.setValueAtTime(o.freq ?? 1500, t0);
    f.Q.value = o.q ?? 1;
    if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol ?? 0.3, t0 + (o.attack ?? 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxBus!);
    src.start(t0, Math.random() * 0.4);
    src.stop(t0 + dur + 0.05);
  }

  sfx(name: Sfx) {
    if (!this.sfxOn || !this.ready()) return;
    try {
      switch (name) {
        case 'tap':
          this.tone(660, 0.09, { vol: 0.14, slide: 900, slideTime: 0.05 });
          break;
        case 'pickup':
          this.tone(500, 0.14, { vol: 0.2, slide: 820, slideTime: 0.09, type: 'triangle' });
          break;
        case 'drop':
          this.tone(620, 0.16, { vol: 0.15, slide: 360, type: 'triangle' });
          break;
        case 'pop':
          this.tone(360, 0.16, { vol: 0.3, slide: 1150, slideTime: 0.09 });
          this.noise(0.05, { vol: 0.12, freq: 3200 });
          this.tone(1320, 0.18, { vol: 0.08, delay: 0.1 });
          break;
        case 'wrong':
          this.tone(392, 0.2, { type: 'triangle', vol: 0.2 });
          this.tone(311, 0.3, { type: 'triangle', vol: 0.2, delay: 0.18 });
          break;
        case 'right':
          [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.24, { type: 'triangle', vol: 0.18, delay: i * 0.08 }));
          break;
        case 'crack':
          this.noise(0.09, { vol: 0.6, freq: 1800, q: 1.2 });
          this.noise(0.06, { vol: 0.45, freq: 2800, q: 2, delay: 0.06 });
          this.tone(170, 0.07, { vol: 0.18, type: 'square', filter: 800 });
          break;
        case 'hatch':
          this.noise(0.2, { vol: 0.45, freq: 1000, q: 0.7, sweep: 4200 });
          [1047, 1319, 1568, 2093, 2637].forEach((f, i) => this.tone(f, 0.3, { vol: 0.1, delay: 0.05 + i * 0.05 }));
          [523, 659, 784].forEach((f) => this.tone(f, 0.7, { type: 'triangle', vol: 0.12, delay: 0.32 }));
          break;
        case 'rustle':
          for (let i = 0; i < 4; i++) {
            this.noise(0.1, { vol: 0.2, freq: 2600 + Math.random() * 1800, q: 0.8, delay: i * 0.07 });
          }
          break;
        case 'whoosh':
          this.noise(0.4, { vol: 0.22, freq: 400, sweep: 2600, q: 1, attack: 0.12 });
          break;
        case 'sparkle':
          [1568, 2093, 2637, 3136].forEach((f, i) => this.tone(f, 0.2, { vol: 0.07, delay: i * 0.06 }));
          break;
        case 'star':
          this.tone(880, 0.22, { vol: 0.14, slide: 1760, slideTime: 0.12, type: 'triangle' });
          this.tone(1760, 0.3, { vol: 0.06, delay: 0.1 });
          break;
        case 'fanfare': {
          const notes: [number, number][] = [
            [523, 0],
            [659, 0.13],
            [784, 0.26],
            [1047, 0.39],
            [784, 0.56],
            [1047, 0.69],
          ];
          notes.forEach(([f, d]) => this.tone(f, 0.3, { type: 'square', vol: 0.08, delay: d, filter: 2600 }));
          [523, 659, 784, 1047].forEach((f) => this.tone(f, 1.1, { type: 'triangle', vol: 0.09, delay: 0.69 }));
          break;
        }
        case 'butterfly':
          [880, 1175, 1397, 1760].forEach((f, i) => this.tone(f, 0.22, { vol: 0.1, delay: i * 0.07 }));
          break;
        case 'frog':
          [0, 0.22].forEach((d) =>
            this.tone(165, 0.15, { type: 'square', vol: 0.12, filter: 700, vibrato: 36, vibratoDepth: 45, delay: d }),
          );
          break;
        case 'ladybug':
          this.tone(620, 0.45, { type: 'sawtooth', vol: 0.05, filter: 1500, vibrato: 60, vibratoDepth: 28 });
          this.tone(1200, 0.2, { vol: 0.08, delay: 0.3, slide: 1800 });
          break;
      }
    } catch {
      /* ignore */
    }
  }

  dinoVoice(kind: DinoKind, baby = true) {
    if (!this.sfxOn || !this.ready()) return;
    const p = baby ? 1.55 : 1;
    try {
      switch (kind) {
        case 'trex':
          this.tone(170 * p, 0.6, { type: 'sawtooth', vol: 0.2, slide: 105 * p, slideTime: 0.6, filter: 1200, vibrato: 28, vibratoDepth: 16 * p, attack: 0.04 });
          this.noise(0.5, { vol: 0.1, freq: 650 * p, q: 1.4, attack: 0.05 });
          break;
        case 'brachio':
          this.tone(330 * p, 0.9, { type: 'triangle', vol: 0.2, slide: 190 * p, slideTime: 0.9, vibrato: 5, vibratoDepth: 8, attack: 0.12 });
          this.tone(230 * p, 0.7, { vol: 0.13, delay: 0.95, slide: 180 * p, attack: 0.12 });
          break;
        case 'croc':
          [0, 0.2, 0.4].forEach((d) => {
            this.noise(0.05, { vol: 0.4, freq: 2600, q: 3, delay: d });
            this.tone(950, 0.04, { type: 'square', vol: 0.05, delay: d, filter: 2200 });
          });
          [900, 820, 740, 680].forEach((f, i) => this.tone((f * p) / 1.25, 0.08, { vol: 0.13, delay: 0.62 + i * 0.09, type: 'triangle' }));
          break;
        case 'trice':
          [0, 0.32].forEach((d) => this.tone(180 * p, 0.3, { vol: 0.24, slide: 620 * p, slideTime: 0.22, vibrato: 14, vibratoDepth: 24, delay: d }));
          break;
        case 'stego':
          this.tone(880 * p, 0.15, { vol: 0.17, slide: 1400 * p, slideTime: 0.1 });
          this.tone(1100 * p, 0.1, { vol: 0.07, delay: 0.32 });
          this.tone(1000 * p, 0.12, { vol: 0.07, delay: 0.44 });
          break;
        case 'ptero':
          [0, 0.14, 0.28].forEach((d) => this.tone((1300 * p) / 1.3, 0.1, { type: 'triangle', vol: 0.13, slide: (1900 * p) / 1.3, slideTime: 0.07, delay: d }));
          this.tone(700 * p, 0.6, { vol: 0.11, slide: 1600 * p, slideTime: 0.5, delay: 0.45 });
          break;
        case 'ankylo':
          [0, 0.22].forEach((d) => this.tone(110, 0.22, { vol: 0.42, slide: 45, slideTime: 0.18, delay: d }));
          this.tone((420 * p) / 1.2, 0.25, { type: 'triangle', vol: 0.15, slide: (560 * p) / 1.2, delay: 0.5 });
          break;
        case 'para': {
          const base = baby ? 1 : 0.7;
          [392, 523, 659, 784, 659, 784].forEach((f, i) =>
            this.tone(f * base, i === 5 ? 0.36 : 0.16, { type: 'square', vol: 0.09, filter: 1800, vibrato: 6, vibratoDepth: 5, delay: i * 0.17, attack: 0.02 }),
          );
          break;
        }
      }
    } catch {
      /* ignore */
    }
  }

  /* -------------------------------- music -------------------------------- */

  private applyMusic() {
    if (!this.ctx || !this.musicBus) return;
    const t = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(t);
    this.musicBus.gain.setTargetAtTime(this.musicOn ? 0.55 : 0, t, 0.25);
    if (this.musicOn && this.musicTimer === null) {
      this.nextNote = this.ctx.currentTime + 0.15;
      this.musicTimer = window.setInterval(() => this.schedule(), 60);
    } else if (!this.musicOn && this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const stepDur = 60 / 108 / 2;
    while (this.nextNote < ctx.currentTime + 0.3) {
      this.playStep(this.step, this.nextNote);
      this.nextNote += stepDur;
      this.step = (this.step + 1) % 64;
    }
  }

  private pluck(freq: number, t: number, vol: number, dur: number, type: OscillatorType = 'sine') {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.musicBus!);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private playStep(step: number, t: number) {
    const bar = Math.floor(step / 8) % 4;
    const beat = step % 8;
    const chord = CHORDS[bar];
    if (beat === 0 || beat === 4) this.pluck(midi(chord[0] - 24), t, 0.2, 0.45, 'triangle');
    const n = chord[ARP[beat]];
    this.pluck(midi(n), t, 0.07, 0.3);
    this.pluck(midi(n + 12) * 1.0, t, 0.02, 0.1);
    const m = MELODY[step];
    if (m) {
      this.pluck(midi(m), t, 0.075, 0.42, 'triangle');
      this.pluck(midi(m + 12), t, 0.018, 0.2);
    }
  }

  /* -------------------------------- speech -------------------------------- */

  speak(text: string, opts: { pitch?: number; rate?: number; force?: boolean } = {}) {
    if (!this.voiceOn) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const now = Date.now();
    if (!opts.force && text === this.lastSpeech && now - this.lastSpeechAt < 2500) return;
    this.lastSpeech = text;
    this.lastSpeechAt = now;
    try {
      const synth = window.speechSynthesis;
      const busy = synth.speaking || synth.pending;
      if (busy) synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = opts.rate ?? 0.95;
      u.pitch = opts.pitch ?? 1.2;
      u.volume = 1;
      if (!this.voice) this.voice = pickVoice();
      if (this.voice) {
        u.voice = this.voice;
        u.lang = this.voice.lang;
      } else {
        u.lang = 'en-US';
      }
      // Chrome sometimes drops an utterance queued in the same tick as cancel()
      window.clearTimeout(this.speakTimer);
      if (busy) {
        this.speakTimer = window.setTimeout(() => {
          if (this.voiceOn) synth.speak(u);
        }, 80);
      } else {
        synth.speak(u);
      }
    } catch {
      /* ignore */
    }
  }
}

export const audio = new AudioEngine();
