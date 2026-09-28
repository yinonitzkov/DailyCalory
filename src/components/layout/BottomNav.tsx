import React from 'react';
import { PlusCircle, Flame, Scale, Settings, Dumbbell } from 'lucide-react';
import { NavTab } from '../../types';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onQuickReportClick?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onQuickReportClick,
}) => {
  const handleTabClick = (tab: NavTab) => {
    if (tab === 'report') {
      if (onQuickReportClick) {
        onQuickReportClick();
      } else {
        onTabChange('today');
      }
    } else {
      onTabChange(tab);
    }
  };

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="ניווט ראשי"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg shadow-slate-900/5 pb-safe"
    >
      <div className="max-w-md mx-auto px-3 flex items-center justify-around h-16">
        {/* דיווח מהיר (בולט) */}
        <button
          id="nav-tab-report"
          type="button"
          onClick={() => handleTabClick('report')}
          className="flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 text-teal-600 active:scale-95 transition-all group"
          aria-label="דיווח אוכל מהיר"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-600 text-white shadow-md shadow-teal-600/30 group-hover:bg-teal-700 transition-colors">
            <PlusCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-medium tracking-tight mt-0.5 text-teal-700">
            דיווח
          </span>
        </button>

        {/* היום / דשבורד */}
        <button
          id="nav-tab-today"
          type="button"
          onClick={() => handleTabClick('today')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all ${
            activeTab === 'today'
              ? 'text-teal-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="דשבורד היום"
          aria-current={activeTab === 'today' ? 'page' : undefined}
        >
          <Flame className={`w-5 h-5 ${activeTab === 'today' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[12px] tracking-tight mt-1">
            היום
          </span>
        </button>

        {/* משקל */}
        <button
          id="nav-tab-weight"
          type="button"
          onClick={() => handleTabClick('weight')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all ${
            activeTab === 'weight'
              ? 'text-teal-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="מעקב משקל"
          aria-current={activeTab === 'weight' ? 'page' : undefined}
        >
          <Scale className={`w-5 h-5 ${activeTab === 'weight' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[12px] tracking-tight mt-1">
            משקל
          </span>
        </button>

        <button
          id="nav-tab-workouts"
          type="button"
          onClick={() => handleTabClick('workouts')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all ${activeTab === 'workouts' ? 'text-teal-600 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
          aria-label="תוכניות אימון וספריית תרגילים"
          aria-current={activeTab === 'workouts' ? 'page' : undefined}
        >
          <Dumbbell className={`w-5 h-5 ${activeTab === 'workouts' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[12px] tracking-tight mt-1">אימונים</span>
        </button>

        {/* הגדרות */}
        <button
          id="nav-tab-settings"
          type="button"
          onClick={() => handleTabClick('settings')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all ${
            activeTab === 'settings'
              ? 'text-teal-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="הגדרות פרופיל ויעדים"
          aria-current={activeTab === 'settings' ? 'page' : undefined}
        >
          <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[12px] tracking-tight mt-1">
            הגדרות
          </span>
        </button>
      </div>
    </nav>
  );
};
