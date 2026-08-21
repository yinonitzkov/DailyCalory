import React, { useState, useEffect } from 'react';
import { UserProfile, BiologicalSex, ActivityLevel } from '../../types';
import {
  calculateCalorieAndMacroTargets,
  ACTIVITY_MULTIPLIERS,
  calculateAge,
} from '../../utils/calculator';
import { User, Activity, Sparkles, Check, AlertCircle } from 'lucide-react';

interface ProfileSettingsSectionProps {
  userProfile: UserProfile;
  onSaveProfile: (updates: Partial<UserProfile>) => void;
  onApplyCalculatedTargets?: (targets: {
    calorieTargetKcal: number;
    proteinTargetG: number;
    carbTargetG: number;
    fatTargetG: number;
    fiberTargetG: number;
  }) => void;
}

export const ProfileSettingsSection: React.FC<ProfileSettingsSectionProps> = ({
  userProfile,
  onSaveProfile,
  onApplyCalculatedTargets,
}) => {
  const [birthDate, setBirthDate] = useState(userProfile.birthDate || '1995-01-01');
  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex>(
    userProfile.biologicalSex || 'female'
  );
  const [heightCm, setHeightCm] = useState<number>(userProfile.heightCm || 170);
  const [currentWeightKg, setCurrentWeightKg] = useState<number>(
    userProfile.currentWeightKg || 70
  );
  const [targetWeightKg, setTargetWeightKg] = useState<number>(
    userProfile.targetWeightKg || 65
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    userProfile.activityLevel || 'moderate'
  );

  const [hasChanges, setHasChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync from props
  useEffect(() => {
    setBirthDate(userProfile.birthDate || '1995-01-01');
    setBiologicalSex(userProfile.biologicalSex || 'female');
    setHeightCm(userProfile.heightCm || 170);
    setCurrentWeightKg(userProfile.currentWeightKg || 70);
    setTargetWeightKg(userProfile.targetWeightKg || 65);
    setActivityLevel(userProfile.activityLevel || 'moderate');
    setHasChanges(false);
  }, [userProfile]);

  // Check for modifications
  const handleFieldChange = () => {
    setHasChanges(true);
    setSavedSuccess(false);
  };

  // Calculate live REE and TDEE
  const calculated = calculateCalorieAndMacroTargets({
    birthDate,
    biologicalSex,
    heightCm,
    currentWeightKg,
    targetWeightKg,
    activityLevel,
  });

  const age = calculateAge(birthDate);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      birthDate,
      biologicalSex,
      heightCm: Number(heightCm),
      currentWeightKg: Number(currentWeightKg),
      targetWeightKg: Number(targetWeightKg),
      activityLevel,
    });
    setHasChanges(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleApplyCalculations = () => {
    if (onApplyCalculatedTargets) {
      onApplyCalculatedTargets({
        calorieTargetKcal: calculated.suggestedCalories,
        proteinTargetG: calculated.proteinG,
        carbTargetG: calculated.carbsG,
        fatTargetG: calculated.fatG,
        fiberTargetG: calculated.fiberG,
      });
      // Also save physical updates
      onSaveProfile({
        birthDate,
        biologicalSex,
        heightCm: Number(heightCm),
        currentWeightKg: Number(currentWeightKg),
        targetWeightKg: Number(targetWeightKg),
        activityLevel,
      });
      setHasChanges(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <section
      id="settings-profile-section"
      aria-label="הגדרות פרופיל אישי ונתונים פיזיים"
      className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">פרופיל אישי ומדדים</h3>
            <p className="text-[11px] text-slate-500">
              הנתונים הפיזיים שלך המשמשים לחישוב שריפת האנרגיה (BMR & TDEE)
            </p>
          </div>
        </div>

        {savedSuccess && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-xl flex items-center gap-1 animate-in fade-in">
            <Check className="w-3.5 h-3.5" /> נשמר
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Sex & Birthdate Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Biological Sex */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              מין ביולוגי
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setBiologicalSex('female');
                  handleFieldChange();
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  biologicalSex === 'female'
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                נקבה
              </button>
              <button
                type="button"
                onClick={() => {
                  setBiologicalSex('male');
                  handleFieldChange();
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  biologicalSex === 'male'
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                זכר
              </button>
            </div>
          </div>

          {/* Birthdate */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              תאריך לידה (גיל: {age})
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => {
                setBirthDate(e.target.value);
                handleFieldChange();
              }}
              max={new Date().toISOString().split('T')[0]}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Height, Current Weight, Target Weight */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Height */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              גובה (ס״מ)
            </label>
            <input
              type="number"
              min="100"
              max="240"
              value={heightCm}
              onChange={(e) => {
                setHeightCm(Number(e.target.value));
                handleFieldChange();
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Current Weight */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              משקל נוכחי (ק״ג)
            </label>
            <input
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={currentWeightKg}
              onChange={(e) => {
                setCurrentWeightKg(Number(e.target.value));
                handleFieldChange();
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Target Weight */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              משקל יעד (ק״ג)
            </label>
            <input
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={targetWeightKg}
              onChange={(e) => {
                setTargetWeightKg(Number(e.target.value));
                handleFieldChange();
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Activity Level Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            רמת פעילות גופנית
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map((level) => {
              const item = ACTIVITY_MULTIPLIERS[level];
              const isSelected = activityLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    setActivityLevel(level);
                    handleFieldChange();
                  }}
                  className={`p-2.5 rounded-2xl border text-right transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-teal-50 border-teal-400 ring-1 ring-teal-400'
                      : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      {item.label}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      {item.description}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    ×{item.factor}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Metabolic Calculations Banner */}
        <div className="p-3 bg-gradient-to-r from-teal-50 to-slate-50 rounded-2xl border border-teal-200/70 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>הוצאה אנרגטית מחושבת (נוסחת Mifflin-St Jeor):</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-white/80 rounded-xl border border-teal-100">
              <span className="text-[10px] text-slate-500 block">חילוף חומרים (BMR)</span>
              <span className="font-extrabold text-slate-800">{calculated.ree} קק״ל</span>
            </div>
            <div className="p-2 bg-white/80 rounded-xl border border-teal-100">
              <span className="text-[10px] text-slate-500 block">הוצאה יומית (TDEE)</span>
              <span className="font-extrabold text-slate-800">{calculated.tdee} קק״ל</span>
            </div>
            <div className="p-2 bg-white/80 rounded-xl border border-teal-200">
              <span className="text-[10px] text-teal-700 font-bold block">יעד מוצע</span>
              <span className="font-extrabold text-teal-900">{calculated.suggestedCalories} קק״ל</span>
            </div>
          </div>

          {calculated.isFloorReached && calculated.floorWarningMessage && (
            <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{calculated.floorWarningMessage}</span>
            </div>
          )}

          {/* Quick Apply Calculated Targets */}
          {onApplyCalculatedTargets && (
            <button
              type="button"
              onClick={handleApplyCalculations}
              className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>החל יעדים קלוריים ומאקרו מוצעים ({calculated.suggestedCalories} קק״ל)</span>
            </button>
          )}
        </div>

        {/* Save button if fields modified */}
        {hasChanges && (
          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-98"
          >
            שמור שינויים בפרופיל
          </button>
        )}
      </form>
    </section>
  );
};
