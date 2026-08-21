import React, { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw, X } from 'lucide-react';

interface UndoToastProps {
  isOpen: boolean;
  message: string;
  reportCalories?: number;
  durationMs?: number;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  isOpen,
  message,
  reportCalories,
  durationMs = 5000,
  onUndo,
  onDismiss,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isOpen) {
      setProgress(100);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, durationMs, onDismiss]);

  if (!isOpen) return null;

  return (
    <aside
      id="undo-toast-notification"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-20 inset-x-4 max-w-md mx-auto z-40 bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-700/80 space-y-2 animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate leading-tight text-slate-100">
              {message}
            </p>
            {reportCalories !== undefined && (
              <span className="text-[11px] text-slate-400 font-medium">
                נוספו {reportCalories.toLocaleString()} קק״ל לסיכום היומי
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            id="btn-undo-report-toast"
            onClick={onUndo}
            className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>ביטול</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="סגור הודעה"
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Countdown progress line */}
      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-400 rounded-full transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </aside>
  );
};
