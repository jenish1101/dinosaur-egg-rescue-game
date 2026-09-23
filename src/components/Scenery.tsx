import { memo, useMemo, type CSSProperties } from 'react';
import { OUTLINE } from '../game/dinos';
import { mulberry32 } from '../game/levels';
import { Butterfly } from './Hider';

function Sun() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <g className="sun-rays">
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d="M60 4 L 66 20 L 54 20 Z"
            fill="#FFE27A"
            stroke="#F5B83D"
            strokeWidth={2}
            strokeLinejoin="round"
            transform={`rotate(${i * 30} 60 60)`}
          />
        ))}
      </g>
      <g className="sun-face">
        <circle cx={60} cy={60} r={34} fill="#FFD84A" stroke="#F0A93B" strokeWidth={4} />
        <circle cx={60} cy={60} r={27} fill="#FFE68A" opacity={0.6} />
        <path d="M44 56 q 5 -6 10 0 M66 56 q 5 -6 10 0" stroke={OUTLINE} strokeWidth={3.2} fill="none" strokeLinecap="round" />
        <path d="M50 67 Q 60 77 70 67" stroke={OUTLINE} strokeWidth={3.2} fill="none" strokeLinecap="round" />
        <ellipse cx={42} cy={66} rx={5} ry={3} fill="#FF8FA8" opacity={0.7} />
        <ellipse cx={78} cy={66} rx={5} ry={3} fill="#FF8FA8" opacity={0.7} />
      </g>
    </svg>
  );
}

function Cloud() {
  return (
    <svg viewBox="0 0 130 64" className="h-full w-full" aria-hidden="true">
      <g fill="#fff">
        <circle cx={32} cy={40} r={20} />
        <circle cx={56} cy={28} r={24} />
        <circle cx={84} cy={30} r={21} />
        <circle cx={104} cy={42} r={16} />
        <rect x={20} y={40} width={92} height={20} rx={10} />
      </g>
      <path d="M22 52 Q 66 62 114 50 L 112 58 Q 66 66 22 58 Z" fill="#DDF1FF" />
    </svg>
  );
}

function Volcano() {
  return (
    <svg viewBox="0 0 240 150" className="h-full w-full" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <path
        d="M0 150 C 40 128, 70 60, 88 34 Q 120 22 152 34 C 170 60, 200 128, 240 150 Z"
        fill="#A58BBA"
      />
      <path d="M152 34 C 170 60, 200 128, 240 150 L 176 150 C 164 110, 152 70, 140 36 Z" fill="#8C73A3" />
      <path d="M58 118 C 70 88, 80 62, 94 42" stroke="#C3AED4" strokeWidth={6} fill="none" strokeLinecap="round" />
      <path
        d="M0 150 C 40 128, 70 60, 88 34 Q 120 22 152 34 C 170 60, 200 128, 240 150"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <ellipse cx={120} cy={33} rx={31} ry={7} fill="#FF7A3D" stroke={OUTLINE} strokeWidth={3.5} />
      <ellipse cx={120} cy={32} rx={20} ry={3.5} fill="#FFC15A" />
      <path d="M100 37 C 98 50, 104 56, 101 70 C 108 64, 109 50, 112 39 Z" fill="#FF9A3C" stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M131 38 C 135 48, 129 54, 133 62 C 139 56, 139 46, 141 37 Z" fill="#FF9A3C" stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />
    </svg>
  );
}

const FRONDS = [
  'translate(126 96) scale(-1 1) rotate(-50)',
  'translate(126 96) rotate(-50)',
  'translate(126 96) scale(-1 1) rotate(-12)',
  'translate(126 96) rotate(-14)',
  'translate(126 96) scale(-1 1) rotate(24)',
  'translate(126 96) rotate(22)',
  'translate(126 96) rotate(-82)',
];
const FROND_D =
  'M0 0 C 24 -24, 66 -26, 102 12 L 88 6 L 84 14 L 72 4 L 66 14 L 54 2 L 46 12 L 36 1 L 26 9 L 16 0 Z';

function Palm() {
  const rings = [276, 252, 228, 204, 180, 156, 132, 112];
  return (
    <svg viewBox="0 0 200 300" className="h-full w-full" preserveAspectRatio="xMidYMax meet" aria-hidden="true" overflow="visible">
      <path
        d="M92 300 C 94 230, 102 160, 118 96 L 134 100 C 120 162, 114 232, 114 300 Z"
        fill="#BD8A56"
        stroke={OUTLINE}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      {rings.map((y) => {
        const t = (300 - y) / 204;
        const xl = 92 + 26 * t + 2;
        const xr = 114 + 20 * t - 2;
        return <path key={y} d={`M${xl} ${y} Q ${(xl + xr) / 2} ${y + 6} ${xr} ${y}`} stroke="#8E5E33" strokeWidth={2.6} fill="none" strokeLinecap="round" />;
      })}
      {FRONDS.map((t, i) => (
        <g key={i} transform={t}>
          <path d={FROND_D} fill={i < 2 || i === 6 ? '#3E9A47' : '#4DB552'} stroke={OUTLINE} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M4 -1 C 30 -18, 66 -18, 99 10" stroke="#8AD972" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </g>
      ))}
      {[
        [119, 105],
        [133, 106],
        [126, 114],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={7.5} fill="#8A5A2B" stroke={OUTLINE} strokeWidth={3} />
          <circle cx={x - 2.4} cy={y - 2.4} r={2} fill="#C28A55" />
        </g>
      ))}
    </svg>
  );
}

function RoundTree({ tint = '#5DBB55' }: { tint?: string }) {
  return (
    <svg viewBox="0 0 60 90" className="h-full w-full" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <rect x={26} y={48} width={8} height={42} rx={3} fill="#A0703F" stroke={OUTLINE} strokeWidth={2.5} />
      <circle cx={30} cy={34} r={24} fill={tint} stroke={OUTLINE} strokeWidth={2.5} />
      <circle cx={22} cy={26} r={8} fill="#fff" opacity={0.25} />
    </svg>
  );
}

function Tuft({ color = '#5DB842' }: { color?: string }) {
  return (
    <svg viewBox="0 0 30 20" className="h-full w-full" aria-hidden="true">
      <path d="M3 20 Q 6 8 3 1 Q 10 9 12 20 Q 13 6 16 0 Q 19 10 19 20 Q 22 9 28 3 Q 25 12 27 20 Z" fill={color} />
    </svg>
  );
}

function Flower({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 20 20" className="h-full w-full" aria-hidden="true">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={10} cy={5} rx={3.6} ry={4.6} fill={color} stroke={OUTLINE} strokeWidth={1.3} transform={`rotate(${a} 10 10)`} />
      ))}
      <circle cx={10} cy={10} r={3} fill="#FFC93C" stroke={OUTLINE} strokeWidth={1.3} />
    </svg>
  );
}

function FarBird() {
  return (
    <svg viewBox="0 0 30 12" className="h-full w-full" aria-hidden="true">
      <path d="M1 8 Q 8 0 15 8 Q 22 0 29 8" stroke="#5B4A7A" strokeWidth={2.6} fill="none" strokeLinecap="round" />
    </svg>
  );
}

export interface SceneryProps {
  w: number;
  h: number;
  horizon: number;
  stripTop?: number;
  seed?: number;
  lively?: boolean;
}

export const Scenery = memo(function Scenery({ w, h, horizon, stripTop, seed = 7, lively = true }: SceneryProps) {
  const vmin = Math.min(w, h);
  const portrait = h > w;
  const groundBottom = stripTop ?? h;
  const decor = useMemo(() => {
    const rng = mulberry32(seed);
    const top = horizon + 14;
    const span = Math.max(20, groundBottom - top - 12);
    const tufts = Array.from({ length: 26 }, () => ({
      x: rng() * 100,
      y: top + rng() * span,
      s: 0.6 + rng() * 0.7,
      c: rng() > 0.5 ? '#5DB842' : '#4FAA3A',
    }));
    const flowers = Array.from({ length: 16 }, () => ({
      x: 2 + rng() * 96,
      y: top + 10 + rng() * span,
      s: 0.7 + rng() * 0.5,
      c: ['#FF8FB8', '#FFFFFF', '#B79BFF', '#FFD447', '#FF7A7A'][Math.floor(rng() * 5)],
    }));
    const patches = Array.from({ length: 6 }, () => ({
      x: rng() * 100,
      y: top + rng() * span,
      rx: 10 + rng() * 14,
      ry: 3 + rng() * 4,
    }));
    const pebbles = stripTop
      ? Array.from({ length: 26 }, () => ({
          x: rng() * 100,
          y: rng(),
          r: 0.5 + rng() * 0.8,
          c: rng() > 0.5 ? '#E4C084' : '#D6AF70',
        }))
      : [];
    const clouds = Array.from({ length: 4 }, (_, i) => ({
      top: 0.06 + rng() * 0.6,
      size: 0.16 + rng() * 0.12,
      dur: 70 + rng() * 60,
      delay: -(i * 30 + rng() * 25),
    }));
    return { tufts, flowers, patches, pebbles, clouds };
  }, [seed, horizon, groundBottom, stripTop]);

  const sunSize = Math.min(vmin * 0.2, Math.max(60, horizon * 0.72));
  const skyH = horizon + 40;
  const volcanoH = Math.min(h * 0.2, w * 0.32);
  const palmH = Math.min(h * 0.44, w * (portrait ? 0.5 : 0.32));
  const palmBase = groundBottom + (stripTop ? 14 : -h * 0.02);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* sky */}
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: skyH, background: 'linear-gradient(180deg, #5BBEFF 0%, #93D8FF 55%, #D4F2FF 100%)' }}
      />
      <div className="absolute" style={{ left: portrait ? w * 0.62 : w * 0.7, top: horizon - sunSize * 1.02, width: sunSize, height: sunSize }}>
        <Sun />
      </div>
      {decor.clouds.map((c, i) => (
        <div
          key={i}
          className="cloud"
          style={
            {
              top: Math.max(4, c.top * (horizon - vmin * 0.1)),
              width: vmin * c.size * 1.6,
              height: vmin * c.size * 0.8,
              '--dur': `${c.dur}s`,
              '--delay': `${c.delay}s`,
              opacity: 0.95,
            } as CSSProperties
          }
        >
          <Cloud />
        </div>
      ))}
      {lively &&
        [0, 1].map((i) => (
          <div
            key={`bird${i}`}
            className="far-bird"
            style={
              {
                top: horizon * (0.35 + i * 0.22),
                width: vmin * 0.035,
                height: vmin * 0.014,
                '--dur': `${38 + i * 14}s`,
                '--delay': `${-i * 17}s`,
              } as CSSProperties
            }
          >
            <FarBird />
          </div>
        ))}

      {/* far mountains */}
      <svg
        className="absolute left-0 w-full"
        style={{ top: horizon - h * 0.12, height: h * 0.12 + 2 }}
        viewBox="0 0 1000 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0 120 L0 70 C 40 50, 70 30, 110 50 C 150 20, 200 10, 250 45 C 290 30, 330 40, 370 60 C 420 25, 470 20, 520 50 C 560 35, 600 30, 650 55 C 700 20, 760 15, 810 50 C 850 35, 900 40, 940 60 C 970 50, 990 55, 1000 60 L1000 120 Z"
          fill="#BCCDF4"
        />
        <path
          d="M0 120 L0 92 C 60 72, 120 64, 180 82 C 240 62, 300 58, 360 80 C 430 60, 500 62, 560 84 C 620 66, 690 60, 750 82 C 820 64, 900 66, 1000 84 L1000 120 Z"
          fill="#A8C1EE"
        />
      </svg>

      {/* volcano */}
      <div
        className="absolute"
        style={{
          left: portrait ? w * 0.02 : w * 0.08,
          top: horizon - volcanoH + 4,
          width: volcanoH * 1.6,
          height: volcanoH,
        }}
      >
        <Volcano />
        {lively &&
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className="smoke"
              style={
                {
                  left: '50%',
                  top: volcanoH * 0.02 - volcanoH * 0.12,
                  width: volcanoH * 0.22,
                  height: volcanoH * 0.22,
                  '--delay': `${i * 1.66}s`,
                  '--drift': `${20 + i * 25}%`,
                } as CSSProperties
              }
            />
          ))}
      </div>

      {/* near hills */}
      <svg
        className="absolute left-0 w-full"
        style={{ top: horizon - h * 0.055, height: h * 0.07 }}
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
      >
        <path
          d="M0 100 L0 50 C 100 20, 200 20, 300 45 C 400 70, 500 10, 640 35 C 760 55, 860 20, 1000 40 L1000 100 Z"
          fill="#96DB72"
        />
      </svg>

      {/* far trees */}
      {[
        { x: portrait ? 0.4 : 0.3, s: 1, t: '#5DBB55' },
        { x: portrait ? 0.52 : 0.36, s: 0.75, t: '#4FAE4B' },
        { x: 0.56, s: 0.9, t: '#6CC45C' },
        { x: 0.9, s: 1.05, t: '#5DBB55' },
        { x: 0.95, s: 0.8, t: '#4FAE4B' },
      ].map((t, i) => {
        const th = vmin * 0.1 * t.s;
        return (
          <div key={i} className="absolute" style={{ left: w * t.x - th * 0.33, top: horizon - th + 4, width: th * 0.67, height: th }}>
            <RoundTree tint={t.t} />
          </div>
        );
      })}

      {/* ground */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ top: horizon, background: 'linear-gradient(180deg, #A8E37D 0%, #8AD463 30%, #72C64F 100%)' }}
      />
      {!portrait && (
        <div className="absolute" style={{ left: w * 0.62, top: horizon + 3, width: w * 0.2, height: h * 0.04 }}>
          <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="h-full w-full">
            <ellipse cx={100} cy={20} rx={97} ry={17} fill="#7CD0F5" stroke="#5FB6E0" strokeWidth={3} />
            <ellipse cx={100} cy={16} rx={80} ry={9} fill="#A6E2FA" />
            <path className="water-shine" d="M60 18 h 20 M110 14 h 26 M90 24 h 14" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
          </svg>
        </div>
      )}
      {decor.patches.map((p, i) => (
        <div
          key={`p${i}`}
          className="absolute rounded-[50%]"
          style={{
            left: `${p.x}%`,
            top: p.y,
            width: `${p.rx}%`,
            height: `${p.ry}%`,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(closest-side, rgba(255,255,255,0.18), rgba(255,255,255,0))',
          }}
        />
      ))}
      {decor.tufts.map((t, i) => (
        <div
          key={`t${i}`}
          className="absolute"
          style={{ left: `${t.x}%`, top: t.y, width: vmin * 0.045 * t.s, height: vmin * 0.03 * t.s, transform: 'translate(-50%, -100%)' }}
        >
          <Tuft color={t.c} />
        </div>
      ))}
      {decor.flowers.map((f, i) => (
        <div
          key={`f${i}`}
          className="absolute"
          style={{ left: `${f.x}%`, top: f.y, width: vmin * 0.026 * f.s, height: vmin * 0.026 * f.s, transform: 'translate(-50%, -100%)' }}
        >
          <Flower color={f.c} />
        </div>
      ))}

      {/* edge palms */}
      <div className="absolute" style={{ left: -palmH * 0.3, top: palmBase - palmH, width: palmH * 0.667, height: palmH }}>
        <Palm />
      </div>
      <div
        className="absolute"
        style={{ right: -palmH * 0.3, top: palmBase - palmH * 0.86, width: palmH * 0.667 * 0.86, height: palmH * 0.86, transform: 'scaleX(-1)' }}
      >
        <Palm />
      </div>

      {lively &&
        [0, 1].map((i) => (
          <div
            key={`bf${i}`}
            className="ambient-bf"
            style={
              {
                left: `${12 + i * 40}%`,
                top: horizon + (groundBottom - horizon) * (0.3 + i * 0.3),
                width: vmin * 0.045,
                height: vmin * 0.038,
                '--dur': `${15 + i * 5}s`,
                '--delay': `${-i * 6}s`,
              } as CSSProperties
            }
          >
            <Butterfly className="h-full w-full" colors={i ? ['#FFD447', '#FF9A6B'] : ['#FF9ACB', '#B79BFF']} />
          </div>
        ))}

      {/* nesting beach */}
      {stripTop !== undefined && (
        <div className="absolute inset-x-0 bottom-0" style={{ top: stripTop - 20 }}>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path
              d="M0 12 C 100 4, 200 18, 320 10 C 440 2, 560 18, 680 10 C 800 3, 900 16, 1000 8 L1000 100 L0 100 Z"
              fill="#F4D69E"
            />
            <path
              d="M0 12 C 100 4, 200 18, 320 10 C 440 2, 560 18, 680 10 C 800 3, 900 16, 1000 8"
              fill="none"
              stroke="#D9B36F"
              strokeWidth={5}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {decor.pebbles.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-[50%]"
              style={{
                left: `${p.x}%`,
                top: `${22 + p.y * 72}%`,
                width: vmin * 0.016 * p.r * 1.6,
                height: vmin * 0.011 * p.r * 1.6,
                background: p.c,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
});
