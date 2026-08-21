import React, { useState, useEffect } from 'react';
import { Bell, Clock, Check, Sparkles } from 'lucide-react';
import {
  NotificationSettings,
  STORAGE_KEY_NOTIFS,
  defaultNotificationSettings,
  getNotificationPermission,
  requestNotificationPermission,
  showAppNotification,
} from '../../utils/notificationEngine';

export const NotificationsSettingsSection: React.FC = () => {
  const [config, setConfig] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return defaultNotificationSettings;
  });

  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    getNotificationPermission()
  );
  const [testSent, setTestSent] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(config));
  }, [config]);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(res);
  };

  const handleSendTestNotification = async () => {
    if (permissionStatus !== 'granted') {
      await handleRequestPermission();
    }
    const success = await showAppNotification('קלוריות — תזכורת יומית 🥗', {
      body: 'זה הזמן לרשום את הארוחה האחרונה שלך ולשמור על רצף המעקב!',
      tag: 'test-notification',
      url: '/?tab=today',
    });
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  const handleUpdate = (updates: Partial<NotificationSettings>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <section
      id="settings-notifications-section"
      aria-label="הגדרות תזכורות והתראות"
      className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">תזכורות והתראות יומיות</h3>
            <p className="text-[11px] text-slate-500">
              הודעות עדינות שיעזרו לך לשמור על עקביות בדיווח ובשקילה
            </p>
          </div>
        </div>

        {savedSuccess && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-xl flex items-center gap-1 animate-in fade-in">
            <Check className="w-3.5 h-3.5" /> נשמר
          </span>
        )}
      </div>

      {/* Browser Permission Status Banner */}
      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              permissionStatus === 'granted'
                ? 'bg-emerald-500 ring-2 ring-emerald-200'
                : permissionStatus === 'denied'
                ? 'bg-rose-500 ring-2 ring-rose-200'
                : 'bg-amber-500 ring-2 ring-amber-200'
            }`}
          />
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              {permissionStatus === 'granted'
                ? 'התראות דפדפן פעילות'
                : permissionStatus === 'denied'
                ? 'התראות חסומות בדפדפן'
                : 'טרם אושרו התראות דפדפן'}
            </span>
            <span className="text-[10px] text-slate-500">
              {permissionStatus === 'granted'
                ? 'האפליקציה תשלח לך תזכורות בזמנים שהגדרת.'
                : 'לחץ על ״אשר התראות״ כדי לקבל תזכורות ישירות למכשיר.'}
            </span>
          </div>
        </div>

        {permissionStatus !== 'granted' ? (
          <button
            type="button"
            onClick={handleRequestPermission}
            className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 shrink-0"
          >
            אשר התראות
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSendTestNotification}
            className="py-1.5 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-700" />
            <span>{testSent ? 'נשלח!' : 'בדיקה'}</span>
          </button>
        )}
      </div>

      {/* Reminder Items */}
      <div className="space-y-2.5">
        {/* 1. Morning Weigh-in */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="notif-morning-toggle"
              checked={config.morningWeightEnabled}
              onChange={(e) => handleUpdate({ morningWeightEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
            />
            <div>
              <label
                htmlFor="notif-morning-toggle"
                className="text-xs font-bold text-slate-900 cursor-pointer block"
              >
                תזכורת שקילת בוקר
              </label>
              <span className="text-[10px] text-slate-500">
                מעקב שקילה בצום מיד לאחר ההשכמה
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="time"
              value={config.morningWeightTime}
              disabled={!config.morningWeightEnabled}
              onChange={(e) => handleUpdate({ morningWeightTime: e.target.value })}
              className="py-1 px-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 disabled:opacity-50"
            />
          </div>
        </div>

        {/* 2. Lunch Meal Logging */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="notif-lunch-toggle"
              checked={config.lunchEnabled}
              onChange={(e) => handleUpdate({ lunchEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
            />
            <div>
              <label
                htmlFor="notif-lunch-toggle"
                className="text-xs font-bold text-slate-900 cursor-pointer block"
              >
                תזכורת רישום ארוחת צהריים
              </label>
              <span className="text-[10px] text-slate-500">
                רישום מהיר בהקלדה, בקול או בצילום
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="time"
              value={config.lunchTime}
              disabled={!config.lunchEnabled}
              onChange={(e) => handleUpdate({ lunchTime: e.target.value })}
              className="py-1 px-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 disabled:opacity-50"
            />
          </div>
        </div>

        {/* 3. Evening Review */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="notif-evening-toggle"
              checked={config.eveningSummaryEnabled}
              onChange={(e) => handleUpdate({ eveningSummaryEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
            />
            <div>
              <label
                htmlFor="notif-evening-toggle"
                className="text-xs font-bold text-slate-900 cursor-pointer block"
              >
                סיכום יומי לקראת שינה
              </label>
              <span className="text-[10px] text-slate-500">
                מבט על עמידה ביעד הקלורי ואיזון המאקרו
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="time"
              value={config.eveningSummaryTime}
              disabled={!config.eveningSummaryEnabled}
              onChange={(e) => handleUpdate({ eveningSummaryTime: e.target.value })}
              className="py-1 px-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
