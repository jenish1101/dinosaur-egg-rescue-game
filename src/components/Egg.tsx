import { memo, useId, type CSSProperties, type ReactNode } from 'react';
import { DINOS, OUTLINE, type DinoKind, type EggPattern } from '../game/dinos';
import { heartPath } from './Dino';

export const EGG_PATH =
  'M50 4 C 22 4, 6 52, 6 82 C 6 110, 26 126, 50 126 C 74 126, 94 110, 94 82 C 94 52, 78 4, 50 4 Z';

const SPLIT: [number, number][] = [
  [0, 68], [10, 60], [20, 70], [30, 60], [40, 70], [50, 60], [60, 70], [70, 60], [80, 70], [90, 60], [100, 68],
];
const SPLIT_LINE = SPLIT.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
const TOP_CLIP = `M0 -20 L100 -20 L100 68 ${[...SPLIT].reverse().map(([x, y]) => `L${x} ${y}`).join(' ')} Z`;
const BOTTOM_CLIP = `${SPLIT_LINE} L100 150 L0 150 Z`;

function Pattern({ pattern, mark }: { pattern: EggPattern; mark: string }): ReactNode {
  switch (pattern) {
    case 'stripes':
      return (
        <g stroke={mark} strokeWidth={7.5} strokeLinecap="round" fill="none">
          <path d="M-4 30 Q 16 37 31 28" />
          <path d="M-4 57 Q 20 65 37 54" />
          <path d="M-4 85 Q 18 93 35 82" />
          <path d="M-4 111 Q 16 117 31 108" />
          <path d="M104 42 Q 84 49 70 40" />
          <path d="M104 70 Q 80 78 64 68" />
          <path d="M104 98 Q 82 106 66 96" />
          <path d="M60 14 Q 50 20 42 14" strokeWidth={5} />
        </g>
      );
    case 'spots':
      return (
        <g fill={mark}>
          <circle cx={30} cy={40} r={9} />
          <circle cx={62} cy={28} r={7} />
          <circle cx={70} cy={62} r={11} />
          <circle cx={34} cy={80} r={12} />
          <circle cx={60} cy={104} r={9} />
          <circle cx={85} cy={90} r={6} />
          <circle cx={20} cy={108} r={6} />
          <circle cx={47} cy={57} r={5} />
          <circle cx={48} cy={14} r={5} />
        </g>
      );
    case 'zigzag':
      return (
        <g stroke={mark} fill="none" strokeLinejoin="round" strokeLinecap="round">
          <path d="M-4 74 L 8 61 L 20 74 L 32 61 L 44 74 L 56 61 L 68 74 L 80 61 L 92 74 L 104 61" strokeWidth={8.5} />
          <path d="M-4 102 L 8 92 L 20 102 L 32 92 L 44 102 L 56 92 L 68 102 L 80 92 L 92 102 L 104 92" strokeWidth={5} />
          <path d="M18 42 L 28 33 L 38 42 L 48 33 L 58 42 L 68 33 L 78 42" strokeWidth={4.5} />
        </g>
      );
    case 'triangles': {
      const row = (y: number, off: number, s: number) => {
        let d = '';
        for (let x = -10 + off; x < 104; x += s * 2) d += `M${x} ${y} L${x + s} ${y - s * 1.6} L${x + s * 2} ${y} Z `;
        return d;
      };
      return <path d={row(80, 0, 8) + row(108, 8, 8) + row(50, 4, 6)} fill={mark} />;
    }
    case 'diamonds': {
      const dia = (x: number, y: number, s: number) =>
        `M${x} ${y - s} L${x + s * 0.72} ${y} L${x} ${y + s} L${x - s * 0.72} ${y} Z `;
      return (
        <path
          d={dia(50, 30, 11) + dia(50, 64, 13) + dia(50, 100, 11) + dia(24, 48, 7) + dia(76, 48, 7) + dia(22, 86, 8) + dia(78, 86, 8) + dia(34, 114, 5) + dia(66, 114, 5)}
          fill={mark}
        />
      );
    }
    case 'hearts':
      return (
        <path
          d={heartPath(32, 40, 8) + heartPath(66, 30, 6) + heartPath(70, 68, 9) + heartPath(30, 80, 9) + heartPath(54, 106, 8) + heartPath(82, 98, 5) + heartPath(18, 106, 5) + heartPath(50, 12, 4)}
          fill={mark}
        />
      );
    case 'bumps': {
      const pts: [number, number][] = [];
      [18, 40, 62, 84, 106, 124].forEach((y, r) => {
        const xs = r % 2 ? [8, 30, 52, 74, 96] : [19, 41, 63, 85];
        xs.forEach((x) => pts.push([x, y]));
      });
      return (
        <g>
          {pts.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={8} fill={mark} stroke={OUTLINE} strokeWidth={1.8} />
              <circle cx={x - 2.5} cy={y - 2.6} r={2.4} fill="#fff" opacity={0.35} />
            </g>
          ))}
        </g>
      );
    }
    case 'waves':
      return (
        <g stroke={mark} strokeWidth={6} fill="none" strokeLinecap="round">
          {[34, 60, 86, 110].map((y) => (
            <path key={y} d={`M-6 ${y} q 9 -9 18 0 t 18 0 t 18 0 t 18 0 t 18 0 t 18 0`} />
          ))}
        </g>
      );
  }
}

export interface EggProps {
  kind: DinoKind;
  crack?: 0 | 1 | 2;
  half?: 'top' | 'bottom';
  className?: string;
  style?: CSSProperties;
}

export const Egg = memo(function Egg({ kind, crack = 0, half, className, style }: EggProps) {
  const uid = useId().replace(/:/g, '');
  const e = DINOS[kind].egg;
  const eggClip = `egg-${uid}`;
  const halfClip = `half-${uid}`;
  const body = (
    <g>
      <path d={EGG_PATH} fill={e.base} />
      <g clipPath={`url(#${eggClip})`}>
        <Pattern pattern={e.pattern} mark={e.mark} />
        <path
          d="M94 82 C 94 110, 74 126, 50 126 C 72 116, 84 100, 84 78 C 84 56, 76 30, 64 12 C 82 26, 94 56, 94 82 Z"
          fill={e.shade}
          opacity={0.45}
        />
        {half && <path d={SPLIT_LINE} fill="none" stroke={OUTLINE} strokeWidth={4} strokeLinejoin="round" />}
      </g>
      <path d={EGG_PATH} fill="none" stroke={OUTLINE} strokeWidth={4.2} />
      <ellipse cx={30} cy={40} rx={7.5} ry={15} fill="#fff" opacity={0.6} transform="rotate(22 30 40)" />
      <circle cx={24} cy={63} r={3.6} fill="#fff" opacity={0.55} />
      {crack >= 1 && !half && (
        <path
          d="M34 60 L 42 53 L 47 61 L 55 54 L 60 62 M47 61 L 45 69"
          fill="none"
          stroke={OUTLINE}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {crack >= 2 && !half && (
        <path
          d="M8 70 L 18 61 L 28 71 L 34 60 M60 62 L 68 71 L 78 59 L 88 69 L 93 64 M78 59 L 76 50 M18 61 L 16 53 M68 71 L 70 80"
          fill="none"
          stroke={OUTLINE}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </g>
  );
  return (
    <svg viewBox="0 0 100 130" overflow="visible" className={className} style={style} aria-hidden="true">
      <defs>
        <clipPath id={eggClip}>
          <path d={EGG_PATH} />
        </clipPath>
        {half && (
          <clipPath id={halfClip}>
            <path d={half === 'top' ? TOP_CLIP : BOTTOM_CLIP} />
          </clipPath>
        )}
      </defs>
      {half ? <g clipPath={`url(#${halfClip})`}>{body}</g> : body}
    </svg>
  );
});

/** Dashed "missing egg" silhouette used in thought bubbles */
export function GhostEgg({ className, filled }: { className?: string; filled?: string }) {
  return (
    <svg viewBox="0 0 100 130" className={className} aria-hidden="true">
      <path
        d={EGG_PATH}
        fill={filled ?? '#F4EFFA'}
        stroke={filled ? OUTLINE : '#A99BBD'}
        strokeWidth={filled ? 6 : 7}
        strokeDasharray={filled ? undefined : '14 10'}
        strokeLinecap="round"
      />
      {!filled && (
        <text x={50} y={92} textAnchor="middle" fontSize={62} fontWeight={700} fill="#A99BBD" fontFamily="Fredoka, sans-serif">
          ?
        </text>
      )}
    </svg>
  );
}

export function NestBack({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 100" className={className} aria-hidden="true">
      <ellipse cx={100} cy={44} rx={92} ry={30} fill="#8A5530" stroke={OUTLINE} strokeWidth={4} />
      <ellipse cx={100} cy={49} rx={76} ry={20} fill="#55301A" />
      <path d="M44 44 q 20 -8 40 0 M112 40 q 22 -6 42 4 M70 54 q 30 -6 60 2" stroke="#C98E4E" strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={0.7} />
    </svg>
  );
}

export function NestFront({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 100" className={className} aria-hidden="true" overflow="visible">
      <path
        d="M6 44 C 6 96, 194 96, 194 44 C 168 70, 32 70, 6 44 Z"
        fill="#B0723F"
        stroke={OUTLINE}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <g fill="none" strokeLinecap="round">
        <path d="M18 62 C 50 80, 110 84, 160 70 M30 74 C 70 88, 130 88, 176 72 M14 52 C 60 74, 140 76, 186 54" stroke="#7E4A25" strokeWidth={3} />
        <path d="M24 58 C 60 72, 120 76, 150 66 M60 82 C 90 88, 130 86, 160 78 M120 70 C 146 68, 170 62, 182 56" stroke="#DDA262" strokeWidth={2.4} />
      </g>
      <path d="M170 56 l 22 -12 M8 52 l -8 -10 M150 72 l 18 4" stroke={OUTLINE} strokeWidth={6} strokeLinecap="round" />
      <path d="M170 56 l 22 -12 M8 52 l -8 -10 M150 72 l 18 4" stroke="#C88A50" strokeWidth={2.6} strokeLinecap="round" />
    </svg>
  );
}
