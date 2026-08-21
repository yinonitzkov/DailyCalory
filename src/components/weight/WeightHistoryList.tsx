import React, { useState } from 'react';
import { WeightEntry } from '../../types';
import { formatDateHebrewRelative } from '../../utils/dateUtils';
import { Scale, Trash2, TrendingDown, TrendingUp, Minus, AlertCircle, Plus } from 'lucide-react';

interface WeightHistoryListProps {
  entries: WeightEntry[];
  onDeleteEntry: (id: string) => void;
  onLogClick: () => void;
}

export const WeightHistoryList: React.FC<WeightHistoryListProps> = ({
  entries,
  onDeleteEntry,
  onLogClick,
}) => {
  const [entryToDelete, setEntryToDelete] = useState<WeightEntry | null>(null);

  // Sort descending by date
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );

  const handleDeleteConfirm = () => {
    if (entryToDelete) {
      onDeleteEntry(entryToDelete.id);
      setEntryToDelete(null);
    }
  };

  return (
    <section
      id="weight-history-list"
      aria-label="היסטוריית שקילות מלאה"
      className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">יומן שקילות</h3>
            <p className="text-[11px] text-slate-500">
              סה״כ {entries.length} רשומות מתועדות
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogClick}
          className="text-xs text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 bg-teal-50 px-2.5 py-1.5 rounded-xl border border-teal-200/70 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>הוסף שקילה</span>
        </button>
      </div>

      {sortedEntries.length > 0 ? (
        <div className="space-y-2 pt-1">
          {sortedEntries.map((entry, index) => {
            // Find next older entry in array for calculating delta
            const olderEntry = sortedEntries[index + 1];
            const diff = olderEntry
              ? Math.round((entry.weightKg - olderEntry.weightKg) * 10) / 10
              : undefined;

            return (
              <div
                key={entry.id}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 flex items-center justify-between transition-colors group"
              >
                {/* Weight and Date */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 font-extrabold text-xs">
                    {entry.weightKg.toFixed(1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900">
                        {entry.weightKg.toFixed(1)} ק״ג
                      </span>

                      {/* Difference Badge */}
                      {diff !== undefined && (
                        <span
                          className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                            diff < 0
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/70'
                              : diff > 0
                              ? 'text-amber-700 bg-amber-50 border border-amber-200/70'
                              : 'text-slate-600 bg-slate-200/70'
                          }`}
                        >
                          {diff < 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : diff > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                          <span>{diff > 0 ? `+${diff}` : diff}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      {formatDateHebrewRelative(entry.recordedAt)}
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => setEntryToDelete(entry)}
                  aria-label={`מחק שקילה של ${entry.weightKg} ק״ג`}
                  className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all min-h-[38px] min-w-[38px] flex items-center justify-center opacity-80 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-600">אין עדיין שקילות מתועדות</p>
          <p>לחץ על ״שקילה חדשה״ כדי להתחיל לעקוב אחר המשקל שלך.</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {entryToDelete && (
        <div
          id="modal-delete-weight-confirm"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          dir="rtl"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">מחיקת רשומת שקילה</h4>
                <p className="text-xs text-slate-500">
                  האם למחוק את השקילה של {entryToDelete.weightKg.toFixed(1)} ק״ג?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
              >
                כן, מחק
              </button>
              <button
                type="button"
                onClick={() => setEntryToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
