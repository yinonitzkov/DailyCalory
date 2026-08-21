import React from 'react';
import { Info, Shield, Zap, Lock } from 'lucide-react';

export const AboutAppSection: React.FC = () => {
  return (
    <section
      id="settings-about-section"
      aria-label="אודות האפליקציה ופרטיות"
      className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3"
      dir="rtl"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm">אודות קלוריות (Calories AI)</h3>
          <p className="text-[11px] text-slate-500">גרסה 1.0 • מודל AI מהיר מותאם לעברית</p>
        </div>
      </div>

      <div className="space-y-2 text-xs text-slate-600">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 block">פרטיות ועיבוד תמונות בזמן אמת</span>
            <span className="text-[11px] text-slate-500">
              תמונות המזון מנותחות בזמן אמת בזיכרון בלבד (In-Memory) ואינן נשמרות לעולם בדיסק או במסדי נתונים חיצוניים.
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 block">עבודה מהירה ומקומית (Offline First)</span>
            <span className="text-[11px] text-slate-500">
              כל היסטוריית הארוחות, השקילות וההגדרות מאוחסנות ישירות במכשירך לשמירה על מהירות מירבית.
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 block">חישובים מדעיים מבוססי נוסחאות מוכחות</span>
            <span className="text-[11px] text-slate-500">
              חישוב הוצאת אנרגיה לפי נוסחת Mifflin-St Jeor עם הגנת סף בטיחות קלורית (Rule D-008).
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
