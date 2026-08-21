import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY_PROMPT_DISMISSED = 'calories_pwa_install_dismissed_v1';

export const InstallPromptBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check dismissed cooldown (e.g. 7 days)
    const dismissedTime = localStorage.getItem(STORAGE_KEY_PROMPT_DISMISSED);
    if (dismissedTime) {
      const daysSinceDismiss =
        (Date.now() - Number(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        return;
      }
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      setIsDismissed(false);
    }

    // Listen for beforeinstallprompt on Chromium / Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsDismissed(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY_PROMPT_DISMISSED, Date.now().toString());
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom Card Banner */}
      <div
        id="pwa-install-prompt-banner"
        className="fixed bottom-20 inset-x-3 sm:max-w-md sm:mx-auto z-40 animate-in fade-in slide-in-from-bottom-3"
        dir="rtl"
      >
        <div className="p-3.5 bg-slate-900/95 text-white rounded-3xl shadow-2xl backdrop-blur-md border border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-teal-600/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                התקן את ״קלוריות״ למסך הבית
              </h4>
              <p className="text-[10px] text-slate-300">
                לגישה מהירה בלחיצה אחת ופתיחה במסך מלא
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="btn-pwa-install"
              onClick={handleInstallClick}
              className="py-1.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-sm active:scale-95 flex items-center gap-1 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>התקן</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="סגור הצעה להתקנה"
              className="p-1.5 text-slate-400 hover:text-white rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div
          id="modal-ios-install-guide"
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          dir="rtl"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in slide-in-from-bottom-4 text-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  התקנה באייפון / אייפד (iOS)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <span>
                  לחץ על כפתור <strong>השיתוף (Share)</strong> בתחתית דפדפן Safari{' '}
                  <Share className="w-3.5 h-3.5 inline text-teal-600 mx-0.5" />
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <span>
                  גלול מטה ובחר באפשרות <strong>״הוסף למסך הבית״ (Add to Home Screen)</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline text-teal-600 mx-0.5" />
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <span>
                  לחץ על <strong>״הוסף״ (Add)</strong> בפינה העליונה. האפליקציה תופיע במסך הבית שלך!
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowIOSGuide(false);
                handleDismiss();
              }}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4" />
              <span>הבנתי, תודה!</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
