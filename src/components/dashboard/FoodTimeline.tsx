import React from 'react';
import { FoodReport, FoodComponent } from '../../types';
import { Utensils, Trash2, Clock, CheckCircle2, Edit3 } from 'lucide-react';
import { formatTimeHebrew } from '../../utils/dateUtils';

interface FoodTimelineProps {
  reports: FoodReport[];
  onDeleteReport?: (reportId: string) => void;
  onOpenReportDetails?: (report: FoodReport) => void;
  onEditComponent?: (component: FoodComponent, report: FoodReport) => void;
}

export const FoodTimeline: React.FC<FoodTimelineProps> = ({
  reports,
  onDeleteReport,
  onOpenReportDetails,
  onEditComponent,
}) => {
  return (
    <section
      id="food-reports-timeline"
      aria-label="רשימת דיווחים להיום"
      className="space-y-3"
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Utensils className="w-4 h-4 text-teal-600" />
          <span>דיווחים של היום ({reports.length})</span>
        </div>
      </div>

      {reports.length === 0 ? (
        <div
          id="empty-day-state"
          className="p-8 bg-white rounded-3xl border border-slate-200/80 text-center space-y-2 shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2">
            <Utensils className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            עדיין לא נרשמו דיווחים היום
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            שתף מה אכלת בשורת הדיווח העליונה — בטקסט חופשי, בהקלטה או בצילום, וה-AI יפרק את המנה מיידית.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reports.map((report) => (
            <div
              key={report.id}
              id={`report-item-${report.id}`}
              className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all space-y-2.5"
            >
              {/* Header: Time + Calories Badge + Delete Action */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimeHebrew(report.recordedAt)}</span>
                  {report.status === 'saved' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 mr-0.5" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/70">
                    {report.calories.toLocaleString()} קק״ל
                  </span>

                  {onDeleteReport && (
                    <button
                      type="button"
                      onClick={() => onDeleteReport(report.id)}
                      aria-label="מחק דיווח"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Original user text / meal name */}
              <p
                onClick={() => onOpenReportDetails?.(report)}
                className="text-xs font-semibold text-slate-800 leading-relaxed cursor-pointer hover:text-teal-700 transition-colors"
              >
                {report.originalText}
              </p>

              {/* Identified components breakdown tags */}
              {report.components && report.components.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100/80">
                  {report.components.map((comp) => (
                    <button
                      type="button"
                      key={comp.id}
                      onClick={() => onEditComponent?.(comp, report)}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200/70 text-slate-700 transition-colors text-right"
                    >
                      <span className="font-medium">{comp.name}</span>
                      <span className="text-slate-400 font-normal">
                        ({comp.quantityValue} {comp.quantityUnit})
                      </span>
                      {comp.isEstimated && (
                        <span className="text-[9px] text-amber-700 font-semibold bg-amber-50 px-1 rounded">
                          הערכה
                        </span>
                      )}
                      <Edit3 className="w-2.5 h-2.5 text-slate-400 opacity-60 mr-0.5" />
                    </button>
                  ))}
                </div>
              )}

              {/* Macro summary pills */}
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium pt-0.5">
                <span className="text-teal-700 font-semibold">חלבון: {report.proteinG}ג׳</span>
                <span>•</span>
                <span className="text-blue-700 font-semibold">פחמימות: {report.carbsG}ג׳</span>
                <span>•</span>
                <span className="text-amber-700 font-semibold">שומן: {report.fatG}ג׳</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">סיבים: {report.fiberG}ג׳</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
