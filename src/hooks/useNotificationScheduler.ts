import { useEffect } from 'react';
import {
  checkAndTriggerScheduledNotifications,
  STORAGE_KEY_NOTIFS,
  defaultNotificationSettings,
  NotificationSettings,
} from '../utils/notificationEngine';

export function useNotificationScheduler() {
  useEffect(() => {
    const runCheck = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
        const settings: NotificationSettings = saved
          ? JSON.parse(saved)
          : defaultNotificationSettings;
        checkAndTriggerScheduledNotifications(settings);
      } catch (err) {
        console.warn('Error in notification scheduler:', err);
      }
    };

    // Check once immediately on load
    runCheck();

    // Re-check every 60 seconds
    const interval = setInterval(runCheck, 60000);

    return () => clearInterval(interval);
  }, []);
}
