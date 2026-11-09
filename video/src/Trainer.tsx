import React from "react";

// ---------- geometry helpers ----------
export type P = { x: number; y: number };
const rad = (d: number) => (d * Math.PI) / 180;
/** Point at `len` from `o`, `deg` measured from straight down; side flips x. */
export const pol = (o: P, len: number, deg: number, side = 1): P => ({
  x: o.x + side * Math.sin(rad(deg)) * len,
  y: o.y + Math.cos(rad(deg)) * len,
});

const C = {
  skin: "#c98e6b",
  skinShade: "#a06a4b",
  skinLight: "#e3ad8a",
  hair: "#2a1b12",
  top: "#16a34a",
  topShade: "#0f7a37",
  topLight: "#22c55e",
  shorts: "#1f2937",
  shortsShade: "#111827",
  shoe: "#f1f5f9",
  shoeShade: "#94a3b8",
  sole: "#0f172a",
  iron: "#374151",
  ironLight: "#6b7280",
  ironDark: "#1f2937",
  chrome: "#cbd5e1",
};

/** Several capsules drawn layer-by-layer so joints blend without seams. */
const Chain: React.FC<{ segs: { a: P; b: P; ra: number; rb: number }[]; fill: string; shade: string; light?: string }> = ({
  segs, fill, shade, light,
}) => {
  const layer = (k: number, col: string, dxk: number, dyk: number, op = 1) =>
    segs.map((g, i) => {
      const dx = -g.ra * dxk, dy = -g.ra * dyk;
      const ax = g.a.x + dx, ay = g.a.y + dy, bx = g.b.x + dx, by = g.b.y + dy;
      const r1 = g.ra * k, r2 = g.rb * k;
      const L = Math.hypot(bx - ax, by - ay) || 1;
      const nx = -(by - ay) / L, ny = (bx - ax) / L;
      return (
        <g key={col + i} opacity={op}>
          <polygon points={`${ax + nx * r1},${ay + ny * r1} ${bx + nx * r2},${by + ny * r2} ${bx - nx * r2},${by - ny * r2} ${ax - nx * r1},${ay - ny * r1}`} fill={col} />
          <circle cx={ax} cy={ay} r={r1} fill={col} />
          <circle cx={bx} cy={by} r={r2} fill={col} />
        </g>
      );
    });
  return (
    <g>
      {layer(1, shade, 0, 0)}
      {layer(0.86, fill, 0.12, 0.1)}
      {light && layer(0.32, light, 0.42, 0.25, 0.45)}
    </g>
  );
};

/** Dumbbell seen end-on (axis toward camera): a hex plate. */
const DumbbellEnd: React.FC<{ at: P; r?: number }> = ({ at, r = 46 }) => {
  const hex = (rr: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const t = rad(60 * i + 30);
      return `${at.x + Math.cos(t) * rr},${at.y + Math.sin(t) * rr}`;
    }).join(" ");
  return (
    <g>
      <polygon points={hex(r + 6)} fill={C.ironDark} transform={`translate(5 6)`} opacity={0.6} />
      <polygon points={hex(r)} fill={C.iron} />
      <polygon points={hex(r * 0.78)} fill={C.ironDark} />
      <circle cx={at.x} cy={at.y} r={r * 0.22} fill={C.chrome} />
      <path d={`M${at.x - r * 0.7},${at.y - r * 0.35} L${at.x - r * 0.2},${at.y - r * 0.75}`} stroke={C.ironLight} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

/** Dumbbell seen from the side, axis perpendicular to the forearm direction. */
const DumbbellSide: React.FC<{ at: P; dir: P }> = ({ at, dir }) => {
  const L = Math.hypot(dir.x, dir.y) || 1;
  const ang = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
  return (
    <g transform={`translate(${at.x} ${at.y}) rotate(${ang + 90})`}>
      <rect x={-70} y={-8} width={140} height={16} rx={6} fill={C.chrome} />
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s > 0 ? 38 : -66} y={-36} width={28} height={72} rx={7} fill={C.iron} />
          <rect x={s > 0 ? 40 : -64} y={-34} width={10} height={68} rx={4} fill={C.ironLight} opacity={0.5} />
          <rect x={s > 0 ? 66 : -78} y={-26} width={12} height={52} rx={5} fill={C.ironDark} />
        </g>
      ))}
    </g>
  );
  void L;
};

const Glow: React.FC<{ at: P; rx: number; ry: number; rot: number; o: number }> = ({ at, rx, ry, rot, o }) => (
  <ellipse
    cx={at.x}
    cy={at.y}
    rx={rx}
    ry={ry}
    transform={`rotate(${rot} ${at.x} ${at.y})`}
    fill="url(#muscleGlow)"
    opacity={o}
    style={{ mixBlendMode: "screen" }}
  />
);

export const Defs = () => (
  <defs>
    <radialGradient id="muscleGlow">
      <stop offset="0%" stopColor="#86efac" stopOpacity={0.95} />
      <stop offset="60%" stopColor="#22c55e" stopOpacity={0.45} />
      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="floorShadow">
      <stop offset="0%" stopColor="#000" stopOpacity={0.55} />
      <stop offset="100%" stopColor="#000" stopOpacity={0} />
    </radialGradient>
  </defs>
);

const angleDeg = (a: P, b: P) => (Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI;

// ---------- FRONT VIEW ----------
export type FrontPose = {
  upper: number; // deg from down, outward positive
  fore: number;
  dumbbell: "end" | "side";
  glow: "delts" | "none";
  glowAmt: number;
  breathe: number; // 0..1
  blink: boolean;
  sway: number; // px
};

export const FrontTrainer: React.FC<{ pose: FrontPose }> = ({ pose }) => {
  const cx = 540 + pose.sway;
  const by = 1560; // floor
  const chest = 1 + pose.breathe * 0.015;
  const sh = (s: number): P => ({ x: cx + s * 112, y: 712 });

  const arm = (s: number) => {
    const S = sh(s);
    const E = pol(S, 172, pose.upper, s);
    const H = pol(E, 158, pose.fore, s);
    const fdir = { x: H.x - E.x, y: H.y - E.y };
    return (
      <g key={s}>
        <Chain segs={[{ a: S, b: E, ra: 34, rb: 25 }, { a: E, b: H, ra: 25, rb: 18 }]} fill={C.skin} shade={C.skinShade} light={C.skinLight} />
        {pose.glow === "delts" && (
          <Glow at={pol(S, 18, pose.upper, s)} rx={58} ry={48} rot={0} o={0.25 + 0.65 * pose.glowAmt} />
        )}
        {pose.dumbbell === "end" ? <DumbbellEnd at={pol(H, 14, pose.fore, s)} /> : <DumbbellSide at={pol(H, 10, pose.fore, s)} dir={fdir} />}
        <circle cx={H.x} cy={H.y + 4} r={22} fill={C.skinShade} />
        <circle cx={H.x - 3} cy={H.y} r={19} fill={C.skin} />
        {/* deltoid cap */}
        <circle cx={S.x} cy={S.y + 4} r={38} fill={C.skinShade} />
        <circle cx={S.x - 4} cy={S.y} r={33} fill={C.skin} />
        <circle cx={S.x - 12} cy={S.y - 10} r={11} fill={C.skinLight} opacity={0.5} />
      </g>
    );
  };

  const leg = (s: number) => {
    const Hp: P = { x: cx + s * 52, y: 1070 };
    const K: P = { x: cx + s * 66, y: 1310 };
    const A: P = { x: cx + s * 72, y: 1515 };
    return (
      <g key={s}>
        <Chain segs={[{ a: Hp, b: K, ra: 44, rb: 31 }, { a: K, b: A, ra: 31, rb: 18 }]} fill={C.skin} shade={C.skinShade} light={C.skinLight} />
        {/* sock + shoe */}
        <rect x={A.x - 21} y={A.y - 24} width={42} height={30} rx={10} fill="#e5e7eb" />
        <path
          d={`M${A.x - 40},${by - 6} Q${A.x - 44},${A.y - 6} ${A.x - 14},${A.y - 4} L${A.x + 14},${A.y - 4} Q${A.x + 44},${A.y - 6} ${A.x + 40},${by - 6} Z`}
          fill={C.shoe}
        />
        <path d={`M${A.x - 26},${A.y + 10} L${A.x + 26},${A.y + 10}`} stroke={C.top} strokeWidth={6} strokeLinecap="round" />
        <rect x={A.x - 42} y={by - 14} width={84} height={14} rx={6} fill={C.sole} />
      </g>
    );
  };

  return (
    <g>
      <ellipse cx={cx} cy={by + 4} rx={230} ry={34} fill="url(#floorShadow)" />
      {leg(-1)}
      {leg(1)}
      {/* shorts */}
      <path
        d={`M${cx - 96},1040 L${cx + 96},1040 L${cx + 128},1215 L${cx + 14},1222 L${cx},1120 L${cx - 14},1222 L${cx - 128},1215 Z`}
        fill={C.shorts}
      />
      <path d={`M${cx - 96},1040 L${cx + 96},1040 L${cx + 98},1068 L${cx - 98},1068 Z`} fill={C.shortsShade} />
      <path d={`M${cx + 110},1100 L${cx + 124},1208`} stroke={C.top} strokeWidth={6} />
      <path d={`M${cx - 110},1100 L${cx - 124},1208`} stroke={C.top} strokeWidth={6} />
      {/* torso */}
      <g transform={`translate(${cx} 860) scale(${chest} 1) translate(${-cx} -860)`}>
        <path
          d={`M${cx - 118},705 Q${cx},690 ${cx + 118},705 Q${cx + 128},790 ${cx + 100},880 Q${cx + 84},960 ${cx + 92},1046 L${cx - 92},1046 Q${cx - 84},960 ${cx - 100},880 Q${cx - 128},790 ${cx - 118},705 Z`}
          fill={C.skin}
        />
        {/* tank top */}
        <path
          d={`M${cx - 78},700 L${cx - 46},700 Q${cx},790 ${cx + 46},700 L${cx + 78},700 Q${cx + 86},780 ${cx + 106},800 Q${cx + 86},930 ${cx + 94},1050 L${cx - 94},1050 Q${cx - 86},930 ${cx - 106},800 Q${cx - 86},780 ${cx - 78},700 Z`}
          fill={C.top}
        />
        <path
          d={`M${cx + 20},800 Q${cx + 80},850 ${cx + 94},1050 L${cx + 60},1050 Q${cx + 60},900 ${cx + 20},800 Z`}
          fill={C.topShade}
          opacity={0.7}
        />
        <path d={`M${cx - 60},740 Q${cx - 70},850 ${cx - 54},960`} stroke={C.topLight} strokeWidth={10} strokeLinecap="round" opacity={0.5} fill="none" />
        <text x={cx} y={905} textAnchor="middle" fontSize={34} fontWeight={900} fill="#ffffff" opacity={0.9} fontFamily="Heebo, sans-serif" letterSpacing={2}>
          DC
        </text>
      </g>
      {/* neck */}
      <path d={`M${cx - 30},620 L${cx + 30},620 L${cx + 36},712 L${cx - 36},712 Z`} fill={C.skinShade} />
      <path d={`M${cx - 26},620 L${cx + 22},620 L${cx + 26},700 L${cx - 30},700 Z`} fill={C.skin} />
      {/* head */}
      <Head cx={cx} cy={548} blink={pose.blink} />
      {arm(-1)}
      {arm(1)}
    </g>
  );
};

const Head: React.FC<{ cx: number; cy: number; blink: boolean }> = ({ cx, cy, blink }) => (
  <g>
    <ellipse cx={cx - 64} cy={cy + 8} rx={14} ry={22} fill={C.skinShade} />
    <ellipse cx={cx + 64} cy={cy + 8} rx={14} ry={22} fill={C.skinShade} />
    <ellipse cx={cx} cy={cy} rx={64} ry={78} fill={C.skin} />
    <ellipse cx={cx + 18} cy={cy + 20} rx={44} ry={56} fill={C.skinShade} opacity={0.25} />
    {/* hair */}
    <path
      d={`M${cx - 68},${cy - 4} Q${cx - 76},${cy - 96} ${cx},${cy - 92} Q${cx + 78},${cy - 96} ${cx + 68},${cy - 4} Q${cx + 58},${cy - 50} ${cx + 20},${cy - 52} Q${cx - 30},${cy - 40} ${cx - 56},${cy - 52} Q${cx - 66},${cy - 30} ${cx - 68},${cy - 4} Z`}
      fill={C.hair}
    />
    {/* headband */}
    <path d={`M${cx - 66},${cy - 30} Q${cx},${cy - 58} ${cx + 66},${cy - 30}`} stroke={C.top} strokeWidth={14} fill="none" strokeLinecap="round" />
    {/* brows */}
    <path d={`M${cx - 40},${cy - 14} Q${cx - 24},${cy - 22} ${cx - 10},${cy - 14}`} stroke={C.hair} strokeWidth={6} fill="none" strokeLinecap="round" />
    <path d={`M${cx + 10},${cy - 14} Q${cx + 24},${cy - 22} ${cx + 40},${cy - 14}`} stroke={C.hair} strokeWidth={6} fill="none" strokeLinecap="round" />
    {/* eyes */}
    {blink ? (
      <>
        <path d={`M${cx - 36},${cy + 6} L${cx - 14},${cy + 6}`} stroke="#1f1410" strokeWidth={4} strokeLinecap="round" />
        <path d={`M${cx + 14},${cy + 6} L${cx + 36},${cy + 6}`} stroke="#1f1410" strokeWidth={4} strokeLinecap="round" />
      </>
    ) : (
      <>
        <ellipse cx={cx - 25} cy={cy + 6} rx={10} ry={8} fill="#fff" />
        <ellipse cx={cx + 25} cy={cy + 6} rx={10} ry={8} fill="#fff" />
        <circle cx={cx - 24} cy={cy + 6} r={6} fill="#3b2416" />
        <circle cx={cx + 26} cy={cy + 6} r={6} fill="#3b2416" />
        <circle cx={cx - 22} cy={cy + 4} r={2} fill="#fff" />
        <circle cx={cx + 28} cy={cy + 4} r={2} fill="#fff" />
      </>
    )}
    {/* nose + mouth */}
    <path d={`M${cx},${cy + 12} Q${cx - 8},${cy + 34} ${cx + 4},${cy + 36}`} stroke={C.skinShade} strokeWidth={5} fill="none" strokeLinecap="round" />
    <path d={`M${cx - 20},${cy + 50} Q${cx},${cy + 64} ${cx + 20},${cy + 50}`} stroke="#8a4a36" strokeWidth={6} fill="none" strokeLinecap="round" />
  </g>
);

// ---------- SIDE VIEW (facing right) ----------
export type SidePose = {
  upper: number; // deg from down, forward positive
  fore: number;
  glowAmt: number;
  breathe: number;
  blink: boolean;
  sway: number;
};

export const SideTrainer: React.FC<{ pose: SidePose }> = ({ pose }) => {
  const cx = 500 + pose.sway;
  const by = 1560;
  const S: P = { x: cx + 4, y: 718 };

  const arm = (far: boolean) => {
    const o = far ? { x: 18, y: -6 } : { x: 0, y: 0 };
    const s0 = { x: S.x + o.x, y: S.y + o.y };
    const E = pol(s0, 172, pose.upper, 1);
    const H = pol(E, 158, pose.fore, 1);
    const fill = far ? C.skinShade : C.skin;
    const shade = far ? "#8a5a3e" : C.skinShade;
    return (
      <g opacity={far ? 0.95 : 1}>
        <Chain segs={[{ a: s0, b: E, ra: 34, rb: 25 }, { a: E, b: H, ra: 25, rb: 18 }]} fill={fill} shade={shade} light={far ? undefined : C.skinLight} />
        {!far && (
          <Glow
            at={{ x: (s0.x + E.x) / 2 + 12, y: (s0.y + E.y) / 2 }}
            rx={40}
            ry={78}
            rot={-angleDeg(s0, E)}
            o={0.2 + 0.75 * pose.glowAmt}
          />
        )}
        <DumbbellEnd at={H} r={far ? 42 : 48} />
        <circle cx={H.x} cy={H.y} r={20} fill={shade} />
        <circle cx={H.x - 2} cy={H.y - 2} r={17} fill={fill} />
      </g>
    );
  };

  const leg = (far: boolean) => {
    const dx = far ? -16 : 0;
    const Hp: P = { x: cx + dx, y: 1075 };
    const K: P = { x: cx + dx + 10, y: 1312 };
    const A: P = { x: cx + dx - 4, y: 1515 };
    const fill = far ? C.skinShade : C.skin;
    return (
      <g>
        <Chain segs={[{ a: Hp, b: K, ra: 48, rb: 32 }, { a: K, b: A, ra: 32, rb: 18 }]} fill={fill} shade={far ? "#8a5a3e" : C.skinShade} light={far ? undefined : C.skinLight} />
        <rect x={A.x - 20} y={A.y - 24} width={40} height={30} rx={10} fill={far ? "#cbd5e1" : "#e5e7eb"} />
        <path
          d={`M${A.x - 34},${by - 6} Q${A.x - 38},${A.y - 8} ${A.x - 6},${A.y - 6} Q${A.x + 30},${A.y + 4} ${A.x + 78},${by - 22} Q${A.x + 96},${by - 14} ${A.x + 88},${by - 6} Z`}
          fill={far ? C.shoeShade : C.shoe}
        />
        <path d={`M${A.x - 10},${A.y + 16} Q${A.x + 30},${A.y + 22} ${A.x + 66},${by - 22}`} stroke={C.top} strokeWidth={6} fill="none" strokeLinecap="round" />
        <rect x={A.x - 36} y={by - 14} width={128} height={14} rx={6} fill={C.sole} />
      </g>
    );
  };

  const chest = pose.breathe * 6;
  return (
    <g>
      <ellipse cx={cx + 20} cy={by + 4} rx={200} ry={30} fill="url(#floorShadow)" />
      {arm(true)}
      {leg(true)}
      {leg(false)}
      {/* shorts */}
      <path d={`M${cx - 70},1040 L${cx + 66},1040 L${cx + 84},1220 L${cx - 76},1220 Z`} fill={C.shorts} />
      <path d={`M${cx - 70},1040 L${cx + 66},1040 L${cx + 68},1066 L${cx - 72},1066 Z`} fill={C.shortsShade} />
      <path d={`M${cx - 6},1070 L${cx - 4},1218`} stroke={C.top} strokeWidth={6} />
      {/* torso profile */}
      <path
        d={`M${cx - 52},700 Q${cx - 74},820 ${cx - 64},940 Q${cx - 60},1000 ${cx - 70},1046 L${cx + 66},1046 Q${cx + 58},960 ${cx + 66 + chest},860 Q${cx + 80 + chest},760 ${cx + 40},700 Z`}
        fill={C.skin}
      />
      <path
        d={`M${cx - 48},706 Q${cx - 4},722 ${cx + 30},706 Q${cx + 74 + chest},770 ${cx + 68 + chest},860 Q${cx + 58},960 ${cx + 68},1050 L${cx - 72},1050 Q${cx - 62},1000 ${cx - 66},940 Q${cx - 76},820 ${cx - 48},706 Z`}
        fill={C.top}
      />
      <path d={`M${cx - 66},760 Q${cx - 74},880 ${cx - 64},1040 L${cx - 40},1040 Q${cx - 50},880 ${cx - 40},760 Z`} fill={C.topShade} opacity={0.7} />
      {/* neck */}
      <path d={`M${cx - 26},622 L${cx + 22},622 L${cx + 30},716 L${cx - 34},716 Z`} fill={C.skin} />
      <path d={`M${cx - 26},622 L${cx - 6},622 L${cx - 10},716 L${cx - 34},716 Z`} fill={C.skinShade} opacity={0.6} />
      {/* head profile */}
      <g>
        <ellipse cx={cx} cy={548} rx={66} ry={78} fill={C.skin} />
        <path d={`M${cx + 58},${540} Q${cx + 84},${566} ${cx + 62},${578}`} fill={C.skin} />
        <path d={`M${cx + 52},${600} Q${cx + 40},${620} ${cx + 12},${622}`} stroke={C.skinShade} strokeWidth={4} fill="none" opacity={0.6} />
        <path
          d={`M${cx - 70},${560} Q${cx - 80},${452} ${cx + 4},${458} Q${cx + 64},${462} ${cx + 66},${510} Q${cx + 30},${494} ${cx - 2},${504} Q${cx - 22},${540} ${cx - 50},${600} Z`}
          fill={C.hair}
        />
        <path d={`M${cx - 66},${520} Q${cx},${486} ${cx + 66},${510}`} stroke={C.top} strokeWidth={14} fill="none" strokeLinecap="round" />
        <ellipse cx={cx - 10} cy={556} rx={14} ry={22} fill={C.skinShade} />
        {pose.blink ? (
          <path d={`M${cx + 30},${546} L${cx + 48},${546}`} stroke="#1f1410" strokeWidth={4} strokeLinecap="round" />
        ) : (
          <>
            <ellipse cx={cx + 40} cy={546} rx={8} ry={8} fill="#fff" />
            <circle cx={cx + 44} cy={546} r={5} fill="#3b2416" />
          </>
        )}
        <path d={`M${cx + 28},${528} Q${cx + 42},${520} ${cx + 56},${528}`} stroke={C.hair} strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d={`M${cx + 44},${596} Q${cx + 54},${600} ${cx + 60},${594}`} stroke="#8a4a36" strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
      {arm(false)}
      <circle cx={S.x} cy={S.y + 6} r={38} fill={C.skinShade} />
      <circle cx={S.x - 3} cy={S.y + 2} r={33} fill={C.skin} />
      <circle cx={S.x - 12} cy={S.y - 8} r={11} fill={C.skinLight} opacity={0.5} />
    </g>
  );
};
