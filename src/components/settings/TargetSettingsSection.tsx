import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { Target, PieChart, Sparkles, Check, AlertCircle } from 'lucide-react';

interface TargetSettingsSectionProps {
  userProfile: UserProfile;
  onSaveTargets: (targets: {
    calorieTargetKcal: number;
    proteinTargetG: number;
    carbTargetG: number;
    fatTargetG: number;
    fiberTargetG: number;
  }) => void;
}

export const TargetSettingsSection: React.FC<TargetSettingsSectionProps> = ({
  userProfile,
  onSaveTargets,
}) => {
  const [calorieTarget, setCalorieTarget] = useState<number>(
    userProfile.calorieTargetKcal || 1800
  );
  const [proteinTarget, setProteinTarget] = useState<number>(
    userProfile.proteinTargetG || 110
  );
  const [carbTarget, setCarbTarget] = useState<number>(
    userProfile.carbTargetG || 200
  );
  const [fatTarget, setFatTarget] = useState<number>(
    userProfile.fatTargetG || 60
  );
  const [fiberTarget, setFiberTarget] = useState<number>(
    userProfile.fiberTargetG || 25
  );

  const [hasChanges, setHasChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setCalorieTarget(userProfile.calorieTargetKcal || 1800);
    setProteinTarget(userProfile.proteinTargetG || 110);
    setCarbTarget(userProfile.carbTargetG || 200);
    setFatTarget(userProfile.fatTargetG || 60);
    setFiberTarget(userProfile.fiberTargetG || 25);
    setHasChanges(false);
  }, [userProfile]);

  // Calculate calories from macros (4 kcal/g protein, 4 kcal/g carbs, 9 kcal/g fat)
  const macroCaloriesTotal = proteinTarget * 4 + carbTarget * 4 + fatTarget * 9;
  const proteinPercent = Math.round(((proteinTarget * 4) / (macroCaloriesTotal || 1)) * 100);
  const carbPercent = Math.round(((carbTarget * 4) / (macroCaloriesTotal || 1)) * 100);
  const fatPercent = Math.round(((fatTarget * 9) / (macroCaloriesTotal || 1)) * 100);

  const isMale = userProfile.biologicalSex === 'male';
  const minSafeFloor = isMale ? 1500 : 1200;
  const isBelowFloor = calorieTarget < minSafeFloor;

  const handleFieldChange = () => {
    setHasChanges(true);
    setSavedSuccess(false);
  };

  // Macro preset appliers
  const applyMacroPreset = (pRatio: number, cRatio: number, fRatio: number) => {
    const cals = calorieTarget || 1800;
    const newProtein = Math.round((cals * pRatio) / 4);
    const newCarbs = Math.round((cals * cRatio) / 4);
    const newFat = Math.round((cals * fRatio) / 9);
    const newFiber = Math.round((cals / 1000) * 14);

    setProteinTarget(newProtein);
    setCarbTarget(newCarbs);
    setFatTarget(newFat);
    setFiberTarget(newFiber);
    setHasChanges(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTargets({
      calorieTargetKcal: Number(calorieTarget),
      proteinTargetG: Number(proteinTarget),
      carbTargetG: Number(carbTarget),
      fatTargetG: Number(fatTarget),
      fiberTargetG: Number(fiberTarget),
    });
    setHasChanges(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <section
      id="settings-targets-section"
      aria-label="הגדרת יעדי קלוריות ומאקרו"
      className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">יעדי תזונה ומאקרונוטריאנטים</h3>
            <p className="text-[11px] text-slate-500">הגדרת כמויות יומיות ויחסי אבות המזון</p>
          </div>
        </div>

        {savedSuccess && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-xl flex items-center gap-1 animate-in fade-in">
            <Check className="w-3.5 h-3.5" /> נשמר
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Daily Calorie Target Input */}
        <div className="p-3.5 bg-teal-50/60 rounded-2xl border border-teal-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-teal-950">
              יעד קלוריות יומי (קק״ל)
            </label>
            <span className="text-xs font-bold text-teal-700">
              {calorieTarget} קק״ל / יום
            </span>
          </div>

          <input
            type="range"
            min="1000"
            max="4000"
            step="25"
            value={calorieTarget}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCalorieTarget(val);
              handleFieldChange();
            }}
            className="w-full accent-teal-600 cursor-pointer"
          />

          <div className="flex items-center justify-between gap-2">
            <input
              type="number"
              min="800"
              max="5000"
              value={calorieTarget}
              onChange={(e) => {
                setCalorieTarget(Number(e.target.value));
                handleFieldChange();
              }}
              className="w-28 py-1.5 px-3 bg-white border border-teal-300 rounded-xl text-xs font-extrabold text-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <span className="text-[11px] text-slate-500">
              מומלץ: {userProfile.calorieTargetKcal || 1800} קק״ל
            </span>
          </div>

          {isBelowFloor && (
            <div className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded-xl border border-rose-200 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>
                שים לב: יעד זה נמוך מסף הבטיחות התזונתי ({minSafeFloor} קק״ל).
              </span>
            </div>
          )}
        </div>

        {/* Macro Presets */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            תבניות חלוקת מאקרו מומלצות:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => applyMacroPreset(0.25, 0.45, 0.3)}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-right transition-all"
            >
              <span className="block text-[11px] font-bold text-slate-800">קלאסי מאוזן</span>
              <span className="block text-[9px] text-slate-400">25% ח | 45% פ | 30% ש</span>
            </button>

            <button
              type="button"
              onClick={() => applyMacroPreset(0.35, 0.35, 0.3)}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-right transition-all"
            >
              <span className="block text-[11px] font-bold text-slate-800">עתיר חלבון</span>
              <span className="block text-[9px] text-slate-400">35% ח | 35% פ | 30% ש</span>
            </button>

            <button
              type="button"
              onClick={() => applyMacroPreset(0.3, 0.25, 0.45)}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-right transition-all"
            >
              <span className="block text-[11px] font-bold text-slate-800">דל פחמימות</span>
              <span className="block text-[9px] text-slate-400">30% ח | 25% פ | 45% ש</span>
            </button>
          </div>
        </div>

        {/* Macro Nutrient Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Protein */}
          <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-rose-900">חלבון</label>
              <span className="text-[10px] font-bold text-rose-700">{proteinPercent}%</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="20"
                max="400"
                value={proteinTarget}
                onChange={(e) => {
                  setProteinTarget(Number(e.target.value));
                  handleFieldChange();
                }}
                className="w-full py-1.5 px-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <span className="text-[10px] text-rose-600 font-semibold">גרם</span>
            </div>
          </div>

          {/* Carbs */}
          <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900">פחמימות</label>
              <span className="text-[10px] font-bold text-amber-700">{carbPercent}%</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="20"
                max="600"
                value={carbTarget}
                onChange={(e) => {
                  setCarbTarget(Number(e.target.value));
                  handleFieldChange();
                }}
                className="w-full py-1.5 px-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <span className="text-[10px] text-amber-600 font-semibold">גרם</span>
            </div>
          </div>

          {/* Fat */}
          <div className="p-3 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-teal-900">שומן</label>
              <span className="text-[10px] font-bold text-teal-700">{fatPercent}%</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="10"
                max="250"
                value={fatTarget}
                onChange={(e) => {
                  setFatTarget(Number(e.target.value));
                  handleFieldChange();
                }}
                className="w-full py-1.5 px-2 bg-white border border-teal-200 rounded-xl text-xs font-bold text-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <span className="text-[10px] text-teal-600 font-semibold">גרם</span>
            </div>
          </div>

          {/* Fiber */}
          <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-900">סיבים</label>
              <span className="text-[10px] text-emerald-600 font-medium">יעד</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="10"
                max="100"
                value={fiberTarget}
                onChange={(e) => {
                  setFiberTarget(Number(e.target.value));
                  handleFieldChange();
                }}
                className="w-full py-1.5 px-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-[10px] text-emerald-600 font-semibold">גרם</span>
            </div>
          </div>
        </div>

        {/* Visual Macro Proportional Bar */}
        <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <PieChart className="w-3 h-3 text-slate-500" />
              התפלגות קלוריות מהמאקרו:
            </span>
            <span className="font-bold text-slate-800">
              סה״כ {macroCaloriesTotal} קק״ל מחושבות
            </span>
          </div>

          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${proteinPercent}%` }}
              className="h-full bg-rose-500 transition-all"
              title={`חלבון: ${proteinPercent}%`}
            />
            <div
              style={{ width: `${carbPercent}%` }}
              className="h-full bg-amber-500 transition-all"
              title={`פחמימות: ${carbPercent}%`}
            />
            <div
              style={{ width: `${fatPercent}%` }}
              className="h-full bg-teal-600 transition-all"
              title={`שומן: ${fatPercent}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> חלבון ({proteinPercent}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> פחמימות ({carbPercent}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" /> שומן ({fatPercent}%)
            </span>
          </div>
        </div>

        {/* Save button if changed */}
        {hasChanges && (
          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-98"
          >
            שמור שינויים ביעדים
          </button>
        )}
      </form>
    </section>
  );
};
