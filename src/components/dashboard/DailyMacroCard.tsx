import React from 'react';
import { DailySummary } from '../../types';
import { Flame, AlertCircle } from 'lucide-react';

interface DailyMacroCardProps {
  summary: DailySummary;
}

export const DailyMacroCard: React.FC<DailyMacroCardProps> = ({ summary }) => {
  const {
    totalCalories,
    targetCalories,
    totalProteinG,
    targetProteinG,
    totalCarbsG,
    targetCarbsG,
    totalFatG,
    targetFatG,
    totalFiberG,
    targetFiberG,
  } = summary;

  const remainingCalories = targetCalories - totalCalories;
  const isOverBudget = remainingCalories < 0;
  const caloriePercentage = Math.min(100, Math.round((totalCalories / (targetCalories || 1)) * 100));

  // Percentage for macros
  const proteinPercent = Math.min(100, Math.round((totalProteinG / (targetProteinG || 1)) * 100));
  const carbsPercent = Math.min(100, Math.round((totalCarbsG / (targetCarbsG || 1)) * 100));
  const fatPercent = Math.min(100, Math.round((totalFatG / (targetFatG || 1)) * 100));
  const fiberPercent = Math.min(100, Math.round((totalFiberG / (targetFiberG || 1)) * 100));

  return (
    <section
      id="daily-macro-summary-card"
      aria-label="סיכום קלוריות ומאקרו יומי"
      className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-4"
    >
      {/* Header with Calories */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              תמונת מצב יומית
            </h2>
            <span className="text-[11px] text-slate-500">
              יעד יומי: {targetCalories.toLocaleString()} קק״ל
            </span>
          </div>
        </div>

        {/* Status Pill */}
        <div
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
            isOverBudget
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-teal-50 text-teal-800 border-teal-200/70'
          }`}
        >
          {isOverBudget && <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
          <span>
            {isOverBudget
              ? `חריגה של ${Math.abs(remainingCalories).toLocaleString()} קק״ל`
              : `נותרו ${remainingCalories.toLocaleString()} קק״ל`}
          </span>
        </div>
      </div>

      {/* Calories Main Big Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline text-xs">
          <span className="font-semibold text-slate-700">
            נצרך:{' '}
            <span className="text-base font-extrabold text-slate-900">
              {totalCalories.toLocaleString()}
            </span>{' '}
            קק״ל
          </span>
          <span className="text-slate-500 font-medium">
            {caloriePercentage}% מהיעד
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget ? 'bg-amber-500' : 'bg-teal-600'
            }`}
            style={{ width: `${caloriePercentage}%` }}
          />
        </div>
      </div>

      {/* 4 Macro Progress Bars Grid */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
        {/* חלבון */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-teal-800">חלבון</span>
            <span className="text-slate-600 font-medium">
              {totalProteinG}/{targetProteinG}ג׳
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 rounded-full transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
        </div>

        {/* פחמימות */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-blue-800">פחמימות</span>
            <span className="text-slate-600 font-medium">
              {totalCarbsG}/{targetCarbsG}ג׳
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
        </div>

        {/* שומן */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-amber-800">שומן</span>
            <span className="text-slate-600 font-medium">
              {totalFatG}/{targetFatG}ג׳
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
        </div>

        {/* סיבים */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-emerald-800">סיבים</span>
            <span className="text-slate-600 font-medium">
              {totalFiberG}/{targetFiberG}ג׳
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${fiberPercent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
