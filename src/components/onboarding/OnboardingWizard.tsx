import React, { useState, useMemo } from 'react';
import { BiologicalSex, ActivityLevel } from '../../types';
import { calculateCalorieAndMacroTargets, ACTIVITY_MULTIPLIERS } from '../../utils/calculator';
import { useApp } from '../../context/AppContext';
import { Sparkles, ArrowLeft, ArrowRight, Check, AlertTriangle, Scale, Ruler, Calendar, Activity } from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const { completeOnboarding } = useApp();

  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [birthDate, setBirthDate] = useState<string>('1995-05-15');
  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex>('female');
  const [heightCm, setHeightCm] = useState<number>(168);
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(70);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(64);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');

  // Custom adjusted target (if user manually edits)
  const [customCalories, setCustomCalories] = useState<number | null>(null);

  // Calculate targets based on current inputs
  const calculated = useMemo(() => {
    return calculateCalorieAndMacroTargets({
      birthDate,
      biologicalSex,
      heightCm: Number(heightCm) || 165,
      currentWeightKg: Number(currentWeightKg) || 70,
      targetWeightKg: Number(targetWeightKg) || undefined,
      activityLevel,
    });
  }, [birthDate, biologicalSex, heightCm, currentWeightKg, targetWeightKg, activityLevel]);

  const finalCalories = customCalories !== null ? customCalories : calculated.suggestedCalories;

  // Derive macros based on approved/edited calories
  const finalProteinG = Math.round((finalCalories * 0.25) / 4);
  const finalCarbsG = Math.round((finalCalories * 0.45) / 4);
  const finalFatG = Math.round((finalCalories * 0.30) / 9);
  const finalFiberG = Math.round((finalCalories / 1000) * 14);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleFinish = () => {
    completeOnboarding({
      birthDate,
      biologicalSex,
      heightCm: Number(heightCm),
      currentWeightKg: Number(currentWeightKg),
      targetWeightKg: Number(targetWeightKg),
      activityLevel,
      calorieTargetKcal: finalCalories,
      proteinTargetG: finalProteinG,
      carbTargetG: finalCarbsG,
      fatTargetG: finalFatG,
      fiberTargetG: finalFiberG,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem',
      locale: 'he-IL',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto px-4 py-6">
      {/* Top Header */}
      <header className="text-center pt-4 pb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/20 mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          ברוכים הבאים ל-קלוריות
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {step === 1 ? 'הגדרת נתונים אישיים לקביעת יעד' : 'אישור היעד הקלורי המוצע'}
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-teal-600' : 'w-4 bg-teal-200'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-teal-600' : 'w-4 bg-teal-200'}`} />
        </div>
      </header>

      {/* Step 1: Input Form */}
      {step === 1 && (
        <form onSubmit={handleNext} className="space-y-4 my-auto py-2">
          {/* Biological Sex */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              מין ביולוגי (עבור נוסחת החישוב)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-sex-female"
                onClick={() => setBiologicalSex('female')}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                  biologicalSex === 'female'
                    ? 'bg-teal-50 border-teal-500 text-teal-800 ring-1 ring-teal-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                נקבה
              </button>
              <button
                type="button"
                id="btn-sex-male"
                onClick={() => setBiologicalSex('male')}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                  biologicalSex === 'male'
                    ? 'bg-teal-50 border-teal-500 text-teal-800 ring-1 ring-teal-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                זכר
              </button>
            </div>
          </div>

          {/* Birth Date */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <label htmlFor="input-birthdate" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>תאריך לידה</span>
            </label>
            <input
              id="input-birthdate"
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-right"
            />
          </div>

          {/* Height & Weights */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div>
              <label htmlFor="input-height" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Ruler className="w-3.5 h-3.5 text-teal-600" />
                <span>גובה (ס״מ)</span>
              </label>
              <input
                id="input-height"
                type="number"
                min="100"
                max="250"
                required
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="input-current-weight" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                  <Scale className="w-3.5 h-3.5 text-teal-600" />
                  <span>משקל נוכחי (ק״ג)</span>
                </label>
                <input
                  id="input-current-weight"
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  required
                  value={currentWeightKg}
                  onChange={(e) => setCurrentWeightKg(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>
              <div>
                <label htmlFor="input-target-weight" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                  <Scale className="w-3.5 h-3.5 text-teal-600" />
                  <span>משקל יעד (ק״ג)</span>
                </label>
                <input
                  id="input-target-weight"
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Activity Level */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>רמת פעילות גופנית</span>
            </label>
            <div className="space-y-1.5">
              {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map((level) => {
                const item = ACTIVITY_MULTIPLIERS[level];
                const isSelected = activityLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    id={`btn-activity-${level}`}
                    onClick={() => setActivityLevel(level)}
                    className={`w-full text-right p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <span className="font-semibold block">{item.label}</span>
                      <span className="text-[11px] text-slate-500">{item.description}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0 mr-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            id="btn-onboarding-continue"
            className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-2xl shadow-md shadow-teal-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>חשב יעד קלורי מוצע</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Step 2: Calorie Target Approval & Adjustment */}
      {step === 2 && (
        <div className="space-y-4 my-auto py-2">
          {/* Suggested Target Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>יעד מוצע — הערכה בלבד</span>
            </div>

            <div className="my-3">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {finalCalories.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-slate-500 mr-2">
                קק״ל / יום
              </span>
            </div>

            {/* Manual edit control */}
            <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCustomCalories((prev) => Math.max(1000, (prev ?? calculated.suggestedCalories) - 50))}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition-colors"
                aria-label="הפחת 50 קלוריות"
              >
                -
              </button>
              <div className="text-xs text-slate-500 font-medium px-2">
                עריכה ידנית
              </div>
              <button
                type="button"
                onClick={() => setCustomCalories((prev) => (prev ?? calculated.suggestedCalories) + 50)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition-colors"
                aria-label="הוסף 50 קלוריות"
              >
                +
              </button>
            </div>

            {customCalories !== null && (
              <button
                type="button"
                onClick={() => setCustomCalories(null)}
                className="text-[11px] text-teal-600 hover:underline mt-2 inline-block font-medium"
              >
                שחזר להמלצה המקורית ({calculated.suggestedCalories} קק״ל)
              </button>
            )}
          </div>

          {/* Safety floor notice if triggered */}
          {calculated.isFloorReached && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">גבול בטיחות מומלץ</span>
                <span>{calculated.floorWarningMessage}</span>
              </div>
            </div>
          )}

          {/* Derived Macro Targets */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-700 mb-3 text-right">
              יעדי מאקרו יומיים מומלצים
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-teal-50/70 p-2 rounded-xl border border-teal-100">
                <span className="text-[11px] text-teal-700 font-semibold block">חלבון</span>
                <span className="text-sm font-bold text-teal-900">{finalProteinG}ג׳</span>
                <span className="text-[10px] text-teal-600 block">25%</span>
              </div>
              <div className="bg-blue-50/70 p-2 rounded-xl border border-blue-100">
                <span className="text-[11px] text-blue-700 font-semibold block">פחמימות</span>
                <span className="text-sm font-bold text-blue-900">{finalCarbsG}ג׳</span>
                <span className="text-[10px] text-blue-600 block">45%</span>
              </div>
              <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-100">
                <span className="text-[11px] text-amber-700 font-semibold block">שומן</span>
                <span className="text-sm font-bold text-amber-900">{finalFatG}ג׳</span>
                <span className="text-[10px] text-amber-600 block">30%</span>
              </div>
              <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                <span className="text-[11px] text-emerald-700 font-semibold block">סיבים</span>
                <span className="text-sm font-bold text-emerald-900">{finalFiberG}ג׳</span>
                <span className="text-[10px] text-emerald-600 block">14ג׳/1k</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2.5">
              ניתן לשנות את יעדי המאקרו בכל עת דרך מסך ההגדרות
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              id="btn-onboarding-approve"
              onClick={handleFinish}
              className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-2xl shadow-md shadow-teal-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>אשר והתחל במעקב</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2.5 px-4 text-slate-600 hover:text-slate-900 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>חזור לעריכת נתונים אישיים</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer Disclaimer */}
      <footer className="text-center text-[11px] text-slate-400 py-2">
        האפליקציה אינה מהווה תחליף לייעוץ תזונתי או רפואי מקצועי
      </footer>
    </div>
  );
};
