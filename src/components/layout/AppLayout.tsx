import React from 'react';
import { NavTab } from '../../types';
import { BottomNav } from './BottomNav';
import { Sparkles, WifiOff } from 'lucide-react';
import { OfflineIndicator } from '../pwa/OfflineIndicator';
import { InstallPromptBanner } from '../pwa/InstallPromptBanner';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onQuickReportClick?: () => void;
  isOffline?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  onQuickReportClick,
  isOffline = false,
}) => {
  // Format current date in Hebrew
  const todayFormatted = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Network offline/online top floating status */}
      <OfflineIndicator />

      {/* Central container - Mobile first, max 640px */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col shadow-sm border-x border-slate-200/60 relative">
        {/* Top Header */}
        <header
          id="app-main-header"
          className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 pt-safe flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                קלוריות
              </h1>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5 capitalize">
                {todayFormatted}
              </p>
            </div>
          </div>

          {/* Offline indicator if active */}
          {isOffline && (
            <div
              id="offline-badge-header"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span>מצב לא מקוון</span>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main
          id="app-main-content"
          className="flex-1 px-4 py-4 pb-28 overflow-y-auto"
        >
          {children}
        </main>

        {/* PWA Home Screen Install Banner */}
        <InstallPromptBanner />

        {/* Fixed Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={onTabChange}
          onQuickReportClick={onQuickReportClick}
        />
      </div>
    </div>
  );
};

