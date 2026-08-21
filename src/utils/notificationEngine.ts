/**
 * Notification Engine & Local Scheduling
 */

export interface NotificationSettings {
  morningWeightEnabled: boolean;
  morningWeightTime: string; // "HH:MM"
  lunchEnabled: boolean;
  lunchTime: string; // "HH:MM"
  eveningSummaryEnabled: boolean;
  eveningSummaryTime: string; // "HH:MM"
}

export const STORAGE_KEY_NOTIFS = 'calories_notification_settings_v1';
const STORAGE_KEY_LAST_SENT = 'calories_last_notifications_sent_v1';

export const defaultNotificationSettings: NotificationSettings = {
  morningWeightEnabled: true,
  morningWeightTime: '07:30',
  lunchEnabled: true,
  lunchTime: '13:30',
  eveningSummaryEnabled: true,
  eveningSummaryTime: '21:00',
};

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Dispatches a native or service-worker notification
 */
export async function showAppNotification(
  title: string,
  options: {
    body: string;
    tag?: string;
    url?: string;
    icon?: string;
  }
) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions = {
    body: options.body,
    icon: options.icon || '/icon.svg',
    badge: '/icon.svg',
    tag: options.tag || 'calories-reminder',
    data: { url: options.url || '/' },
    dir: 'rtl',
    lang: 'he',
  };

  try {
    // Try service worker notification first (better on mobile PWA)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, notificationOptions);
        return true;
      }
    }

    // Fallback to standard Notification API
    new Notification(title, notificationOptions);
    return true;
  } catch (err) {
    console.warn('Could not display notification:', err);
    return false;
  }
}

interface LastSentTracker {
  morningDate?: string;
  lunchDate?: string;
  eveningDate?: string;
}

function getLastSentTracker(): LastSentTracker {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_SENT);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

function setLastSentTracker(tracker: LastSentTracker) {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_SENT, JSON.stringify(tracker));
  } catch {
    // ignore
  }
}

/**
 * Checks current time against notification schedule and triggers alarms
 */
export function checkAndTriggerScheduledNotifications(
  settings: NotificationSettings = defaultNotificationSettings
) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  const lastSent = getLastSentTracker();

  // 1. Morning Weigh-in Reminder
  if (
    settings.morningWeightEnabled &&
    lastSent.morningDate !== todayDateStr &&
    currentTimeStr >= settings.morningWeightTime &&
    currentTimeStr <= '11:00'
  ) {
    showAppNotification('בוקר טוב! זה הזמן לשקילת בוקר ⚖️', {
      body: 'שקילה בצום מיד לאחר ההשכמה מספקת את הנתון המדויק ביותר למעקב ההתקדמות.',
      tag: 'morning-weighin',
      url: '/?tab=weight&action=log',
    });
    lastSent.morningDate = todayDateStr;
    setLastSentTracker(lastSent);
  }

  // 2. Lunch Meal Logging Reminder
  if (
    settings.lunchEnabled &&
    lastSent.lunchDate !== todayDateStr &&
    currentTimeStr >= settings.lunchTime &&
    currentTimeStr <= '16:00'
  ) {
    showAppNotification('היי! מה אכלת לצהריים? 🥗', {
      body: 'רשום בקלות את הארוחה בהקלדה, בדיבור קולי או בצילום מהיר של הצלחת.',
      tag: 'lunch-report',
      url: '/?tab=today&action=report',
    });
    lastSent.lunchDate = todayDateStr;
    setLastSentTracker(lastSent);
  }

  // 3. Evening Review Reminder
  if (
    settings.eveningSummaryEnabled &&
    lastSent.eveningDate !== todayDateStr &&
    currentTimeStr >= settings.eveningSummaryTime &&
    currentTimeStr <= '23:59'
  ) {
    showAppNotification('סיכום יומי: איך עבר היום? 📊', {
      body: 'מבט מהיר על עמידה ביעד הקלורי ובאיזון החלבון והפחמימות שלך.',
      tag: 'evening-review',
      url: '/?tab=today',
    });
    lastSent.eveningDate = todayDateStr;
    setLastSentTracker(lastSent);
  }
}
