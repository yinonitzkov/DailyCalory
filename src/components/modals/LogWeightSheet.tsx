import React, { useState, useEffect } from 'react';
import { Scale, X, Check, AlertTriangle, Calendar, Clock, ChevronDown } from 'lucide-react';
import { getLocalDateString } from '../../utils/dateUtils';

interface LogWeightSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWeight: (weightKg: number, recordedAt?: string) => void;
  initialWeight?: number;
  previousWeight?: number;
}

export const LogWeightSheet: React.FC<LogWeightSheetProps> = ({
  isOpen,
  onClose,
  onSaveWeight,
  initialWeight = 70.0,
  previousWeight,
}) => {
  const [weight, setWeight] = useState<number>(initialWeight);
  const [date, setDate] = useState<string>(() => getLocalDateString(new Date()));
  const [time, setTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [showPlausibilityAlert, setShowPlausibilityAlert] = useState(false);
  const [hasConfirmedPlausibility, setHasConfirmedPlausibility] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setWeight(initialWeight || 70.0);
      setDate(getLocalDateString(new Date()));
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setShowPlausibilityAlert(false);
      setHasConfirmedPlausibility(false);
    }
  }, [isOpen, initialWeight]);

  if (!isOpen) return null;

  const diffFromPrevious = previousWeight !== undefined ? Math.round((weight - previousWeight) * 10) / 10 : 0;
  const isSuspiciousJump = previousWeight !== undefined && Math.abs(diffFromPrevious) >= 3.0;

  const handleAdjust = (delta: number) => {
    setWeight((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      return Math.max(30, Math.min(250, next));
    });
    setHasConfirmedPlausibility(false);
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      setWeight(Math.round(val * 10) / 10);
      setHasConfirmedPlausibility(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (weight < 30 || weight > 250) {
      return;
    }

    // If there is a > 3kg jump and the user hasn't confirmed the plausibility yet, prompt them
    if (isSuspiciousJump && !hasConfirmedPlausibility) {
      setShowPlausibilityAlert(true);
      return;
    }

    // Construct ISO string with selected date and time
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const [year, month, day] = date.split('-').map(Number);
      const recordedDate = new Date(year, month - 1, day, hours || 0, minutes || 0);
      onSaveWeight(weight, recordedDate.toISOString());
    } catch {
      onSaveWeight(weight, new Date().toISOString());
    }

    onClose();
  };

  return (
    <div
      id="modal-weight-sheet-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-weight-sheet-card"
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-200 max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-700">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">הזנת שקילה חדשה</h2>
              <p className="text-xs text-slate-500">עקוב אחר מגמת המשקל שלך לאורך זמן</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור חלון"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Big Weight Number & Adjustment Controls */}
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 text-center space-y-3">
            <span className="text-xs text-slate-500 font-medium block">
              משקל גוף נמדד
            </span>

            <div className="flex items-center justify-center gap-2">
              <input
                id="modal-input-weight"
                type="number"
                step="0.1"
                min="30"
                max="250"
                required
                autoFocus
                value={weight}
                onChange={handleWeightChange}
                className="w-36 text-center text-4xl font-black text-slate-900 bg-transparent focus:outline-none focus:ring-0 tracking-tight"
              />
              <span className="text-lg font-bold text-slate-500">ק״ג</span>
            </div>

            {/* Difference indicator from previous entry */}
            {previousWeight !== undefined && (
              <div className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5">
                <span>משקל קודם: {previousWeight.toFixed(1)} ק״ג</span>
                <span className="text-slate-300">•</span>
                <span
                  className={
                    diffFromPrevious < 0
                      ? 'text-emerald-600'
                      : diffFromPrevious > 0
                      ? 'text-amber-600'
                      : 'text-slate-500'
                  }
                >
                  {diffFromPrevious > 0 ? `+${diffFromPrevious}` : diffFromPrevious} ק״ג
                </span>
              </div>
            )}

            {/* Quick Increment / Decrement Chips */}
            <div className="flex items-center justify-center gap-1.5 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => handleAdjust(-1.0)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 rounded-xl text-xs font-bold text-slate-700 transition-all min-h-[36px]"
              >
                -1.0
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(-0.5)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 rounded-xl text-xs font-bold text-slate-700 transition-all min-h-[36px]"
              >
                -0.5
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(-0.1)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 rounded-xl text-xs font-bold text-slate-700 transition-all min-h-[36px]"
              >
                -0.1
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(0.1)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 rounded-xl text-xs font-bold text-slate-700 transition-all min-h-[36px]"
              >
                +0.1
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(0.5)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 rounded-xl text-xs font-bold text-slate-700 transition-all min-h-[36px]"
              >
                +0.5
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(1.0)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 active:scale-95 rounded-xl text-xs font-bold text-slate-700 transition-all min-h-[36px]"
              >
                +1.0
              </button>
            </div>
          </div>

          {/* Plausibility Warning / Confirmation Alert */}
          {(showPlausibilityAlert || (isSuspiciousJump && !hasConfirmedPlausibility)) && (
            <div
              id="weight-plausibility-warning"
              className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2 animate-in fade-in"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">בדיקת סבירות שקילה</span>
                  <p className="text-amber-800 leading-relaxed">
                    המשקל שהזנת ({weight.toFixed(1)} ק״ג) שונה ב-
                    {Math.abs(diffFromPrevious).toFixed(1)} ק״ג מהשקילה הקודמת (
                    {previousWeight?.toFixed(1)} ק״ג). האם מדובר בשינוי אמיתי או בטעות הקלדה?
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1 font-semibold text-amber-950">
                <input
                  type="checkbox"
                  checked={hasConfirmedPlausibility}
                  onChange={(e) => setHasConfirmedPlausibility(e.target.checked)}
                  className="rounded border-amber-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span>כן, אני מאשר שזהו המשקל הנכון</span>
              </label>
            </div>
          )}

          {/* Date & Time Picker Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="modal-input-date"
                className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>תאריך</span>
              </label>
              <input
                id="modal-input-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-right min-h-[44px]"
              />
            </div>
            <div>
              <label
                htmlFor="modal-input-time"
                className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1"
              >
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>שעה</span>
              </label>
              <input
                id="modal-input-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-right min-h-[44px]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="submit"
              id="btn-save-weight-modal"
              className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-md shadow-teal-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm min-h-[48px]"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>שמור שקילה</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all text-sm min-h-[48px]"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
