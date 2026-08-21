import React, { useState } from 'react';
import { FoodReport, FoodComponent } from '../../types';
import {
  CheckCircle2,
  RotateCcw,
  Edit3,
  X,
  Sparkles,
  Plus,
  CornerDownLeft,
  MessageSquareDiff,
} from 'lucide-react';

interface ReportResultCardProps {
  report: FoodReport;
  onUndo: (reportId: string) => void;
  onEditComponent?: (component: FoodComponent, report: FoodReport) => void;
  onAddComponent?: (reportId: string) => void;
  onRefineReport?: (refinementText: string, report: FoodReport) => void;
  isRefining?: boolean;
  onDismiss: () => void;
}

export const ReportResultCard: React.FC<ReportResultCardProps> = ({
  report,
  onUndo,
  onEditComponent,
  onAddComponent,
  onRefineReport,
  isRefining = false,
  onDismiss,
}) => {
  const [refineText, setRefineText] = useState('');

  const handleRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineText.trim() || isRefining || !onRefineReport) return;
    onRefineReport(refineText.trim(), report);
    setRefineText('');
  };

  const handleQuickChip = (suggestion: string) => {
    if (isRefining || !onRefineReport) return;
    onRefineReport(suggestion, report);
  };

  return (
    <article
      id={`recent-report-card-${report.id}`}
      aria-label="תוצאת דיווח שנשמר"
      className="p-4 bg-teal-50/60 rounded-3xl border border-teal-200/90 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-3 duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-teal-950">
                נשמר אוטומטית לסיכום היומי
              </span>
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <span className="text-[10px] text-teal-700">
              ללא צורך באישור • לחץ לעריכה או תקן במשפט עוקב
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-teal-600 text-white shadow-xs">
            {report.calories.toLocaleString()} קק״ל
          </span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="סגור כרטיס תוצאה"
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Original user text */}
      <div className="bg-white/80 p-2.5 rounded-2xl border border-teal-100 text-xs text-slate-700 italic">
        "{report.originalText}"
      </div>

      {/* Components List Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700">
            פירוק המנה לפי רכיבים ({report.components.length}):
          </span>

          {onAddComponent && (
            <button
              type="button"
              id="btn-card-add-component"
              onClick={() => onAddComponent(report.id)}
              className="text-[11px] text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>הוסף רכיב</span>
            </button>
          )}
        </div>

        <div className="grid gap-1.5">
          {report.components.map((comp) => (
            <div
              key={comp.id}
              onClick={() => onEditComponent?.(comp, report)}
              className="p-2.5 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs cursor-pointer transition-colors group"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                    {comp.name}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium shrink-0">
                    ({comp.quantityValue} {comp.quantityUnit})
                  </span>
                  {comp.isEstimated && (
                    <span className="text-[9px] font-semibold text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded-md shrink-0">
                      הערכה
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <span className="text-teal-700 font-semibold">ח: {comp.proteinG}ג׳</span>
                  <span>•</span>
                  <span className="text-blue-700 font-semibold">פ: {comp.carbsG}ג׳</span>
                  <span>•</span>
                  <span className="text-amber-700 font-semibold">ש: {comp.fatG}ג׳</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">ס: {comp.fiberG}ג׳</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-extrabold text-slate-800">
                  {comp.calories} קק״ל
                </span>
                <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Macro Summary Row */}
      <div className="grid grid-cols-4 gap-1.5 p-2 bg-white/90 rounded-2xl border border-teal-100 text-center">
        <div>
          <span className="text-[9px] text-teal-800 font-bold block">חלבון</span>
          <span className="text-xs font-black text-slate-900">{report.proteinG}ג׳</span>
        </div>
        <div>
          <span className="text-[9px] text-blue-800 font-bold block">פחמימות</span>
          <span className="text-xs font-black text-slate-900">{report.carbsG}ג׳</span>
        </div>
        <div>
          <span className="text-[9px] text-amber-800 font-bold block">שומן</span>
          <span className="text-xs font-black text-slate-900">{report.fatG}ג׳</span>
        </div>
        <div>
          <span className="text-[9px] text-emerald-800 font-bold block">סיבים</span>
          <span className="text-xs font-black text-slate-900">{report.fiberG}ג׳</span>
        </div>
      </div>

      {/* PR-07: Conversational Refinement Inline Box */}
      {onRefineReport && (
        <div className="pt-2 border-t border-teal-200/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-950 flex items-center gap-1">
              <MessageSquareDiff className="w-3.5 h-3.5 text-teal-700" />
              <span>תיקון במשפט עוקב (AI):</span>
            </span>
          </div>

          <form onSubmit={handleRefineSubmit} className="relative flex items-center">
            <input
              type="text"
              id="input-refine-report"
              value={refineText}
              onChange={(e) => setRefineText(e.target.value)}
              disabled={isRefining}
              placeholder="למשל: 'בעצם בלי הסלט', 'תוסיף כוס קולה זירו'..."
              className="w-full bg-white border border-teal-300/80 rounded-xl py-2 pr-3 pl-10 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 disabled:opacity-60 text-right"
            />
            <button
              type="submit"
              id="btn-submit-refine"
              disabled={!refineText.trim() || isRefining}
              aria-label="שלח תיקון"
              className="absolute left-1.5 p-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-40 transition-colors active:scale-95 shadow-2xs"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Refine Suggestion Chips */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickChip('היה בלי שמן/רוטב')}
              disabled={isRefining}
              className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-teal-200 text-teal-800 hover:bg-teal-100 transition-colors"
            >
              ללא רוטב/שמן
            </button>
            <button
              type="button"
              onClick={() => handleQuickChip('תוסיף כוס קולה זירו')}
              disabled={isRefining}
              className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-teal-200 text-teal-800 hover:bg-teal-100 transition-colors"
            >
              + כוס קולה זירו
            </button>
            <button
              type="button"
              onClick={() => handleQuickChip('הכמות הייתה כפולה')}
              disabled={isRefining}
              className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-teal-200 text-teal-800 hover:bg-teal-100 transition-colors"
            >
              כמות כפולה
            </button>
          </div>
        </div>
      )}

      {/* Action Footer: Edit & Undo */}
      <div className="flex items-center justify-between pt-1 gap-2 border-t border-teal-100">
        {onEditComponent && report.components.length > 0 ? (
          <button
            type="button"
            id={`btn-edit-report-${report.id}`}
            onClick={() => onEditComponent(report.components[0], report)}
            className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 active:scale-98 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>ערוך רכיבים ידנית</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          id={`btn-undo-report-card-${report.id}`}
          onClick={() => onUndo(report.id)}
          className="py-2 px-3 bg-rose-50 hover:bg-rose-100 active:scale-98 text-rose-700 text-xs font-bold rounded-xl border border-rose-200/80 flex items-center justify-center gap-1.5 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>בטל דיווח</span>
        </button>
      </div>
    </article>
  );
};
