import { memo, useState, type CSSProperties, type ReactNode } from 'react';
import { DINOS, OUTLINE, type DinoKind, type DinoPalette, type EggPattern } from '../game/dinos';
import { cn } from '../utils/cn';

export type DinoMood = 'idle' | 'happy' | 'sad' | 'curious';

interface FaceCtx {
  mood: DinoMood;
  baby: boolean;
  look: { x: number; y: number };
  sw: number;
  pal: DinoPalette;
  kind: DinoKind;
}

const MOUTH_FILL = '#8C2448';
const TONGUE = '#FF7FA0';

const st = (f: FaceCtx) => ({
  stroke: OUTLINE,
  strokeWidth: f.sw,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});

const origin = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` });

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

function scallop(cx: number, cy: number, r: number, n: number) {
  const br = r * Math.sin(Math.PI / n) * 1.25;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = (cx + r * Math.cos(a)).toFixed(1);
    const y = (cy + r * Math.sin(a)).toFixed(1);
    d += i === 0 ? `M${x} ${y}` : ` A${br.toFixed(1)} ${br.toFixed(1)} 0 0 1 ${x} ${y}`;
  }
  return d + 'Z';
}

/** little triangular spikes whose bases sit just inside an ellipse edge */
function spikesOnEllipse(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number, h: number) {
  let d = '';
  const step = (a1 - a0) / n;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  for (let i = 0; i < n; i++) {
    const aL = rad(a0 + step * (i + 0.1));
    const aR = rad(a0 + step * (i + 0.9));
    const aM = rad(a0 + step * (i + 0.5));
    const k = 0.9;
    const pL = `${(cx + rx * k * Math.cos(aL)).toFixed(1)} ${(cy + ry * k * Math.sin(aL)).toFixed(1)}`;
    const pR = `${(cx + rx * k * Math.cos(aR)).toFixed(1)} ${(cy + ry * k * Math.sin(aR)).toFixed(1)}`;
    const tip = `${(cx + (rx + h) * Math.cos(aM)).toFixed(1)} ${(cy + (ry + h) * Math.sin(aM)).toFixed(1)}`;
    d += `M${pL} L${tip} L${pR} Z `;
  }
  return d;
}

export function heartPath(x: number, y: number, s: number) {
  return `M${x} ${y + s * 0.9} C ${x - s * 1.4} ${y}, ${x - s * 0.9} ${y - s * 1.1}, ${x} ${y - s * 0.35} C ${x + s * 0.9} ${y - s * 1.1}, ${x + s * 1.4} ${y}, ${x} ${y + s * 0.9} Z`;
}

/* ------------------------------------------------------------------ */
/* Face parts                                                          */
/* ------------------------------------------------------------------ */

function Eye({ x, y, r, f }: { x: number; y: number; r: number; f: FaceCtx }) {
  const rr = f.baby ? r * 1.38 : r;
  if (f.mood === 'happy') {
    return (
      <path
        d={`M${x - rr * 0.85} ${y + rr * 0.2} Q ${x} ${y - rr * 1.0} ${x + rr * 0.85} ${y + rr * 0.2}`}
        fill="none"
        stroke={OUTLINE}
        strokeWidth={Math.max(3, rr * 0.38)}
        strokeLinecap="round"
      />
    );
  }
  const pr = rr * (f.baby ? 0.64 : 0.56) * (f.mood === 'curious' ? 1.12 : 1);
  const lx = f.look.x * rr * 0.3 + rr * 0.1;
  const ly = f.look.y * rr * 0.3 + (f.mood === 'sad' ? rr * 0.2 : 0);
  return (
    <g className="d-eye" style={origin(x, y)}>
      <circle cx={x} cy={y} r={rr} fill="#fff" stroke={OUTLINE} strokeWidth={f.sw * 0.72} />
      <circle cx={x + lx} cy={y + ly} r={pr} fill={OUTLINE} />
      <circle cx={x + lx - pr * 0.3} cy={y + ly - pr * 0.36} r={pr * 0.42} fill="#fff" />
      {f.baby && <circle cx={x + lx + pr * 0.38} cy={y + ly + pr * 0.36} r={pr * 0.18} fill="#fff" />}
    </g>
  );
}

function Brow({ x, y, r, f }: { x: number; y: number; r: number; f: FaceCtx }) {
  if (f.mood !== 'sad') return null;
  const rr = f.baby ? r * 1.38 : r;
  return (
    <path
      className="d-brow"
      d={`M${x - rr * 1.0} ${y - rr * 1.2} L ${x + rr * 0.85} ${y - rr * 1.65}`}
      stroke={OUTLINE}
      strokeWidth={f.sw * 0.95}
      strokeLinecap="round"
    />
  );
}

function Blush({ x, y, r, f }: { x: number; y: number; r: number; f: FaceCtx }) {
  return (
    <ellipse
      className="d-blush"
      cx={x}
      cy={y}
      rx={r}
      ry={r * 0.56}
      fill="#FF6F9C"
      opacity={f.baby ? 0.6 : 0.34}
    />
  );
}

/** A generic cartoon mouth. `openable` adds a hidden open-mouth used by CSS action animations. */
function Mouth({ x, y, w, f, openable }: { x: number; y: number; w: number; f: FaceCtx; openable?: boolean }) {
  let closed: ReactNode;
  if (f.mood === 'sad') {
    closed = (
      <path
        d={`M${x - w * 0.75} ${y + w * 0.35} Q ${x} ${y - w * 0.35} ${x + w * 0.75} ${y + w * 0.35}`}
        fill="none"
        stroke={OUTLINE}
        strokeWidth={f.sw * 0.85}
        strokeLinecap="round"
      />
    );
  } else if (f.mood === 'curious') {
    closed = <ellipse cx={x} cy={y} rx={w * 0.34} ry={w * 0.42} fill={MOUTH_FILL} stroke={OUTLINE} strokeWidth={f.sw * 0.7} />;
  } else if (f.mood === 'happy' || f.baby) {
    closed = (
      <g>
        <path
          d={`M${x - w} ${y - w * 0.15} Q ${x} ${y + w * 1.25} ${x + w} ${y - w * 0.15} Z`}
          fill={MOUTH_FILL}
          stroke={OUTLINE}
          strokeWidth={f.sw * 0.75}
          strokeLinejoin="round"
        />
        <ellipse cx={x} cy={y + w * 0.42} rx={w * 0.45} ry={w * 0.22} fill={TONGUE} />
      </g>
    );
  } else {
    closed = (
      <path
        d={`M${x - w} ${y} Q ${x} ${y + w * 0.95} ${x + w} ${y}`}
        fill="none"
        stroke={OUTLINE}
        strokeWidth={f.sw * 0.85}
        strokeLinecap="round"
      />
    );
  }
  return (
    <g>
      <g className="d-mouth">{closed}</g>
      {openable && (
        <g className="d-mouth-open" style={origin(x, y)}>
          <ellipse cx={x} cy={y + w * 0.3} rx={w * 0.8} ry={w * 1.05} fill={MOUTH_FILL} stroke={OUTLINE} strokeWidth={f.sw * 0.75} />
          <ellipse cx={x} cy={y + w * 0.85} rx={w * 0.45} ry={w * 0.3} fill={TONGUE} />
        </g>
      )}
    </g>
  );
}

function HatMarks({ pattern, color }: { pattern: EggPattern; color: string }) {
  switch (pattern) {
    case 'stripes':
      return <path d="M-20 -12 q 8 3 13 -3 M20 -18 q -7 2 -11 -2" stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />;
    case 'spots':
      return (
        <g fill={color}>
          <circle cx={-8} cy={-12} r={5} />
          <circle cx={9} cy={-20} r={4} />
          <circle cx={12} cy={-7} r={2.5} />
        </g>
      );
    case 'zigzag':
      return <path d="M-20 -12 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6" stroke={color} strokeWidth={3.5} fill="none" strokeLinejoin="round" />;
    case 'triangles':
      return <path d="M-16 -8 l6 -10 l6 10 Z M2 -8 l6 -10 l6 10 Z" fill={color} />;
    case 'diamonds':
      return <path d="M0 -26 l5 8 l-5 8 l-5 -8 Z M-13 -12 l3 5 l-3 5 l-3 -5 Z M13 -12 l3 5 l-3 5 l-3 -5 Z" fill={color} />;
    case 'hearts':
      return <path d={heartPath(-6, -16, 5) + heartPath(9, -8, 3.5)} fill={color} />;
    case 'bumps':
      return (
        <g fill={color} stroke={OUTLINE} strokeWidth={1.5}>
          <circle cx={-8} cy={-12} r={5} />
          <circle cx={8} cy={-14} r={5} />
          <circle cx={0} cy={-25} r={4} />
        </g>
      );
    case 'waves':
      return <path d="M-20 -12 q 5 -5 10 0 t 10 0 t 10 0 t 10 0" stroke={color} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
  }
}

/** the baby's little eggshell hat */
function ShellHat({ kind }: { kind: DinoKind }) {
  const d = DINOS[kind];
  const { x, y, r, s } = d.hat;
  const clipId = `hat-clip-${kind}`;
  const shape = 'M-22 1 C -22 -22, -11 -34, 0 -34 C 11 -34, 22 -22, 22 1 L 16 -5 L 10 2 L 4 -5 L -2 2 L -8 -5 L -14 2 Z';
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <clipPath id={clipId}>
        <path d={shape} />
      </clipPath>
      <path d={shape} fill={d.egg.base} />
      <g clipPath={`url(#${clipId})`}>
        <HatMarks pattern={d.egg.pattern} color={d.egg.mark} />
      </g>
      <path d={shape} fill="none" stroke={OUTLINE} strokeWidth={3.6} strokeLinejoin="round" />
      <ellipse cx={-10} cy={-21} rx={3.5} ry={6} fill="#fff" opacity={0.65} transform="rotate(28 -10 -21)" />
    </g>
  );
}

/** double-stroke tube used for little arms */
function Tube({ d, color, w, f }: { d: string; color: string; w: number; f: FaceCtx }) {
  return (
    <>
      <path d={d} fill="none" stroke={OUTLINE} strokeWidth={w + f.sw * 1.6} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Bodies                                                              */
/* ------------------------------------------------------------------ */

function Trex({ f }: { f: FaceCtx }) {
  const p = f.pal;
  const s = st(f);
  return (
    <>
      <g className="d-tail" style={origin(74, 142)}>
        <path d="M78 124 C 52 124, 26 138, 5 165 C 30 165, 57 161, 82 156 Z" fill={p.body} {...s} />
        <path d="M47 137 q 4 8 1 15" fill="none" stroke={p.accent} strokeWidth={5.5} strokeLinecap="round" />
        <path d="M29 149 q 3 6 1 11" fill="none" stroke={p.accent} strokeWidth={5} strokeLinecap="round" />
      </g>
      <rect x={71} y={148} width={25} height={41} rx={11} fill={p.dark} {...s} />
      <ellipse cx={96} cy={136} rx={40} ry={36} fill={p.body} {...s} />
      <ellipse cx={109} cy={147} rx={23} ry={24} fill={p.belly} />
      <path d="M69 108 q 5 8 3 16 M84 102 q 5 8 3 14 M59 124 q 4 6 3 12" fill="none" stroke={p.accent} strokeWidth={5.5} strokeLinecap="round" />
      <rect x={98} y={150} width={28} height={41} rx={12} fill={p.body} {...s} />
      <path d="M112 191 v-6 M119 191 v-6" stroke={OUTLINE} strokeWidth={2.2} strokeLinecap="round" />
      <g className="d-arm" style={origin(122, 124)}>
        <Tube d="M122 124 q 11 -1 15 10" color={p.body} w={6} f={f} />
      </g>
      <g className="d-head" style={origin(112, 108)}>
        <g className="d-jaw" style={origin(110, 97)}>
          <path d="M112 97 L 180 97 L 178 70 L 112 86 Z" fill={MOUTH_FILL} />
          <path d="M126 96 C 136 88, 156 88, 164 96 Z" fill={TONGUE} />
          <path d="M106 95 L 180 95 C 183 106, 170 117, 148 118 C 124 119, 108 110, 106 95 Z" fill={p.body} {...s} />
          <path d="M119 106 C 133 112, 156 112, 169 104" fill="none" stroke={p.belly} strokeWidth={5} strokeLinecap="round" />
        </g>
        <path d="M104 98 C 96 70, 110 38, 144 36 C 174 34, 194 52, 192 76 C 191 90, 184 98, 172 98 Z" fill={p.body} {...s} />
        <path
          d={f.baby ? 'M150 98 l3.5 6 l3.5 -6 M164 98 l3.5 6 l3.5 -6' : 'M128 98 l3.5 6 l3.5 -6 M146 98 l3.5 6 l3.5 -6 M164 98 l3.5 6 l3.5 -6'}
          fill="#fff"
          stroke={OUTLINE}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <path d="M121 45 q 1 8 -3 14 M109 60 q 2 7 -1 12" fill="none" stroke={p.accent} strokeWidth={5} strokeLinecap="round" />
        <ellipse cx={182} cy={63} rx={2.6} ry={3.6} fill={OUTLINE} />
        <Blush x={163} y={84} r={9} f={f} />
        <Eye x={150} y={62} r={10} f={f} />
        <Brow x={150} y={62} r={10} f={f} />
        {f.baby && <ShellHat kind="trex" />}
      </g>
    </>
  );
}

function Brachio({ f }: { f: FaceCtx }) {
  const p = f.pal;
  const s = st(f);
  return (
    <>
      <g className="d-tail" style={origin(56, 146)}>
        <path d="M58 133 C 36 135, 16 148, 3 170 C 24 167, 44 160, 62 156 Z" fill={p.body} {...s} />
      </g>
      <rect x={54} y={150} width={20} height={39} rx={9} fill={p.dark} {...s} />
      <rect x={110} y={150} width={20} height={39} rx={9} fill={p.dark} {...s} />
      <g className="d-neck" style={origin(124, 134)}>
        <path d="M106 134 C 108 98, 120 66, 140 46 L 162 56 C 146 74, 140 104, 140 136 Z" fill={p.body} {...s} />
        <circle cx={128} cy={102} r={4.5} fill={p.accent} />
        <circle cx={137} cy={79} r={3.6} fill={p.accent} />
        <circle cx={124} cy={121} r={3.2} fill={p.accent} />
        <g className="d-head" style={origin(150, 56)}>
          <ellipse cx={144} cy={34} rx={11} ry={9} fill={p.body} {...s} />
          <ellipse cx={157} cy={46} rx={26} ry={17} fill={p.body} {...s} />
          <circle cx={146} cy={52} r={3} fill={p.accent} />
          <ellipse cx={179} cy={41} rx={2} ry={2.7} fill={OUTLINE} />
          <Blush x={165} y={53} r={7} f={f} />
          <Eye x={158} y={40} r={7} f={f} />
          <Brow x={158} y={40} r={7} f={f} />
          <Mouth x={173} y={52} w={4.5} f={f} openable />
          {f.baby && <ShellHat kind="brachio" />}
        </g>
      </g>
      <ellipse cx={88} cy={140} rx={50} ry={32} fill={p.body} {...s} />
      <ellipse cx={92} cy={155} rx={34} ry={12} fill={p.belly} />
      <g fill={p.accent}>
        <circle cx={68} cy={126} r={7} />
        <circle cx={90} cy={119} r={5} />
        <circle cx={105} cy={134} r={8} />
        <circle cx={57} cy={145} r={5} />
        <circle cx={81} cy={140} r={4} />
        <circle cx={120} cy={122} r={3.5} />
      </g>
      <rect x={66} y={154} width={22} height={37} rx={10} fill={p.body} {...s} />
      <rect x={120} y={152} width={22} height={39} rx={10} fill={p.body} {...s} />
    </>
  );
}

function Croc({ f }: { f: FaceCtx }) {
  const p = f.pal;
  const s = st(f);
  return (
    <>
      <g className="d-tail" style={origin(62, 156)}>
        <path d="M14 156 l6 -10 l5 8 l6 -11 l5 8 l6 -11 l5 8 l6 -11 l5 8 l6 -10 l4 10 Z" fill={p.accent} {...s} strokeWidth={f.sw * 0.7} />
        <path d="M66 142 C 42 140, 18 147, 2 161 C 18 171, 42 172, 68 168 Z" fill={p.body} {...s} />
      </g>
      <path d={spikesOnEllipse(90, 156, 48, 24, -160, -20, 8, 9)} fill={p.accent} {...s} strokeWidth={f.sw * 0.7} />
      <rect x={60} y={158} width={18} height={31} rx={8} fill={p.dark} {...s} />
      <rect x={112} y={158} width={18} height={31} rx={8} fill={p.dark} {...s} />
      <ellipse cx={90} cy={156} rx={48} ry={24} fill={p.body} {...s} />
      <path d="M50 165 C 70 182, 112 182, 132 165 C 112 173, 70 173, 50 165 Z" fill={p.belly} />
      <g fill={p.dark} opacity={0.5}>
        <circle cx={70} cy={146} r={3} />
        <circle cx={86} cy={142} r={3.4} />
        <circle cx={102} cy={144} r={3} />
        <circle cx={78} cy={155} r={2.4} />
        <circle cx={96} cy={154} r={2.6} />
      </g>
      <rect x={72} y={162} width={20} height={29} rx={9} fill={p.body} {...s} />
      <rect x={120} y={160} width={20} height={31} rx={9} fill={p.body} {...s} />
      <g className="d-head" style={origin(126, 152)}>
        <g className="d-jaw" style={origin(130, 153)}>
          <path d="M131 152 L 189 152 L 187 138 L 133 139 Z" fill={MOUTH_FILL} />
          <path d="M146 151 C 154 145, 168 145, 174 151 Z" fill={TONGUE} />
          <path d="M127 151 L 190 151 C 197 157, 191 167, 178 167 L 140 167 C 130 167, 125 159, 127 151 Z" fill={p.body} {...s} />
          <path d="M150 152 l3 -6 l3 6 M166 152 l3 -6 l3 6 M181 152 l3 -6 l3 6" fill="#fff" stroke={OUTLINE} strokeWidth={1.6} strokeLinejoin="round" />
          <path d="M141 161 L 180 161" stroke={p.belly} strokeWidth={4} strokeLinecap="round" />
        </g>
        <circle cx={142} cy={126} r={13} fill={p.body} {...s} />
        <path d="M122 153 C 118 134, 130 125, 148 127 L 186 134 C 199 137, 199 151, 190 153 Z" fill={p.body} {...s} />
        <path d="M144 153 l3 6 l3 -6 M158 153 l3 6 l3 -6 M172 153 l3 6 l3 -6" fill="#fff" stroke={OUTLINE} strokeWidth={1.6} strokeLinejoin="round" />
        <path d="M121 146 q 3 8 11 8" fill="none" stroke={OUTLINE} strokeWidth={f.sw * 0.8} strokeLinecap="round" />
        <ellipse cx={189} cy={137} rx={2.3} ry={2.9} fill={OUTLINE} />
        <Blush x={160} y={143} r={7} f={f} />
        <Eye x={142} y={123} r={8} f={f} />
        <Brow x={142} y={123} r={8} f={f} />
        {f.baby && <ShellHat kind="croc" />}
      </g>
    </>
  );
}

function Trice({ f }: { f: FaceCtx }) {
  const p = f.pal;
  const s = st(f);
  return (
    <>
      <g className="d-tail" style={origin(54, 148)}>
        <path d="M56 133 C 36 136, 20 146, 9 165 C 28 163, 45 157, 60 154 Z" fill={p.body} {...s} />
      </g>
      <rect x={52} y={150} width={22} height={39} rx={10} fill={p.dark} {...s} />
      <rect x={100} y={150} width={22} height={39} rx={10} fill={p.dark} {...s} />
      <ellipse cx={82} cy={140} rx={46} ry={33} fill={p.body} {...s} />
      <ellipse cx={88} cy={157} rx={30} ry={11} fill={p.belly} />
      <path d="M50 127 l7 -11 l7 11 Z M66 119 l7 -11 l7 11 Z M83 118 l7 -11 l7 11 Z" fill={p.accent} stroke={OUTLINE} strokeWidth={2} strokeLinejoin="round" />
      <rect x={64} y={154} width={24} height={37} rx={11} fill={p.body} {...s} />
      <rect x={110} y={152} width={24} height={39} rx={11} fill={p.body} {...s} />
      <g className="d-head" style={origin(124, 130)}>
        <path d={scallop(130, 104, 38, 12)} fill={p.accent} {...s} />
        <circle cx={130} cy={104} r={25} fill={p.accent2} />
        <g fill="#fff" opacity={0.75}>
          <circle cx={104} cy={86} r={3} />
          <circle cx={114} cy={74} r={3} />
          <circle cx={100} cy={102} r={3} />
          <circle cx={104} cy={119} r={3} />
        </g>
        <path d="M151 96 C 153 78, 157 68, 165 58 C 167 72, 165 86, 161 98 Z" fill={p.horn} {...s} />
        <path d="M126 120 C 124 100, 140 90, 158 93 C 178 96, 192 108, 192 122 C 192 136, 184 142, 170 142 L 142 144 C 130 144, 126 134, 126 120 Z" fill={p.body} {...s} />
        <path d="M181 112 C 192 113, 199 122, 197 133 C 191 138, 183 137, 178 131 Z" fill={p.beak} {...s} />
        <path d="M136 100 C 135 80, 140 66, 149 54 C 153 68, 151 86, 148 100 Z" fill={p.horn} {...s} />
        <path d="M173 104 C 174 96, 177 91, 183 87 C 185 95, 184 102, 181 107 Z" fill={p.horn} {...s} />
        <Blush x={165} y={129} r={8} f={f} />
        <Eye x={156} y={114} r={8} f={f} />
        <Brow x={156} y={114} r={8} f={f} />
        <Mouth x={176} y={134} w={4.5} f={f} />
        {f.baby && <ShellHat kind="trice" />}
      </g>
    </>
  );
}

const STEGO_PLATES = [
  { x: 50, y: 129, a: -54, s: 13 },
  { x: 64, y: 118, a: -33, s: 17 },
  { x: 82, y: 112, a: -12, s: 20 },
  { x: 102, y: 112, a: 9, s: 20 },
  { x: 120, y: 117, a: 29, s: 17 },
  { x: 135, y: 127, a: 50, s: 13 },
];
const plateD = (s: number) =>
  `M ${-s * 0.5} 7 L ${-s * 0.74} ${-s * 0.72} L 0 ${-s * 1.75} L ${s * 0.74} ${-s * 0.72} L ${s * 0.5} 7 Z`;

function Stego({ f }: { f: FaceCtx }) {
  const p = f.pal;
  const s = st(f);
  return (
    <>
      <g className="d-plates">
        {STEGO_PLATES.map((pl, i) => (
          <g key={i} className="d-plate" style={{ ...origin(pl.x, pl.y), animationDelay: `${i * 0.07}s` }}>
            <path d={plateD(pl.s)} transform={`translate(${pl.x} ${pl.y}) rotate(${pl.a})`} fill={i % 2 ? p.accent2 : p.accent} {...s} />
          </g>
        ))}
      </g>
      <g className="d-tail" style={origin(54, 150)}>
        <path d="M17 127 L 0 108 L 25 121 Z M28 135 L 20 111 L 36 130 Z" fill={p.horn} {...s} />
        <path d="M56 139 C 38 138, 19 130, 6 116 C 10 139, 28 155, 54 160 Z" fill={p.body} {...s} />
      </g>
      <rect x={58} y={152} width={22} height={37} rx={10} fill={p.dark} {...s} />
      <rect x={112} y={152} width={22} height={37} rx={10} fill={p.dark} {...s} />
      <ellipse cx={94} cy={142} rx={52} ry={30} fill={p.body} {...s} />
      <ellipse cx={98} cy={158} rx={36} ry={10} fill={p.belly} />
      <path d="M72 132 l4 6 l-4 6 l-4 -6 Z M94 128 l5 7 l-5 7 l-5 -7 Z M116 132 l4 6 l-4 6 l-4 -6 Z" fill={p.accent} />
      <rect x={70} y={156} width={24} height={35} rx={11} fill={p.body} {...s} />
      <rect x={122} y={154} width={24} height={37} rx={11} fill={p.body} {...s} />
      <g className="d-head" style={origin(146, 148)}>
        <ellipse cx={162} cy={145} rx={23} ry={17} fill={p.body} {...s} />
        <ellipse cx={182} cy={140} rx={1.8} ry={2.4} fill={OUTLINE} />
        <Blush x={170} y={152} r={6.5} f={f} />
        <Eye x={166} y={139} r={6.5} f={f} />
        <Brow x={166} y={139} r={6.5} f={f} />
        <Mouth x={180} y={150} w={3.8} f={f} />
        {f.baby && <ShellHat kind="stego" />}
      </g>
    </>
  );
}

function Ptero({ f }: { f: FaceCtx }) {
  const p = f.pal;
  const s = st(f);
  const wingL = 'M94 106 C 72 90, 42 78, 8 82 C 20 96, 22 112, 16 128 C 32 122, 46 126, 56 138 C 66 128, 80 128, 92 134 Z';
  const wingR = 'M106 106 C 128 90, 158 78, 192 82 C 180 96, 178 112, 184 128 C 168 122, 154 126, 144 138 C 134 128, 120 128, 108 134 Z';
  return (
    <>
      <g className="d-wing-l" style={origin(96, 112)}>
        <path d={wingL} fill={p.accent2} {...s} />
        <path d="M94 107 C 72 93, 42 82, 10 83" fill="none" stroke={p.body} strokeWidth={6} strokeLinecap="round" />
        <path d={heartPath(50, 106, 6) + heartPath(72, 116, 4)} fill="#fff" />
      </g>
      <g className="d-wing-r" style={origin(104, 112)}>
        <path d={wingR} fill={p.accent2} {...s} />
        <path d="M106 107 C 128 93, 158 82, 190 83" fill="none" stroke={p.body} strokeWidth={6} strokeLinecap="round" />
        <path d={heartPath(150, 106, 6) + heartPath(128, 116, 4)} fill="#fff" />
      </g>
      <Tube d="M92 152 L 89 168 M108 152 L 111 168" color={p.beak} w={4} f={f} />
      <ellipse cx={100} cy={130} rx={21} ry={28} fill={p.body} {...s} />
      <ellipse cx={100} cy={138} rx={12} ry={17} fill={p.belly} />
      <path d={heartPath(100, 136, 4.5)} fill={p.accent} opacity={0.8} />
      <g className="d-head" style={origin(100, 104)}>
        <path d="M92 68 C 80 56, 64 50, 47 50 C 56 62, 70 74, 88 84 Z" fill={p.accent} {...s} />
        <circle cx={102} cy={80} r={22} fill={p.body} {...s} />
        <path d="M116 74 C 136 74, 156 80, 172 88 C 156 95, 134 96, 116 92 Z" fill={p.beak} {...s} />
        <path d="M120 86 C 136 88, 152 88, 167 88" fill="none" stroke={OUTLINE} strokeWidth={2} strokeLinecap="round" />
        <Blush x={96} y={91} r={7} f={f} />
        <Eye x={106} y={76} r={8} f={f} />
        <Brow x={106} y={76} r={8} f={f} />
        {f.baby && <ShellHat kind="ptero" />}
      </g>
    </>
  );
}

const ANKY_BUMPS: [number, number][] = [
  [76, 124], [100, 120], [124, 124],
  [58, 142], [82, 139], [106, 138], [130, 141],
  [48, 159], [70, 157], [94, 156], [118, 156], [140, 159],
];

function Ankylo({ f }: { f: FaceCtx }) {
  const p = f.pal;
  const s = st(f);
  return (
    <>
      <g className="d-tail" style={origin(56, 158)}>
        <path d="M60 150 L 24 146 C 19 150, 19 157, 24 161 L 60 166 Z" fill={p.body} {...s} />
        <path d="M6 150 L -2 144 L 8 144 Z M14 141 L 12 132 L 20 140 Z M26 150 L 34 144 L 30 154 Z" fill={p.horn} {...s} strokeWidth={f.sw * 0.7} />
        <ellipse cx={16} cy={153} rx={14} ry={12} fill={p.dark} {...s} />
        <circle cx={11} cy={148} r={3.2} fill={p.accent2} />
        <circle cx={20} cy={157} r={2.4} fill={p.accent2} />
      </g>
      <path d="M46 148 L 30 143 L 42 158 Z M42 162 L 28 164 L 42 170 Z" fill={p.horn} {...s} strokeWidth={f.sw * 0.8} />
      <rect x={60} y={162} width={20} height={27} rx={8} fill={p.dark} {...s} />
      <rect x={118} y={162} width={20} height={27} rx={8} fill={p.dark} {...s} />
      <path d="M40 168 C 38 128, 66 106, 100 106 C 134 106, 160 128, 160 168 C 130 176, 70 176, 40 168 Z" fill={p.body} {...s} />
      <path d="M46 167 C 72 173, 128 173, 154 167" fill="none" stroke={p.belly} strokeWidth={5} strokeLinecap="round" />
      {ANKY_BUMPS.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={7.5} fill={p.accent} stroke={OUTLINE} strokeWidth={2} />
          <circle cx={x - 2.5} cy={y - 2.6} r={2.3} fill={p.accent2} />
        </g>
      ))}
      <rect x={70} y={164} width={22} height={27} rx={9} fill={p.body} {...s} />
      <rect x={126} y={164} width={22} height={27} rx={9} fill={p.body} {...s} />
      <g className="d-head" style={origin(156, 158)}>
        <path d="M156 140 L 149 126 L 165 136 Z M172 136 L 176 122 L 183 139 Z" fill={p.horn} {...s} />
        <ellipse cx={170} cy={152} rx={23} ry={17} fill={p.body} {...s} />
        <ellipse cx={190} cy={148} rx={1.8} ry={2.4} fill={OUTLINE} />
        <Blush x={177} y={159} r={6.5} f={f} />
        <Eye x={173} y={146} r={7} f={f} />
        <Brow x={173} y={146} r={7} f={f} />
        <Mouth x={186} y={158} w={3.8} f={f} />
        {f.baby && <ShellHat kind="ankylo" />}
      </g>
    </>
  );
}

function Para({ f }: { f: FaceCtx }) {
  const p = f.pal;
  const s = st(f);
  return (
    <>
      <g className="d-tail" style={origin(62, 142)}>
        <path d="M64 128 C 40 130, 20 142, 5 165 C 28 161, 48 153, 68 148 Z" fill={p.body} {...s} />
      </g>
      <rect x={62} y={152} width={22} height={37} rx={10} fill={p.dark} {...s} />
      <rect x={104} y={152} width={22} height={37} rx={10} fill={p.dark} {...s} />
      <g className="d-head" style={origin(118, 124)}>
        <path d="M100 128 C 104 100, 118 82, 134 70 L 153 84 C 139 96, 133 110, 134 130 Z" fill={p.body} {...s} />
        <path d="M117 100 q 5 -5 10 0 M113 114 q 5 -5 10 0" stroke="#fff" strokeWidth={3.5} fill="none" strokeLinecap="round" />
        <g className="d-crest" style={origin(140, 62)}>
          <path d="M142 56 C 124 38, 100 28, 78 30 C 71 36, 75 45, 84 46 C 104 46, 124 55, 136 68 Z" fill={p.accent} {...s} />
          <path d="M130 51 C 116 42, 99 37, 85 37" stroke="#FFD29A" strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>
        <ellipse cx={148} cy={66} rx={24} ry={18} fill={p.body} {...s} />
        <path d="M164 60 C 182 58, 195 65, 193 76 C 187 83, 174 81, 163 76 Z" fill={p.beak} {...s} />
        <ellipse cx={185} cy={64} rx={1.8} ry={2.3} fill={OUTLINE} />
        <Blush x={155} y={74} r={6.5} f={f} />
        <Eye x={150} y={60} r={7} f={f} />
        <Brow x={150} y={60} r={7} f={f} />
        <Mouth x={176} y={73} w={4.2} f={f} />
        {f.baby && <ShellHat kind="para" />}
      </g>
      <ellipse cx={88} cy={136} rx={42} ry={33} fill={p.body} {...s} />
      <ellipse cx={96} cy={152} rx={26} ry={13} fill={p.belly} />
      <path d="M58 120 q 6 -6 12 0 t 12 0 t 12 0 t 12 0 M52 136 q 6 -6 12 0 t 12 0 t 12 0" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" />
      <rect x={74} y={154} width={24} height={37} rx={11} fill={p.body} {...s} />
      <rect x={112} y={154} width={24} height={37} rx={11} fill={p.body} {...s} />
      <g className="d-arm" style={origin(120, 134)}>
        <Tube d="M120 134 q 10 3 10 13" color={p.body} w={5.5} f={f} />
      </g>
    </>
  );
}

const BODIES: Record<DinoKind, (props: { f: FaceCtx }) => ReactNode> = {
  trex: Trex,
  brachio: Brachio,
  croc: Croc,
  trice: Trice,
  stego: Stego,
  ptero: Ptero,
  ankylo: Ankylo,
  para: Para,
};

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */

export interface DinoProps {
  kind: DinoKind;
  baby?: boolean;
  mood?: DinoMood;
  acting?: boolean;
  shaking?: boolean;
  look?: { x: number; y: number };
  className?: string;
  style?: CSSProperties;
}

export const Dino = memo(function Dino({
  kind,
  baby = false,
  mood = 'idle',
  acting = false,
  shaking = false,
  look,
  className,
  style,
}: DinoProps) {
  const [blink] = useState(() => (Math.random() * 4).toFixed(2));
  const info = DINOS[kind];
  const f: FaceCtx = {
    mood,
    baby,
    look: look ?? { x: 0, y: 0 },
    sw: baby ? 4.8 : 3.6,
    pal: info.pal,
    kind,
  };
  const Body = BODIES[kind];
  return (
    <svg
      viewBox="0 0 200 200"
      overflow="visible"
      className={cn(
        'dino',
        `k-${kind}`,
        baby && 'is-baby',
        `mood-${mood}`,
        acting && 'acting',
        shaking && 'shaking',
        className,
      )}
      style={{ ...style, ['--blink-delay' as string]: `${blink}s` }}
      aria-hidden="true"
    >
      <ellipse
        className="d-shadow"
        cx={100}
        cy={kind === 'ptero' ? 190 : 191}
        rx={kind === 'ptero' ? 34 : kind === 'croc' ? 74 : 62}
        ry={7}
        fill="#1b2a10"
        opacity={0.16}
        style={origin(100, 191)}
      />
      <g className="d-all" style={origin(100, 190)}>
        <Body f={f} />
      </g>
    </svg>
  );
});
