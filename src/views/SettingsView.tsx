import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProfileSettingsSection } from '../components/settings/ProfileSettingsSection';
import { TargetSettingsSection } from '../components/settings/TargetSettingsSection';
import { FoodMemorySection } from '../components/settings/FoodMemorySection';
import { NotificationsSettingsSection } from '../components/settings/NotificationsSettingsSection';
import { DataManagementSection } from '../components/settings/DataManagementSection';
import { AboutAppSection } from '../components/settings/AboutAppSection';
import { UserProfile, WorkoutPlan } from '../types';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { getDataRepository } from '../services/repository';

export const SettingsView: React.FC = () => {
  const {
    userProfile,
    updateProfile,
    foodReports,
    weightEntries,
    foodMemories,
    waterEntries,
    resetUserData,
    importUserData,
    storageType,
    currentUser,
  } = useApp();

  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const workoutRepository = useMemo(() => getDataRepository(storageType), [storageType]);
  useEffect(() => {
    workoutRepository.getWorkoutPlans(currentUser?.id || userProfile?.userId).then(setWorkoutPlans).catch(() => setWorkoutPlans([]));
  }, [workoutRepository, currentUser?.id, userProfile?.userId]);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!userProfile) {
    return null;
  }

  const handleSaveProfile = (updates: Partial<UserProfile>) => {
    updateProfile(updates);
    setFeedback({
      type: 'success',
      text: 'הפרופיל האישי עודכן בהצלחה.',
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaveTargets = (targets: {
    calorieTargetKcal: number;
    proteinTargetG: number;
    carbTargetG: number;
    fatTargetG: number;
    fiberTargetG: number;
  }) => {
    updateProfile(targets);
    setFeedback({
      type: 'success',
      text: 'יעדי הקלוריות והמאקרו עודכנו בהצלחה.',
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleApplyCalculatedTargets = (targets: {
    calorieTargetKcal: number;
    proteinTargetG: number;
    carbTargetG: number;
    fatTargetG: number;
    fiberTargetG: number;
  }) => {
    updateProfile(targets);
    setFeedback({
      type: 'success',
      text: 'היעדים המחושבים הוחלו ונשמרו בהצלחה!',
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Toast Feedback */}
      {feedback && (
        <div
          id="settings-view-feedback-banner"
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 border shadow-sm transition-all animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-200 border-emerald-800'
              : 'bg-rose-950/60 text-rose-200 border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="font-semibold">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-200 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Personal Profile & Physical Stats */}
      <ProfileSettingsSection
        userProfile={userProfile}
        onSaveProfile={handleSaveProfile}
        onApplyCalculatedTargets={handleApplyCalculatedTargets}
      />

      {/* 2. Personalized Food Memory & Shortcuts (Requested feature) */}
      <FoodMemorySection />

      {/* 3. Nutritional & Macro Targets */}
      <TargetSettingsSection
        userProfile={userProfile}
        onSaveTargets={handleSaveTargets}
      />

      {/* 4. Notifications & Reminders */}
      <NotificationsSettingsSection />

      {/* 5. Data Management (Export / Import / Reset) */}
      <DataManagementSection
        userProfile={userProfile}
        foodReports={foodReports}
        weightEntries={weightEntries}
        foodMemories={foodMemories}
        waterEntries={waterEntries}
        workoutPlans={workoutPlans}
        onResetData={resetUserData}
        onImportData={importUserData}
      />

      {/* 6. App Info & Privacy */}
      <AboutAppSection />
    </div>
  );
};
