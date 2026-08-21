import React, { useState, useMemo } from 'react';
import { WeightEntry } from '../../types';
import { prepareWeightChartData, ChartPoint } from '../../utils/weightCalculations';
import { TrendingDown, TrendingUp, Calendar, Info } from 'lucide-react';

interface WeightTrendChartProps {
  entries: WeightEntry[];
  targetWeightKg?: number;
}

type TimeframeOption = 7 | 30 | 90 | 'all';

export const WeightTrendChart: React.FC<WeightTrendChartProps> = ({
  entries,
  targetWeightKg,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>(30);
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(true);
  const [activePoint, setActivePoint] = useState<ChartPoint | null>(null);

  const chartData = useMemo(() => {
    return prepareWeightChartData(entries, timeframe);
  }, [entries, timeframe]);

  // Determine chart bounds (min and max Y)
  const { minY, maxY, weightRange } = useMemo(() => {
    if (chartData.length === 0) return { minY: 60, maxY: 80, weightRange: 20 };

    const weights = chartData.map((d) => d.weightKg);
    if (targetWeightKg) weights.push(targetWeightKg);

    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const padding = Math.max(1.5, (max - min) * 0.15);

    const calculatedMin = Math.max(0, Math.floor((min - padding) * 10) / 10);
    const calculatedMax = Math.ceil((max + padding) * 10) / 10;
    const range = calculatedMax - calculatedMin || 1;

    return {
      minY: calculatedMin,
      maxY: calculatedMax,
      weightRange: range,
    };
  }, [chartData, targetWeightKg]);

  // Dimensions for SVG viewBox
  const width = 360;
  const height = 180;
  const paddingX = 28;
  const paddingY = 24;

  const chartInnerWidth = width - paddingX * 2;
  const chartInnerHeight = height - paddingY * 2;

  // Calculate coordinates for points
  const pointsWithCoords = useMemo(() => {
    if (chartData.length === 0) return [];

    return chartData.map((point, index) => {
      const x =
        chartData.length === 1
          ? width / 2
          : paddingX + (index / (chartData.length - 1)) * chartInnerWidth;

      const y =
        height -
        paddingY -
        ((point.weightKg - minY) / weightRange) * chartInnerHeight;

      const avgY =
        point.movingAverageKg !== undefined
          ? height -
            paddingY -
            ((point.movingAverageKg - minY) / weightRange) * chartInnerHeight
          : undefined;

      return {
        ...point,
        x,
        y,
        avgY,
      };
    });
  }, [chartData, minY, weightRange, chartInnerWidth, chartInnerHeight]);

  // SVG path for actual weight line
  const weightLinePath = useMemo(() => {
    if (pointsWithCoords.length < 2) return '';
    return pointsWithCoords.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');
  }, [pointsWithCoords]);

  // SVG path for area fill underneath the curve
  const areaPath = useMemo(() => {
    if (pointsWithCoords.length < 2) return '';
    const first = pointsWithCoords[0];
    const last = pointsWithCoords[pointsWithCoords.length - 1];
    const bottomY = height - paddingY;
    return `${weightLinePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [pointsWithCoords, weightLinePath]);

  // SVG path for smoothed moving average line
  const movingAvgPath = useMemo(() => {
    if (!showMovingAverage || pointsWithCoords.length < 2) return '';
    return pointsWithCoords.reduce((acc, curr, idx) => {
      if (curr.avgY === undefined) return acc;
      return idx === 0 ? `M ${curr.x} ${curr.avgY}` : `${acc} L ${curr.x} ${curr.avgY}`;
    }, '');
  }, [pointsWithCoords, showMovingAverage]);

  // Calculate target line Y
  const targetLineY = useMemo(() => {
    if (!targetWeightKg) return null;
    return (
      height -
      paddingY -
      ((targetWeightKg - minY) / weightRange) * chartInnerHeight
    );
  }, [targetWeightKg, minY, weightRange, chartInnerHeight]);

  return (
    <section
      id="weight-trend-chart-card"
      aria-label="גרף מגמת משקל אינטראקטיבי"
      className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4"
      dir="rtl"
    >
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">גרף מגמת משקל</h3>
            <p className="text-[11px] text-slate-500">תנודות משקל וממוצע נע של 7 ימים</p>
          </div>
        </div>

        {/* Timeframe selector tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTimeframe(7)}
            className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
              timeframe === 7
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7 ימים
          </button>
          <button
            type="button"
            onClick={() => setTimeframe(30)}
            className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
              timeframe === 30
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 יום
          </button>
          <button
            type="button"
            onClick={() => setTimeframe(90)}
            className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
              timeframe === 90
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            90 יום
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('all')}
            className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${
              timeframe === 'all'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            הכל
          </button>
        </div>
      </div>

      {/* Chart Canvas or Empty State */}
      {pointsWithCoords.length >= 2 ? (
        <div className="relative pt-2">
          {/* Active Point Detail Bubble */}
          {activePoint && (
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1.5 px-3 rounded-xl shadow-lg z-20 flex items-center gap-2 pointer-events-none transition-all animate-in fade-in"
              dir="rtl"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-semibold">{activePoint.label}:</span>
              <span className="font-bold text-teal-300">{activePoint.weightKg.toFixed(1)} ק״ג</span>
              {activePoint.diffFromPrev !== undefined && (
                <span
                  className={`text-[10px] font-bold px-1 rounded ${
                    activePoint.diffFromPrev < 0
                      ? 'text-emerald-300 bg-emerald-950'
                      : activePoint.diffFromPrev > 0
                      ? 'text-amber-300 bg-amber-950'
                      : 'text-slate-300'
                  }`}
                >
                  {activePoint.diffFromPrev > 0
                    ? `+${activePoint.diffFromPrev}`
                    : activePoint.diffFromPrev}{' '}
                  ק״ג
                </span>
              )}
            </div>
          )}

          {/* SVG Chart */}
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-48 select-none"
              aria-label="גרף שינויי משקל"
            >
              <defs>
                <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Guidelines */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={width - paddingX}
                y2={paddingY}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
              />
              <line
                x1={paddingX}
                y1={height - paddingY}
                x2={width - paddingX}
                y2={height - paddingY}
                stroke="#e2e8f0"
              />

              {/* Min and Max Y labels */}
              <text
                x={paddingX - 4}
                y={paddingY + 4}
                fontSize="9"
                fill="#94a3b8"
                textAnchor="end"
                fontWeight="600"
              >
                {maxY.toFixed(1)}
              </text>
              <text
                x={paddingX - 4}
                y={height - paddingY + 2}
                fontSize="9"
                fill="#94a3b8"
                textAnchor="end"
                fontWeight="600"
              >
                {minY.toFixed(1)}
              </text>

              {/* Target Line (if visible in range) */}
              {targetLineY !== null && targetLineY >= paddingY && targetLineY <= height - paddingY && (
                <g>
                  <line
                    x1={paddingX}
                    y1={targetLineY}
                    x2={width - paddingX}
                    y2={targetLineY}
                    stroke="#14b8a6"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={width - paddingX + 2}
                    y={targetLineY + 3}
                    fontSize="9"
                    fill="#0f766e"
                    fontWeight="700"
                    textAnchor="start"
                  >
                    יעד
                  </text>
                </g>
              )}

              {/* Gradient Area under weight line */}
              <path d={areaPath} fill="url(#weightAreaGrad)" />

              {/* Moving Average Line (Smoothed orange line) */}
              {showMovingAverage && movingAvgPath && (
                <path
                  d={movingAvgPath}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="2 2"
                  strokeLinecap="round"
                />
              )}

              {/* Weight Line (Solid teal line) */}
              <path
                d={weightLinePath}
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {pointsWithCoords.map((pt) => {
                const isSelected = activePoint?.id === pt.id;
                return (
                  <g
                    key={pt.id}
                    className="cursor-pointer group"
                    onClick={() => setActivePoint(pt)}
                    onMouseEnter={() => setActivePoint(pt)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 6 : 4}
                      className="fill-white stroke-teal-600 transition-all"
                      strokeWidth={isSelected ? 3 : 2}
                    />
                    {/* Invisible larger hit target for easy touch */}
                    <circle cx={pt.x} cy={pt.y} r={16} fill="transparent" />
                  </g>
                );
              })}

              {/* X Axis Date Labels */}
              {pointsWithCoords.map((pt, idx) => {
                // Show label on first, last, and intermittent points to prevent overcrowding
                const showLabel =
                  idx === 0 ||
                  idx === pointsWithCoords.length - 1 ||
                  (pointsWithCoords.length > 5 && idx % Math.ceil(pointsWithCoords.length / 4) === 0);

                if (!showLabel) return null;

                return (
                  <text
                    key={`lbl-${pt.id}`}
                    x={pt.x}
                    y={height - 6}
                    fontSize="9"
                    fill="#64748b"
                    textAnchor="middle"
                    fontWeight="500"
                  >
                    {pt.label}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        /* Empty / Low Data Points State */
        <div className="py-10 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
          <Info className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">
            נדרשות לפחות 2 שקילות להצגת גרף מגמה מלא
          </p>
          <p className="text-[11px] text-slate-400">
            הזן שקילות נוספות לאורך השבוע כדי לראות את כיוון הירידה והממוצע הנע.
          </p>
        </div>
      )}

      {/* Legend & Toggle Controls */}
      <div className="flex items-center justify-between pt-1 text-xs text-slate-600 border-t border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium text-[11px]">
            <span className="w-3 h-1 bg-teal-600 rounded-full inline-block" />
            <span>משקל נמדד</span>
          </div>

          {targetWeightKg && (
            <div className="flex items-center gap-1.5 font-medium text-[11px]">
              <span className="w-3 h-0.5 border-b border-dashed border-teal-500 inline-block" />
              <span>קו יעד ({targetWeightKg.toFixed(1)} ק״ג)</span>
            </div>
          )}
        </div>

        {/* Toggle 7-Day Moving Average */}
        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700 select-none">
          <input
            type="checkbox"
            checked={showMovingAverage}
            onChange={(e) => setShowMovingAverage(e.target.checked)}
            className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5"
          />
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-1 bg-amber-500 rounded-full inline-block" />
            <span>ממוצע נע (מנטרל נוזלים)</span>
          </span>
        </label>
      </div>
    </section>
  );
};
