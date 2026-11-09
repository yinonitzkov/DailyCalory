import React from "react";

/** Softly lit gym backdrop, slightly blurred for depth of field. */
export const Gym: React.FC = () => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0b1220" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1f2937" />
        <stop offset="100%" stopColor="#0b0f17" />
      </linearGradient>
      <radialGradient id="spot" cx="0.5" cy="0.35" r="0.6">
        <stop offset="0%" stopColor="#fef3c7" stopOpacity={0.22} />
        <stop offset="100%" stopColor="#fef3c7" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
        <stop offset="60%" stopColor="#000" stopOpacity={0} />
        <stop offset="100%" stopColor="#000" stopOpacity={0.7} />
      </radialGradient>
      <filter id="dof">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </defs>
    <rect width={1080} height={1920} fill="url(#wall)" />
    <g filter="url(#dof)">
      {/* wall panels */}
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={i * 160 - 20} y={300} width={6} height={1200} fill="#ffffff" opacity={0.04} />
      ))}
      {/* windows with daylight */}
      {[90, 790].map((x) => (
        <g key={x}>
          <rect x={x} y={360} width={200} height={420} rx={10} fill="#334155" opacity={0.6} />
          <rect x={x + 10} y={370} width={180} height={400} rx={6} fill="#7dd3fc" opacity={0.12} />
          <rect x={x + 96} y={370} width={8} height={400} fill="#0b1220" opacity={0.6} />
        </g>
      ))}
      {/* wall branding */}
      <text x={540} y={1260} textAnchor="middle" fontSize={150} fontWeight={900} fill="#ffffff" opacity={0.045} fontFamily="Heebo, sans-serif" letterSpacing={10}>
        DAILY
      </text>
      {/* dumbbell rack, left */}
      <g opacity={0.9}>
        <rect x={20} y={1250} width={250} height={16} rx={6} fill="#475569" />
        <rect x={20} y={1360} width={250} height={16} rx={6} fill="#475569" />
        <rect x={30} y={1250} width={14} height={300} fill="#334155" />
        <rect x={246} y={1250} width={14} height={300} fill="#334155" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x={44 + i * 52} y={1218} width={40} height={32} rx={8} fill="#1f2937" />
            <rect x={44 + i * 52} y={1324} width={42} height={36} rx={8} fill="#111827" />
          </g>
        ))}
      </g>
      {/* kettlebells, right */}
      {[820, 930].map((x, i) => (
        <g key={x}>
          <path d={`M${x - 26},${1480 - i * 6} Q${x},${1420 - i * 6} ${x + 26},${1480 - i * 6}`} stroke="#111827" strokeWidth={14} fill="none" />
          <circle cx={x} cy={1515 - i * 6} r={46 - i * 6} fill={i ? "#16a34a" : "#111827"} />
        </g>
      ))}
    </g>
    {/* floor */}
    <rect y={1500} width={1080} height={420} fill="url(#floor)" />
    {Array.from({ length: 9 }, (_, i) => (
      <line key={i} x1={540 + (i - 4) * 70} y1={1500} x2={540 + (i - 4) * 320} y2={1920} stroke="#ffffff" strokeOpacity={0.04} strokeWidth={3} />
    ))}
    <line x1={0} y1={1500} x2={1080} y2={1500} stroke="#ffffff" strokeOpacity={0.08} strokeWidth={3} />
    <ellipse cx={540} cy={1590} rx={420} ry={70} fill="#22c55e" opacity={0.06} />
    <rect width={1080} height={1920} fill="url(#spot)" />
    <rect width={1080} height={1920} fill="url(#vignette)" />
  </svg>
);
