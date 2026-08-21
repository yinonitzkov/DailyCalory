import React from 'react';
import { BarChart3 } from 'lucide-react';

interface WeeklyHistoryDay {
  date: string;
  dayLabel: string;
  calories: number;
  target: number;
}

interface WeeklyTrendGraphProps {
  history: WeeklyHistoryDay[];
  targetCalories: number;
}

export const WeeklyTrendGraph: React.FC<WeeklyTrendGraphProps> = ({ history, targetCalories }) => {
  // Find max value to scale chart proportionally
  const maxCalories = Math.max(targetCalories * 1.25, ...history.map((d) => d.calories || 0), 1000);

  return (
    <section
      id="weekly-calorie-trend"
      aria-label="גרף צריכה שבועי"
      className="p-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <BarChart3 className="w-4 h-4 text-teal-600" />
          <span>מעקב שבועי (7 ימים)</span>
        </div>
        <span className="text-[11px] text-slate-500">
          קו יעד: {targetCalories.toLocaleString()} קק״ל
        </span>
      </div>

      {/* 7 Days Bar Chart Container */}
      <div className="pt-2">
        <div className="h-28 flex items-end justify-between gap-1.5 px-1 relative">
          {/* Target Reference Line */}
          <div
            className="absolute left-0 right-0 border-b border-dashed border-teal-400/80 z-0 pointer-events-none flex items-center justify-end"
            style={{
              bottom: `${(targetCalories / maxCalories) * 100}%`,
            }}
          >
            <span className="text-[9px] text-teal-700 bg-teal-50 px-1 rounded-sm font-semibold ml-1">
              יעד
            </span>
          </div>

          {/* Daily Bars */}
          {history.map((day, idx) => {
            const heightPercent = Math.min(100, Math.max(8, (day.calories / maxCalories) * 100));
            const isOverTarget = day.calories > targetCalories;
            const isToday = idx === history.length - 1;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center h-full justify-end group relative z-10"
              >
                {/* Tooltip on hover/touch */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded-md whitespace-nowrap pointer-events-none z-20 font-medium">
                  {day.calories.toLocaleString()} קק״ל
                </div>

                {/* The Bar */}
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    isToday
                      ? isOverTarget
                        ? 'bg-amber-500 ring-2 ring-amber-300'
                        : 'bg-teal-600 ring-2 ring-teal-300'
                      : isOverTarget
                      ? 'bg-amber-400/80 hover:bg-amber-500'
                      : 'bg-teal-500/70 hover:bg-teal-600'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />

                {/* Day Label */}
                <span
                  className={`text-[11px] mt-1.5 tracking-tight ${
                    isToday ? 'font-bold text-teal-700' : 'text-slate-500 font-medium'
                  }`}
                >
                  {day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
