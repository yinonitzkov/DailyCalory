import React from 'react';
import { Scale, Plus, TrendingDown, TrendingUp, Minus, Target } from 'lucide-react';
import { formatDateShortHebrew } from '../../utils/dateUtils';
import { WeightEntry } from '../../types';

interface WeightSummaryBarProps {
  currentWeight: number;
  diff?: number;
  recordedAt?: string;
  targetWeightKg?: number;
  recentWeights?: WeightEntry[];
  onLogWeightClick?: () => void;
}

export const WeightSummaryBar: React.FC<WeightSummaryBarProps> = ({
  currentWeight,
  diff,
  recordedAt,
  targetWeightKg,
  recentWeights = [],
  onLogWeightClick,
}) => {
  const formattedDate = recordedAt ? formatDateShortHebrew(recordedAt) : 'היום';

  // Build SVG Sparkline points for recent weigh-ins (up to last 7 points chronologically)
  const sparklineData = React.useMemo(() => {
    if (!recentWeights || recentWeights.length < 2) return null;

    const chronological = [...recentWeights]
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-7);

    if (chronological.length < 2) return null;

    const weights = chronological.map((w) => w.weightKg);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min || 1;

    const width = 64;
    const height = 24;
    const padding = 2;

    const points = weights.map((w, idx) => {
      const x = (idx / (weights.length - 1)) * (width - padding * 2) + padding;
      // Invert Y because SVG coordinates go down
      const y = height - padding - ((w - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const isDecreasing = weights[weights.length - 1] < weights[0];

    return {
      pointsStr: points.join(' '),
      isDecreasing,
    };
  }, [recentWeights]);

  return (
    <section
      id="weight-summary-bar"
      aria-label="שורת משקל קומפקטית"
      className="p-3.5 px-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between gap-3"
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-700 shrink-0">
          <Scale className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 font-medium">משקל אחרון:</span>
            <span className="text-base font-extrabold text-slate-900 tracking-tight">
              {currentWeight.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-500">ק״ג</span>

            {/* Difference badge */}
            {diff !== undefined && (
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-lg ${
                  diff < 0
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/70'
                    : diff > 0
                    ? 'text-amber-700 bg-amber-50 border border-amber-200/70'
                    : 'text-slate-600 bg-slate-100'
                }`}
              >
                {diff < 0 ? (
                  <TrendingDown className="w-3 h-3 stroke-[2.5]" />
                ) : diff > 0 ? (
                  <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <Minus className="w-3 h-3 stroke-[2.5]" />
                )}
                <span>{diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            <span>נמדד ב-{formattedDate}</span>
            {targetWeightKg && (
              <>
                <span>•</span>
                <span className="text-slate-500 font-medium flex items-center gap-0.5">
                  <Target className="w-3 h-3 text-teal-600 inline" />
                  יעד: {targetWeightKg.toFixed(1)} ק״ג
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Mini Sparkline */}
        {sparklineData && (
          <div className="hidden sm:block" title="מגמת שקילות אחרונות">
            <svg
              width="64"
              height="24"
              className="overflow-visible"
              aria-label="גרף מגמת שקילות"
            >
              <polyline
                fill="none"
                stroke={sparklineData.isDecreasing ? '#059669' : '#d97706'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklineData.pointsStr}
              />
            </svg>
          </div>
        )}

        <button
          type="button"
          id="btn-quick-log-weight"
          onClick={onLogWeightClick}
          aria-label="הזן שקילה חדשה"
          className="py-2 px-3 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border border-teal-200/80 min-h-[40px]"
        >
          <Plus className="w-4 h-4 text-teal-700 stroke-[2.5]" />
          <span>שקילה</span>
        </button>
      </div>
    </section>
  );
};
