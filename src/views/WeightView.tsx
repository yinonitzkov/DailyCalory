import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { WeightProgressCard } from '../components/weight/WeightProgressCard';
import { WeightTrendChart } from '../components/weight/WeightTrendChart';
import { WeightHistoryList } from '../components/weight/WeightHistoryList';
import { WeightMilestonesCard } from '../components/weight/WeightMilestonesCard';
import { LogWeightSheet } from '../components/modals/LogWeightSheet';
import {
  calculateWeightProgress,
  calculateWeightMilestones,
} from '../utils/weightCalculations';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const WeightView: React.FC = () => {
  const {
    weightEntries,
    latestWeight,
    userProfile,
    addWeightEntry,
    deleteWeightEntry,
  } = useApp();

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Compute metrics and milestones
  const metrics = useMemo(() => {
    return calculateWeightProgress(weightEntries, userProfile);
  }, [weightEntries, userProfile]);

  const milestones = useMemo(() => {
    return calculateWeightMilestones(weightEntries, userProfile);
  }, [weightEntries, userProfile]);

  const handleSaveWeight = (weightKg: number, recordedAt?: string) => {
    addWeightEntry(weightKg, recordedAt);
    const diff = latestWeight.current ? Math.round((weightKg - latestWeight.current) * 10) / 10 : 0;
    const diffText = diff !== 0 ? ` (${diff > 0 ? `+${diff}` : diff} ק״ג)` : '';
    setFeedback({
      type: 'success',
      text: `השקילה נשמרה בהצלחה: ${weightKg.toFixed(1)} ק״ג${diffText}`,
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteWeight = (id: string) => {
    deleteWeightEntry(id);
    setFeedback({
      type: 'success',
      text: 'רשומת השקילה נמחקה בהצלחה.',
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Feedback Banner */}
      {feedback && (
        <div
          id="weight-view-feedback-banner"
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 border shadow-sm transition-all animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Weight Progress & Metrics Hero Card */}
      <WeightProgressCard
        metrics={metrics}
        onLogClick={() => setIsLogModalOpen(true)}
      />

      {/* 2. Interactive Weight Trend Graph with Moving Average */}
      <WeightTrendChart
        entries={weightEntries}
        targetWeightKg={userProfile?.targetWeightKg}
      />

      {/* 3. Milestones & Achievements */}
      <WeightMilestonesCard milestones={milestones} />

      {/* 4. Complete Weight History Log */}
      <WeightHistoryList
        entries={weightEntries}
        onDeleteEntry={handleDeleteWeight}
        onLogClick={() => setIsLogModalOpen(true)}
      />

      {/* Log Weight Modal Sheet */}
      <LogWeightSheet
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSaveWeight={handleSaveWeight}
        initialWeight={latestWeight.current}
        previousWeight={latestWeight.current}
      />
    </div>
  );
};
