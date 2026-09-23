import { memo, type CSSProperties } from 'react';
import { OUTLINE } from '../game/dinos';

export type HiderType = 'bush' | 'fern' | 'rock';
export type CritterKind = 'butterfly' | 'frog' | 'ladybug';

const origin = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` });

const BUSH: [number, number, number][] = [
  [34, 82, 28],
  [60, 60, 32],
  [100, 56, 34],
  [128, 80, 28],
  [80, 88, 30],
  [50, 98, 20],
  [112, 98, 20],
];

function Bush() {
  return (
    <>
      <ellipse cx={80} cy={116} rx={66} ry={8} fill="#1b3a10" opacity={0.2} />
      <g fill={OUTLINE}>
        {BUSH.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r + 4.2} />
        ))}
      </g>
      <g fill="#3E9F48">
        {BUSH.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>
      <g fill="#58BE55">
        {[
          [58, 54, 22],
          [98, 49, 24],
          [34, 77, 18],
          [127, 75, 18],
          [80, 80, 20],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>
      <g fill="#8EDC72" opacity={0.85}>
        {[
          [50, 44, 8],
          [91, 38, 9],
          [28, 70, 6],
          [121, 68, 6],
          [74, 74, 6],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>
      {[
        [44, 76],
        [87, 64],
        [117, 86],
        [66, 98],
        [132, 98],
        [100, 94],
        [110, 44],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={5.2} fill="#FF5470" stroke={OUTLINE} strokeWidth={2} />
          <circle cx={x - 1.6} cy={y - 1.8} r={1.6} fill="#fff" />
        </g>
      ))}
    </>
  );
}

function fernLeaf(len: number, w: number, n = 7) {
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const hw = w * Math.sin(Math.PI * t);
    const y = -len * t;
    const y2 = -len * (t + 0.5 / (n + 1));
    left.push(`L${(-hw).toFixed(1)} ${y.toFixed(1)} L${(-hw * 0.35).toFixed(1)} ${y2.toFixed(1)}`);
    right.unshift(`L${(hw * 0.35).toFixed(1)} ${y2.toFixed(1)} L${hw.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M0 0 ${left.join(' ')} L0 ${-len} ${right.join(' ')} Z`;
}

const FERN = [
  { a: -66, l: 66 },
  { a: 66, l: 64 },
  { a: -42, l: 86 },
  { a: 42, l: 84 },
  { a: -16, l: 100 },
  { a: 16, l: 98 },
];

function Fern() {
  const leaves = FERN.map((f) => ({ ...f, d: fernLeaf(f.l, 17) }));
  return (
    <>
      <ellipse cx={80} cy={116} rx={56} ry={7} fill="#1b3a10" opacity={0.2} />
      <g transform="translate(80 114)">
        {leaves.map((f, i) => (
          <path key={`o${i}`} d={f.d} transform={`rotate(${f.a})`} fill={OUTLINE} stroke={OUTLINE} strokeWidth={8} strokeLinejoin="round" />
        ))}
        {leaves.map((f, i) => (
          <g key={`f${i}`} transform={`rotate(${f.a})`}>
            <path d={f.d} fill={i % 2 ? '#8ACB3A' : '#A6DB4E'} />
            <path d={`M0 0 L0 ${-f.l * 0.92}`} stroke="#E4F7A0" strokeWidth={2.4} strokeLinecap="round" />
          </g>
        ))}
        <circle cx={0} cy={-4} r={9} fill="#7DBE33" stroke={OUTLINE} strokeWidth={3} />
        {[
          [-30, -44],
          [26, -60],
          [2, -78],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx={0} cy={-4} rx={3} ry={4.4} fill="#FFFFFF" stroke={OUTLINE} strokeWidth={1.3} transform={`rotate(${a})`} />
            ))}
            <circle r={2.6} fill="#FFC93C" stroke={OUTLINE} strokeWidth={1.2} />
          </g>
        ))}
      </g>
    </>
  );
}

function Rock() {
  return (
    <>
      <ellipse cx={80} cy={116} rx={66} ry={8} fill="#1b3a10" opacity={0.2} />
      <path
        d="M16 114 C 8 92, 22 60, 54 50 C 84 40, 122 48, 140 74 C 154 94, 150 112, 140 114 Z"
        fill="#ABA5BD"
      />
      <path d="M14 104 C 40 114, 116 116, 148 100 C 148 108, 145 114, 140 114 L 16 114 Z" fill="#8D86A3" />
      <path
        d="M16 114 C 8 92, 22 60, 54 50 C 84 40, 122 48, 140 74 C 154 94, 150 112, 140 114 Z"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={4.5}
        strokeLinejoin="round"
      />
      <path d="M38 70 C 50 58, 72 52, 90 53" stroke="#DCD7EA" strokeWidth={7} strokeLinecap="round" fill="none" />
      <ellipse cx={106} cy={86} rx={8} ry={5} fill="#958EAB" />
      <ellipse cx={58} cy={94} rx={6} ry={4} fill="#958EAB" />
      <ellipse cx={128} cy={96} rx={4} ry={3} fill="#958EAB" />
      <path
        d="M58 51 C 68 38, 98 36, 116 50 C 108 56, 98 50, 92 56 C 84 51, 72 58, 58 51 Z"
        fill="#6CC04A"
        stroke={OUTLINE}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d="M121 62 l -6 10 l 6 6 l -4 10" stroke={OUTLINE} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(88 40)">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={0} cy={-5} rx={3.4} ry={5} fill="#FFF" stroke={OUTLINE} strokeWidth={1.4} transform={`rotate(${a})`} />
        ))}
        <circle r={3} fill="#FFC93C" stroke={OUTLINE} strokeWidth={1.4} />
      </g>
    </>
  );
}

export const HiderArt = memo(function HiderArt({ type, className }: { type: HiderType; className?: string }) {
  return (
    <svg viewBox="0 0 160 120" overflow="visible" className={className} aria-hidden="true">
      {type === 'bush' ? <Bush /> : type === 'fern' ? <Fern /> : <Rock />}
    </svg>
  );
});

/* ------------------------------------------------------------------ */
/* Critters                                                            */
/* ------------------------------------------------------------------ */

export function Butterfly({ className, colors = ['#FFB347', '#FF8FB8'] }: { className?: string; colors?: [string, string] }) {
  return (
    <svg viewBox="0 0 60 50" overflow="visible" className={className} aria-hidden="true">
      <g className="bf-wing" style={origin(30, 26)}>
        <path d="M30 24 C 20 4, 1 3, 4 18 C 6 27, 18 29, 30 26 Z" fill={colors[0]} stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />
        <path d="M30 26 C 18 30, 7 39, 13 45 C 19 49, 28 39, 30 28 Z" fill={colors[1]} stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />
        <circle cx={13} cy={15} r={3.2} fill="#fff" />
      </g>
      <g transform="translate(60 0) scale(-1 1)">
        <g className="bf-wing" style={origin(30, 26)}>
          <path d="M30 24 C 20 4, 1 3, 4 18 C 6 27, 18 29, 30 26 Z" fill={colors[0]} stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />
          <path d="M30 26 C 18 30, 7 39, 13 45 C 19 49, 28 39, 30 28 Z" fill={colors[1]} stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />
          <circle cx={13} cy={15} r={3.2} fill="#fff" />
        </g>
      </g>
      <ellipse cx={30} cy={27} rx={3.2} ry={11} fill={OUTLINE} />
      <path d="M29 17 q -4 -8 -9 -10 M31 17 q 4 -8 9 -10" stroke={OUTLINE} strokeWidth={2} fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Frog() {
  return (
    <svg viewBox="0 0 80 64" overflow="visible" aria-hidden="true" className="h-full w-full">
      <ellipse cx={40} cy={61} rx={28} ry={4} fill="#000" opacity={0.15} />
      <ellipse cx={16} cy={50} rx={14} ry={9} fill="#4FAE45" stroke={OUTLINE} strokeWidth={3} />
      <ellipse cx={64} cy={50} rx={14} ry={9} fill="#4FAE45" stroke={OUTLINE} strokeWidth={3} />
      <circle cx={27} cy={22} r={10} fill="#6CCB55" stroke={OUTLINE} strokeWidth={3} />
      <circle cx={53} cy={22} r={10} fill="#6CCB55" stroke={OUTLINE} strokeWidth={3} />
      <ellipse cx={40} cy={42} rx={25} ry={18} fill="#6CCB55" stroke={OUTLINE} strokeWidth={3} />
      <ellipse cx={40} cy={49} rx={14} ry={8} fill="#DDF6B6" />
      <circle cx={27} cy={22} r={6.5} fill="#fff" />
      <circle cx={53} cy={22} r={6.5} fill="#fff" />
      <circle cx={28} cy={23} r={3.6} fill={OUTLINE} />
      <circle cx={52} cy={23} r={3.6} fill={OUTLINE} />
      <path d="M29 38 Q 40 47 51 38" stroke={OUTLINE} strokeWidth={3} fill="none" strokeLinecap="round" />
      <ellipse cx={22} cy={37} rx={4} ry={2.4} fill="#FF7FA0" opacity={0.7} />
      <ellipse cx={58} cy={37} rx={4} ry={2.4} fill="#FF7FA0" opacity={0.7} />
      <ellipse cx={30} cy={59} rx={6} ry={3} fill="#4FAE45" stroke={OUTLINE} strokeWidth={2.5} />
      <ellipse cx={50} cy={59} rx={6} ry={3} fill="#4FAE45" stroke={OUTLINE} strokeWidth={2.5} />
    </svg>
  );
}

function Ladybug() {
  return (
    <svg viewBox="0 0 60 50" overflow="visible" aria-hidden="true" className="h-full w-full">
      <path d="M44 16 q 4 -8 10 -9 M44 36 q 4 8 10 9" stroke={OUTLINE} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <circle cx={44} cy={26} r={9} fill={OUTLINE} />
      <circle cx={47} cy={22} r={2} fill="#fff" />
      <circle cx={47} cy={30} r={2} fill="#fff" />
      <g className="lb-wing" style={origin(40, 26)}>
        <path d="M40 26 C 40 8, 10 6, 10 26 Z" fill="#FF4D5E" stroke={OUTLINE} strokeWidth={2.6} strokeLinejoin="round" />
        <circle cx={22} cy={16} r={3.4} fill={OUTLINE} />
        <circle cx={31} cy={20} r={2.6} fill={OUTLINE} />
      </g>
      <g className="lb-wing lb-wing-b" style={origin(40, 26)}>
        <path d="M40 26 C 40 44, 10 46, 10 26 Z" fill="#FF4D5E" stroke={OUTLINE} strokeWidth={2.6} strokeLinejoin="round" />
        <circle cx={22} cy={36} r={3.4} fill={OUTLINE} />
        <circle cx={31} cy={32} r={2.6} fill={OUTLINE} />
      </g>
      <circle cx={18} cy={24} r={2.6} fill="#fff" opacity={0.7} />
    </svg>
  );
}

export function Critter({ kind }: { kind: CritterKind }) {
  if (kind === 'butterfly') return <Butterfly className="h-full w-full" colors={['#8FD3FF', '#C9A7FF']} />;
  if (kind === 'frog') return <Frog />;
  return <Ladybug />;
}
