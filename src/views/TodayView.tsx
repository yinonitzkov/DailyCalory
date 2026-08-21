import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QuickComposer } from '../components/dashboard/QuickComposer';
import { DateNavigationBar } from '../components/dashboard/DateNavigationBar';
import { WaterTrackerCard } from '../components/dashboard/WaterTrackerCard';
import { WeeklyAiInsightsCard } from '../components/dashboard/WeeklyAiInsightsCard';
import { WeightSummaryBar } from '../components/dashboard/WeightSummaryBar';
import { DailyMacroCard } from '../components/dashboard/DailyMacroCard';
import { WeeklyTrendGraph } from '../components/dashboard/WeeklyTrendGraph';
import { FoodTimeline } from '../components/dashboard/FoodTimeline';
import { LogWeightSheet } from '../components/modals/LogWeightSheet';
import { EditComponentSheet } from '../components/modals/EditComponentSheet';
import { AddComponentSheet } from '../components/modals/AddComponentSheet';
import { VoiceRecordingSheet } from '../components/modals/VoiceRecordingSheet';
import { CameraCaptureModal } from '../components/modals/CameraCaptureModal';
import { ReportResultCard } from '../components/dashboard/ReportResultCard';
import { UndoToast } from '../components/common/UndoToast';
import {
  analyzeFoodTextApi,
  analyzeFoodAudioApi,
  analyzeFoodImageApi,
  refineFoodReportApi,
} from '../services/reportApi';
import { recalculateReportTotals } from '../utils/nutritionCalculations';
import { FoodReport, FoodComponent } from '../types';
import { Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TodayViewProps {
  onPhotoClick?: () => void;
  isQuickComposerHighlighted?: boolean;
}

export const TodayView: React.FC<TodayViewProps> = ({
  onPhotoClick,
  isQuickComposerHighlighted = false,
}) => {
  const {
    todaySummary,
    selectedDateSummary,
    selectedDateReports,
    weeklyHistory,
    latestWeight,
    foodReports,
    weightEntries,
    foodMemories,
    selectedDate,
    addFoodReport,
    updateFoodReport,
    deleteFoodReport,
    addWeightEntry,
    userProfile,
  } = useApp();

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'clarification' | 'error';
    text: string;
  } | null>(null);

  // PR-05: Recently saved report for immediate result card & undo
  const [recentlySavedReport, setRecentlySavedReport] = useState<FoodReport | null>(null);
  const [undoToast, setUndoToast] = useState<{
    isOpen: boolean;
    reportId: string;
    message: string;
    calories: number;
    originalText: string;
  } | null>(null);

  // PR-06: Active component for editing / adding
  const [editingTarget, setEditingTarget] = useState<{
    component: FoodComponent;
    report: FoodReport;
  } | null>(null);

  const [addingToReportId, setAddingToReportId] = useState<string | null>(null);

  // Restored text for input field on Undo
  const [restoredText, setRestoredText] = useState<string>('');

  // Checks whether a submitted text looks like a conversational refinement for the recent report
  const isRefinementPrompt = (text: string): boolean => {
    if (!recentlySavedReport) return false;
    const lower = text.trim().toLowerCase();
    const refinementPrefixes = [
      'בעצם',
      'בלי',
      'ללא',
      'להוריד',
      'תוסיף',
      'ועוד',
      'גם',
      'תקן',
      'זה היה',
      'היה',
      'לא ',
      'רק ',
      'במקום',
      'כמות',
    ];
    return refinementPrefixes.some((p) => lower.startsWith(p) || lower.includes(p));
  };

  const handleTextSubmit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isAnalyzing || isRefining) return;

    // PR-07: Conversational refinement detection when a recent report is active
    if (recentlySavedReport && isRefinementPrompt(trimmed)) {
      await handleRefineReport(trimmed, recentlySavedReport);
      return;
    }

    setIsAnalyzing(true);
    setFeedbackMessage(null);

    try {
      const result = await analyzeFoodTextApi(trimmed, userProfile?.userId, foodMemories);

      if (result.status === 'error') {
        setFeedbackMessage({
          type: 'error',
          text: result.error || 'שגיאה בעיבוד הדיווח. נסה שוב.',
        });
        return;
      }

      if (result.status === 'needs_clarification') {
        setFeedbackMessage({
          type: 'clarification',
          text: result.question,
        });
        return;
      }

      if (result.status === 'success') {
        const savedReport = result.data;

        // Zero-friction Auto-save: added immediately to the daily log and summary!
        addFoodReport(savedReport);
        setRecentlySavedReport(savedReport);

        // Trigger Undo Toast for 5 seconds
        setUndoToast({
          isOpen: true,
          reportId: savedReport.id,
          message: 'הדיווח נשמר אוטומטית',
          calories: savedReport.calories,
          originalText: savedReport.originalText,
        });
      }
    } catch {
      setFeedbackMessage({
        type: 'error',
        text: 'אירעה שגיאה בעיבוד. נסה שוב.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // PR-08: Handle Direct Audio Voice Log
  const handleAudioSubmit = async (audioBase64: string, mimeType: string) => {
    if (!audioBase64 || isAnalyzing) return;

    setIsAnalyzing(true);
    setFeedbackMessage(null);

    try {
      const result = await analyzeFoodAudioApi(
        audioBase64,
        mimeType,
        userProfile?.userId,
        foodMemories
      );

      if (result.status === 'error') {
        setFeedbackMessage({
          type: 'error',
          text: result.error || 'שגיאה בפענוח ההקלטה הקולית. נסה שוב.',
        });
        return;
      }

      if (result.status === 'needs_clarification') {
        setFeedbackMessage({
          type: 'clarification',
          text: result.question,
        });
        return;
      }

      if (result.status === 'success') {
        const savedReport = result.data;

        addFoodReport(savedReport);
        setRecentlySavedReport(savedReport);

        setUndoToast({
          isOpen: true,
          reportId: savedReport.id,
          message: 'ההקלטה פוענחה ונשמרה',
          calories: savedReport.calories,
          originalText: savedReport.originalText,
        });

        setFeedbackMessage({
          type: 'success',
          text: `פוענח: "${savedReport.originalText}" (${savedReport.calories} קק״ל)`,
        });

        setTimeout(() => setFeedbackMessage(null), 5000);
      }
    } catch {
      setFeedbackMessage({
        type: 'error',
        text: 'שגיאה בתקשורת עם שרת ה-AI בפענוח הקלטה.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // PR-09: Handle Direct Camera / Photo Meal Log (Zero-Storage Vision AI)
  const handleImageSubmit = async (imageBase64: string, mimeType: string) => {
    if (!imageBase64 || isAnalyzing) return;

    setIsAnalyzing(true);
    setFeedbackMessage(null);

    try {
      const result = await analyzeFoodImageApi(
        imageBase64,
        mimeType,
        userProfile?.userId,
        foodMemories
      );

      if (result.status === 'error') {
        setFeedbackMessage({
          type: 'error',
          text: result.error || 'שגיאה בפענוח תמונת הארוחה. נסה שוב.',
        });
        return;
      }

      if (result.status === 'needs_clarification') {
        setFeedbackMessage({
          type: 'clarification',
          text: result.question,
        });
        return;
      }

      if (result.status === 'success') {
        const savedReport = result.data;

        addFoodReport(savedReport);
        setRecentlySavedReport(savedReport);

        setUndoToast({
          isOpen: true,
          reportId: savedReport.id,
          message: 'התמונה פוענחה ונשמרה',
          calories: savedReport.calories,
          originalText: savedReport.originalText,
        });

        setFeedbackMessage({
          type: 'success',
          text: `פוענחה תמונה: "${savedReport.originalText}" (${savedReport.calories} קק״ל)`,
        });

        setTimeout(() => setFeedbackMessage(null), 5000);
      }
    } catch {
      setFeedbackMessage({
        type: 'error',
        text: 'שגיאה בתקשורת עם שרת ה-Vision AI.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // PR-07: Conversational refinement handler
  const handleRefineReport = async (refinementText: string, targetReport: FoodReport) => {
    if (!refinementText.trim() || isRefining) return;

    setIsRefining(true);
    setFeedbackMessage(null);

    try {
      const result = await refineFoodReportApi(
        refinementText,
        targetReport,
        userProfile?.userId,
        foodMemories
      );

      if (result.status === 'error') {
        setFeedbackMessage({
          type: 'error',
          text: result.error || 'שגיאה בתיקון המנה. נסה שוב.',
        });
        return;
      }

      if (result.status === 'success') {
        const updatedReport = result.data;
        updateFoodReport(updatedReport);
        setRecentlySavedReport(updatedReport);

        setFeedbackMessage({
          type: 'success',
          text: `עודכן בהצלחה: ${result.changeSummary} (${updatedReport.calories} קק״ל סך הכל)`,
        });

        // Update Undo Toast with refined state
        setUndoToast({
          isOpen: true,
          reportId: updatedReport.id,
          message: 'המנה עודכנה',
          calories: updatedReport.calories,
          originalText: updatedReport.originalText,
        });
      }
    } catch {
      setFeedbackMessage({
        type: 'error',
        text: 'שגיאה בביצוע התיקון. נסה שוב.',
      });
    } finally {
      setIsRefining(false);
      setTimeout(() => {
        setFeedbackMessage(null);
      }, 5000);
    }
  };

  const handleUndo = (reportId?: string) => {
    const targetId = reportId || undoToast?.reportId;
    if (!targetId) return;

    const textToRestore =
      recentlySavedReport?.originalText || undoToast?.originalText || '';

    deleteFoodReport(targetId);
    setRecentlySavedReport(null);
    setUndoToast(null);

    if (textToRestore) {
      setRestoredText(textToRestore);
      setTimeout(() => {
        const input = document.getElementById('food-input-field');
        if (input) input.focus();
      }, 50);
    }

    setFeedbackMessage({
      type: 'success',
      text: 'הדיווח בוטל והסיכום היומי עודכן בהתאם.',
    });

    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // PR-06: Save edited component and recalculate report totals
  const handleSaveEditedComponent = (updatedComponent: FoodComponent) => {
    if (!editingTarget) return;

    const { report } = editingTarget;
    const updatedComponents = report.components.map((c) =>
      c.id === updatedComponent.id ? updatedComponent : c
    );

    const recalculated = recalculateReportTotals(report, updatedComponents);
    updateFoodReport(recalculated);

    if (recentlySavedReport?.id === report.id) {
      setRecentlySavedReport(recalculated);
    }

    setEditingTarget(null);
    setFeedbackMessage({
      type: 'success',
      text: `רכיב "${updatedComponent.name}" עודכן. סך המנה כעת: ${recalculated.calories} קק״ל.`,
    });

    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // PR-06: Delete component and recalculate report totals
  const handleDeleteComponent = (componentId: string) => {
    if (!editingTarget) return;

    const { report } = editingTarget;
    const remainingComponents = report.components.filter((c) => c.id !== componentId);

    if (remainingComponents.length === 0) {
      deleteFoodReport(report.id);
      if (recentlySavedReport?.id === report.id) {
        setRecentlySavedReport(null);
      }
      setFeedbackMessage({
        type: 'success',
        text: 'כל הרכיבים הוסרו — הדיווח נמחק מהיומן.',
      });
    } else {
      const recalculated = recalculateReportTotals(report, remainingComponents);
      updateFoodReport(recalculated);
      if (recentlySavedReport?.id === report.id) {
        setRecentlySavedReport(recalculated);
      }
      setFeedbackMessage({
        type: 'success',
        text: `הרכיב נמחק. סך המנה עודכן ל-${recalculated.calories} קק״ל.`,
      });
    }

    setEditingTarget(null);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // PR-06: Add component to report and recalculate
  const handleAddComponentToReport = (newComponent: FoodComponent) => {
    if (!addingToReportId) return;

    const targetReport = foodReports.find((r) => r.id === addingToReportId);
    if (!targetReport) return;

    const updatedComponents = [...targetReport.components, newComponent];
    const recalculated = recalculateReportTotals(targetReport, updatedComponents);
    updateFoodReport(recalculated);

    if (recentlySavedReport?.id === targetReport.id) {
      setRecentlySavedReport(recalculated);
    }

    setAddingToReportId(null);
    setFeedbackMessage({
      type: 'success',
      text: `נוסף רכיב "${newComponent.name}". סך המנה עודכן ל-${recalculated.calories} קק״ל.`,
    });

    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleSaveWeight = (weightKg: number, recordedAt?: string) => {
    addWeightEntry(weightKg, recordedAt);
    const diff = latestWeight.current ? Math.round((weightKg - latestWeight.current) * 10) / 10 : 0;
    const diffText = diff !== 0 ? ` (${diff > 0 ? `+${diff}` : diff} ק״ג)` : '';
    setFeedbackMessage({
      type: 'success',
      text: `שקילה נשמרה בהצלחה: ${weightKg.toFixed(1)} ק״ג${diffText}`,
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Date Navigation Bar (Day hopping) */}
      <DateNavigationBar />

      {/* 1. Quick Composer (First & immediate) */}
      <QuickComposer
        onSubmitText={handleTextSubmit}
        onVoiceClick={() => setIsVoiceModalOpen(true)}
        onPhotoClick={() => {
          if (onPhotoClick) {
            onPhotoClick();
          } else {
            setIsCameraModalOpen(true);
          }
        }}
        isProcessing={isAnalyzing || isRefining}
        isHighlighted={isQuickComposerHighlighted}
        externalText={restoredText}
        onExternalTextConsumed={() => setRestoredText('')}
      />

      {/* AI Processing / Refining Status */}
      {(isAnalyzing || isRefining) && (
        <div
          id="ai-processing-status"
          className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-3xl flex items-center gap-2.5 text-xs text-emerald-300 animate-pulse shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
          <span className="font-bold">
            {isRefining
              ? 'ה-AI מעדכן את המנה לפי משפט התיקון שלך...'
              : 'ה-AI מפרק את המנה, מזהה העדפות אישיות, ומעדכן את הסיכום היומי...'}
          </span>
        </div>
      )}

      {/* Feedback Banner (Clarification / Error / Update notice) */}
      {feedbackMessage && !isAnalyzing && !isRefining && (
        <div
          id="ai-feedback-banner"
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 border shadow-sm transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-200 border-emerald-800/60'
              : feedbackMessage.type === 'clarification'
              ? 'bg-amber-950/60 text-amber-200 border-amber-800/60'
              : 'bg-rose-950/60 text-rose-200 border-rose-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="font-medium leading-relaxed">{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-200 text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* PR-05 & PR-07: Recently Saved Report Result Card with Conversational Refinement */}
      {recentlySavedReport && (
        <ReportResultCard
          report={recentlySavedReport}
          onUndo={handleUndo}
          onEditComponent={(comp, rep) => setEditingTarget({ component: comp, report: rep })}
          onAddComponent={(reportId) => setAddingToReportId(reportId)}
          onRefineReport={handleRefineReport}
          isRefining={isRefining}
          onDismiss={() => setRecentlySavedReport(null)}
        />
      )}

      {/* Water Tracker Card */}
      <WaterTrackerCard />

      {/* 2. Weight Summary Bar (Compact with sparkline & target) */}
      <WeightSummaryBar
        currentWeight={latestWeight.current}
        diff={latestWeight.diff}
        recordedAt={latestWeight.date}
        targetWeightKg={userProfile?.targetWeightKg}
        recentWeights={weightEntries}
        onLogWeightClick={() => setIsWeightModalOpen(true)}
      />

      {/* 3. Daily Macro & Calorie Card (For selected date) */}
      <DailyMacroCard summary={selectedDateSummary || todaySummary} />

      {/* 4. Weekly AI Insights & Recommendations Card */}
      <WeeklyAiInsightsCard />

      {/* 5. 7-Day Trend Graph */}
      <WeeklyTrendGraph
        history={weeklyHistory}
        targetCalories={todaySummary.targetCalories}
      />

      {/* 6. Selected Date's Food Reports Timeline */}
      <FoodTimeline
        reports={selectedDateReports}
        onDeleteReport={deleteFoodReport}
        onOpenReportDetails={(report) => setRecentlySavedReport(report)}
        onEditComponent={(comp, rep) => setEditingTarget({ component: comp, report: rep })}
      />

      {/* Log Weight Modal Sheet with Plausibility Protection */}
      <LogWeightSheet
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        onSaveWeight={handleSaveWeight}
        initialWeight={latestWeight.current}
        previousWeight={latestWeight.current}
      />

      {/* PR-08: Voice Recording Modal Sheet */}
      <VoiceRecordingSheet
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSubmitAudio={handleAudioSubmit}
        onSubmitTextFallback={handleTextSubmit}
        isProcessing={isAnalyzing}
      />

      {/* PR-09: Camera & Photo Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onSubmitImage={handleImageSubmit}
        isProcessing={isAnalyzing}
      />

      {/* PR-06: Edit Component Sheet */}
      <EditComponentSheet
        isOpen={!!editingTarget}
        component={editingTarget?.component || null}
        onClose={() => setEditingTarget(null)}
        onSave={handleSaveEditedComponent}
        onDelete={handleDeleteComponent}
      />

      {/* PR-06: Add Component Sheet */}
      <AddComponentSheet
        isOpen={!!addingToReportId}
        reportId={addingToReportId || ''}
        onClose={() => setAddingToReportId(null)}
        onAdd={handleAddComponentToReport}
      />

      {/* PR-05: 5-Second Undo Toast */}
      {undoToast && (
        <UndoToast
          isOpen={undoToast.isOpen}
          message={undoToast.message}
          reportCalories={undoToast.calories}
          durationMs={5000}
          onUndo={() => handleUndo(undoToast.reportId)}
          onDismiss={() => setUndoToast(null)}
        />
      )}
    </div>
  );
};

