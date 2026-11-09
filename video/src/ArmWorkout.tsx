import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  continueRender,
  delayRender,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Gym } from "./Gym";
import { Defs, FrontTrainer, SideTrainer } from "./Trainer";

// Heebo (OFL) is bundled locally so rendering works offline.
const fontFamily = "Heebo";
const fontHandle = delayRender("Loading Heebo");
Promise.all(
  [
    ["heebo-hebrew.woff2", "U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F"],
    ["heebo-latin.woff2", "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122"],
  ].map(([file, range]) => {
    const face = new FontFace(fontFamily, `url(${staticFile(`fonts/${file}`)}) format("woff2")`, {
      weight: "100 900",
      unicodeRange: range,
    });
    document.fonts.add(face);
    return face.load();
  }),
).then(() => continueRender(fontHandle));

export const FPS = 30;
const SEG = 10 * FPS; // 10 seconds per exercise
const START = 24; // frames before the first rep
const REPS = 4;
const REP = Math.floor((SEG - START) / REPS); // 69 frames ≈ 2.3s
export const TOTAL_FRAMES = SEG * 3;

const GREEN = "#22c55e";

type Exercise = {
  he: string;
  en: string;
  muscle: string;
  tip: string;
  view: "side" | "front";
  arrowAt: { x: number; y: number };
};

const EXERCISES: Exercise[] = [
  { he: "כפיפת מרפקים", en: "BICEP CURL", muscle: "יד קדמית (דו-ראשי)", tip: "מרפקים צמודים לגוף, הורדה איטית", view: "side", arrowAt: { x: 780, y: 820 } },
  { he: "לחיצת כתפיים", en: "SHOULDER PRESS", muscle: "כתפיים ויד אחורית", tip: "בטן אסופה, דחיפה ישר למעלה", view: "front", arrowAt: { x: 900, y: 560 } },
  { he: "הרחקה לצדדים", en: "LATERAL RAISE", muscle: "כתף צדית", tip: "עד גובה הכתף, בלי תנופה", view: "front", arrowAt: { x: 930, y: 900 } },
];

const ease = Easing.inOut(Easing.cubic);
/** 0 → 1 (lift), short hold, then a slower 1 → 0 (lower). */
const repPhase = (t: number) => {
  if (t < 0.38) return ease(t / 0.38);
  if (t < 0.48) return 1;
  return 1 - ease((t - 0.48) / 0.52);
};

const motion = (f: number) => {
  const active = f - START;
  if (active < 0) return { p: 0, rep: 1, t: 0, lifting: false };
  const rep = Math.min(Math.floor(active / REP), REPS - 1);
  const t = Math.min((active - rep * REP) / REP, 1);
  return { p: repPhase(t), rep: rep + 1, t, lifting: t < 0.38 };
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const Scene: React.FC<{ ex: Exercise; index: number }> = ({ ex, index }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { p, rep, t, lifting } = motion(f);
  const breathe = (Math.sin((f / fps) * Math.PI * 0.9) + 1) / 2;
  const blink = f % 110 > 104;
  const sway = Math.sin(f / 40) * 3;

  // camera: slow push-in + fade at the edges of the segment
  const zoom = interpolate(f, [0, SEG], [1.0, 1.06]);
  const fade = interpolate(f, [0, 10, SEG - 8, SEG], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const enter = spring({ frame: f, fps, config: { damping: 14 } });

  let trainer: React.ReactNode;
  if (index === 0) {
    trainer = <SideTrainer pose={{ upper: lerp(3, 14, p), fore: lerp(10, 148, p), glowAmt: p, breathe, blink, sway }} />;
  } else if (index === 1) {
    trainer = (
      <FrontTrainer
        pose={{ upper: lerp(84, 164, p), fore: lerp(180, 188, p), dumbbell: "side", glow: "delts", glowAmt: p, breathe, blink, sway }}
      />
    );
  } else {
    trainer = (
      <FrontTrainer
        pose={{ upper: lerp(10, 86, p), fore: lerp(16, 92, p), dumbbell: "end", glow: "delts", glowAmt: p, breathe, blink, sway }}
      />
    );
  }

  const repPop = spring({ frame: f - START - (rep - 1) * REP, fps, config: { damping: 9, mass: 0.6 } });
  const arrowOp = f < START ? 0 : interpolate(t, [0, 0.08, 0.36, 0.44, 0.52, 0.9, 1], [0, 1, 1, 0, 1, 1, 0]);
  const arrowShift = lifting ? -interpolate(t, [0, 0.38], [0, 40]) : interpolate(t, [0.48, 1], [0, 40], { extrapolateLeft: "clamp" });
  const remaining = Math.ceil((SEG - f) / fps);
  const ring = 2 * Math.PI * 62;

  return (
    <AbsoluteFill style={{ opacity: fade, fontFamily }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 60%" }}>
        <Gym />
        <svg
          viewBox="0 0 1080 1920"
          width={1080}
          height={1920}
          style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - enter) * 40}px)` }}
        >
          <Defs />
          {/* scale the trainer about the feet so overhead reps clear the title */}
          <g transform="translate(540 1560) scale(0.86) translate(-540 -1560)">{trainer}</g>
          {/* direction arrow */}
          <g opacity={arrowOp} transform={`translate(${ex.arrowAt.x} ${ex.arrowAt.y + arrowShift})`}>
            <circle r={44} fill="#0f172a" opacity={0.65} />
            <path
              d={lifting ? "M-18,10 L0,-12 L18,10" : "M-18,-10 L0,12 L18,-10"}
              stroke={GREEN}
              strokeWidth={9}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </AbsoluteFill>

      {/* segmented progress */}
      <div style={{ position: "absolute", top: 60, left: 60, right: 60, display: "flex", gap: 14 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ flex: 1, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                background: GREEN,
                width: `${i < index ? 100 : i > index ? 0 : (f / SEG) * 100}%`,
              }}
            />
          </div>
        ))}
      </div>

      {/* header */}
      <div
        style={{
          position: "absolute",
          top: 110,
          width: "100%",
          textAlign: "center",
          transform: `translateY(${(1 - enter) * -60}px)`,
          opacity: enter,
        }}
      >
        <div
          style={{
            display: "inline-block",
            direction: "rtl",
            padding: "10px 28px",
            borderRadius: 40,
            background: "rgba(34,197,94,0.16)",
            border: `2px solid ${GREEN}`,
            color: GREEN,
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          תרגיל {index + 1} מתוך 3 · {ex.muscle}
        </div>
        <div style={{ direction: "rtl", color: "white", fontSize: 104, fontWeight: 900, marginTop: 18, textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>
          {ex.he}
        </div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 40, fontWeight: 700, letterSpacing: 10, marginTop: -6 }}>{ex.en}</div>
      </div>

      {/* bottom HUD */}
      <div style={{ position: "absolute", bottom: 90, left: 60, right: 60, display: "flex", alignItems: "center", gap: 28 }}>
        {/* timer ring */}
        <div style={{ position: "relative", width: 150, height: 150 }}>
          <svg width={150} height={150} viewBox="0 0 150 150">
            <circle cx={75} cy={75} r={62} stroke="rgba(255,255,255,0.15)" strokeWidth={12} fill="rgba(15,23,42,0.7)" />
            <circle
              cx={75}
              cy={75}
              r={62}
              stroke={GREEN}
              strokeWidth={12}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={ring}
              strokeDashoffset={ring * (f / SEG)}
              transform="rotate(-90 75 75)"
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 56, fontWeight: 900 }}>
            {remaining}
          </div>
        </div>
        {/* tip */}
        <div
          style={{
            flex: 1,
            direction: "rtl",
            background: "rgba(15,23,42,0.72)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 28,
            padding: "22px 28px",
            color: "white",
            fontSize: 36,
            fontWeight: 700,
            lineHeight: 1.3,
          }}
        >
          <span style={{ color: GREEN }}>טיפ: </span>
          {ex.tip}
        </div>
        {/* rep counter */}
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: 32,
            background: GREEN,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#052e16",
            transform: `scale(${f < START ? 1 : 0.85 + 0.15 * repPop})`,
          }}
        >
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1 }}>
            {rep}
            <span style={{ fontSize: 36, opacity: 0.6 }}>/{REPS}</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>חזרות</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ArmWorkout: React.FC = () => (
  <AbsoluteFill style={{ background: "#0b1220" }}>
    {EXERCISES.map((ex, i) => (
      <Sequence key={ex.en} from={i * SEG} durationInFrames={SEG}>
        <Scene ex={ex} index={i} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
