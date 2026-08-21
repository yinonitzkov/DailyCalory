import React from 'react';
import { Sparkles, TrendingUp, Award, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const WeeklyAiInsightsCard: React.FC = () => {
  const { weeklyHistory, userProfile } = useApp();

  const targetCal = userProfile?.calorieTargetKcal || 2000;
  const targetProtein = userProfile?.proteinTargetG || 120;

  const validDays = weeklyHistory.filter((d) => d.calories > 0);
  const avgCalories = validDays.length > 0
    ? Math.round(validDays.reduce((sum, d) => sum + d.calories, 0) / validDays.length)
    : targetCal;

  const diffCal = avgCalories - targetCal;
  const isOptimal = Math.abs(diffCal) <= targetCal * 0.1;

  return (
    <div
      id="weekly-ai-insights-card"
      className="bg-gradient-to-br from-purple-950/30 via-slate-900 to-indigo-950/20 border border-purple-800/30 rounded-3xl p-5 shadow-sm text-slate-100"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">תובנות ומגמות שבועיות (AI)</h3>
            <p className="text-xs text-slate-400">ניתוח חכם של ההרגלים והצריכה שלך</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-700/40 text-purple-300">
          <Zap className="w-3 h-3 text-purple-400" />
          <span>ממוצע: {avgCalories.toLocaleString()} קק״ל</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>דיוק מול היעד</span>
          </div>
          <p className="text-sm font-medium text-slate-200">
            {isOptimal ? 'עמידה מצוינת ביעד השבועי' : diffCal > 0 ? `חריגה קלה של כ-${diffCal} קק״ל` : `גרעון של כ-${Math.abs(diffCal)} קק״ל`}
          </p>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/60 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>דגש חלבון</span>
          </div>
          <p className="text-sm font-medium text-slate-200">
            יעד חלבון: {targetProtein} גרם ליום
          </p>
        </div>
      </div>

      <div className="mt-3 bg-purple-950/20 border border-purple-800/20 rounded-2xl p-3 text-xs text-purple-200/90 leading-relaxed flex items-start gap-2">
        <span className="text-purple-400 mt-0.5 font-bold">💡</span>
        <span>
          <strong>טיפ תזונתי מותאם אישית:</strong> שמירה על פיזור חלבון בכל 3-4 שעות (כמו ביו/קפה מועשר או ביצים) מעודדת תחושת שובע יציבה לאורך כל היום ושמירה על מסת שריר.
        </span>
      </div>
    </div>
  );
};
