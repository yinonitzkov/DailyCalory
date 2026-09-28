import { lazy, Suspense, useState } from 'react';
import { NavTab } from './types';
import { AppLayout } from './components/layout/AppLayout';
import { AppProvider, useApp } from './context/AppContext';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { TodayView } from './views/TodayView';
import { WeightView } from './views/WeightView';
import { SettingsView } from './views/SettingsView';
const WorkoutsView = lazy(() => import('./views/workouts/WorkoutsView').then((module) => ({ default: module.WorkoutsView })));
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function MainAppContent() {
  const { userProfile, isOnboardingCompleted } = useApp();
  const [activeTab, setActiveTab] = useState<NavTab>('today');
  const [quickComposerHighlighted, setQuickComposerHighlighted] = useState(false);

  // Initialize background notification scheduler
  useNotificationScheduler();

  // If user hasn't completed onboarding, show the wizard
  if (!isOnboardingCompleted) {
    return <OnboardingWizard />;
  }

  const handleQuickReport = () => {
    setActiveTab('today');
    setQuickComposerHighlighted(true);
    // Focus the food input element if on screen
    setTimeout(() => {
      const input = document.getElementById('food-input-field');
      if (input) {
        input.focus();
      }
      setQuickComposerHighlighted(false);
    }, 600);
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onQuickReportClick={handleQuickReport}
    >
      {/* 1. Today View */}
      {activeTab === 'today' && (
        <div id="view-today">
          <TodayView
            isQuickComposerHighlighted={quickComposerHighlighted}
          />
        </div>
      )}

      {/* 2. Weight View */}
      {activeTab === 'weight' && (
        <div id="view-weight">
          <WeightView />
        </div>
      )}

      {activeTab === 'workouts' && (
        <div id="view-workouts">
          <Suspense fallback={<div className="rounded-2xl bg-white p-6 text-center text-slate-500">טוען אימונים…</div>}>
            <WorkoutsView />
          </Suspense>
        </div>
      )}

      {/* 3. Settings View */}
      {activeTab === 'settings' && (
        <div id="view-settings">
          <SettingsView />
        </div>
      )}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
