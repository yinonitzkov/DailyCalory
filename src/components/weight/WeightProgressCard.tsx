import React from 'react';
import { WeightProgressMetrics } from '../../utils/weightCalculations';
import { Scale, Target, TrendingDown, TrendingUp, Minus, Activity, Compass, Award } from 'lucide-react';

interface WeightProgressCardProps {
  metrics: WeightProgressMetrics;
  onLogClick: () => void;
}

export const WeightProgressCard: React.FC<WeightProgressCardProps> = ({
  metrics,
  onLogClick,
}) => {
  const {
    currentWeight,
    startingWeight,
    targetWeight,
    totalChangeKg,
    distanceToTargetKg,
    progressPercent,
    weeklyRateKg,
    minWeightKg,
    maxWeightKg,
    bmi,
  } = metrics;

  const isLosingGoal = targetWeight ? targetWeight < startingWeight : true;

  return (
    <section
      id="weight-progress-hero"
      aria-label="סיכום התקדמות משקל"
      className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4"
      dir="rtl"
    >
      {/* Header with Title & Quick Log Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-700">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">מעקב והתקדמות משקל</h2>
            <p className="text-xs text-slate-500">תמונת מצב מדויקת של היעדים והמגמה</p>
          </div>
        </div>

        <button
          type="button"
          id="btn-progress-log-weight"
          onClick={onLogClick}
          className="py-2 px-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm shadow-teal-600/20 active:scale-95 flex items-center gap-1.5"
        >
          <span>שקילה חדשה</span>
        </button>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        {/* Starting Weight */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
          <span className="text-[11px] text-slate-500 font-medium block">משקל התחלתי</span>
          <div className="text-base font-bold text-slate-800">
            {startingWeight.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">ק״ג</span>
          </div>
        </div>

        {/* Current Weight */}
        <div className="p-3 bg-teal-50/70 rounded-2xl border border-teal-200/80 space-y-0.5 relative">
          <span className="text-[11px] text-teal-800 font-bold block">משקל נוכחי</span>
          <div className="text-xl font-black text-teal-950 tracking-tight">
            {currentWeight.toFixed(1)} <span className="text-[10px] text-teal-700 font-bold">ק״ג</span>
          </div>
        </div>

        {/* Target Weight */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-0.5">
          <span className="text-[11px] text-slate-500 font-medium block">משקל יעד</span>
          <div className="text-base font-bold text-slate-800">
            {targetWeight !== undefined ? targetWeight.toFixed(1) : '—'}{' '}
            <span className="text-[10px] text-slate-400 font-normal">ק״ג</span>
          </div>
        </div>
      </div>

      {/* Progress Bar towards Target (if target set) */}
      {targetWeight !== undefined && (
        <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-teal-600" />
              התקדמות לעבר היעד ({progressPercent}%)
            </span>
            <span className="font-bold text-teal-800">
              {distanceToTargetKg !== undefined && distanceToTargetKg > 0 ? (
                <>נותרו {distanceToTargetKg.toFixed(1)} ק״ג ליעד</>
              ) : (
                <span className="text-emerald-700 flex items-center gap-1 font-bold">
                  <Award className="w-3.5 h-3.5 inline" /> השגת את היעד!
                </span>
              )}
            </span>
          </div>

          {/* Track Bar */}
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(progressPercent, 4))}%` }}
            />
          </div>
        </div>
      )}

      {/* Total Change & Insights Banner */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Total Change */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              totalChangeKg < 0
                ? 'bg-emerald-100 text-emerald-700'
                : totalChangeKg > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {totalChangeKg < 0 ? (
              <TrendingDown className="w-4 h-4 stroke-[2.5]" />
            ) : totalChangeKg > 0 ? (
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Minus className="w-4 h-4 stroke-[2.5]" />
            )}
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">שינוי כולל</span>
            <span className="text-sm font-extrabold text-slate-900">
              {totalChangeKg > 0 ? `+${totalChangeKg.toFixed(1)}` : totalChangeKg.toFixed(1)} ק״ג
            </span>
          </div>
        </div>

        {/* Weekly Rate */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">קצב שבועי ממוצע</span>
            <span className="text-sm font-extrabold text-slate-900">
              {weeklyRateKg !== 0
                ? `${weeklyRateKg > 0 ? `+${weeklyRateKg.toFixed(1)}` : weeklyRateKg.toFixed(1)} ק״ג/שב׳`
                : 'משקל יציב'}
            </span>
          </div>
        </div>
      </div>

      {/* BMI Card */}
      {bmi && (
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">מדד מסת גוף (BMI):</span>
            <span className="text-sm font-extrabold text-slate-900">{bmi.bmi}</span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${bmi.badgeBg} ${bmi.badgeText} ${bmi.badgeBorder}`}
            >
              {bmi.categoryLabelHebrew}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            {bmi.descriptionHebrew}
          </span>
        </div>
      )}
    </section>
  );
};
