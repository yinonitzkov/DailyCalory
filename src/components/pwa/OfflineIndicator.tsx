import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      const timer = setTimeout(() => {
        setJustReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && !justReconnected) {
    return null;
  }

  return (
    <div
      id="pwa-network-status-banner"
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center p-2.5 pointer-events-none animate-in fade-in slide-in-from-top-2"
      dir="rtl"
    >
      {isOffline ? (
        <div className="bg-slate-900/90 text-white text-xs py-1.5 px-3.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 border border-slate-700 pointer-events-auto">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-semibold">
            מצב לא מקוון — כל הנתונים נשמרים מקומית במכשירך
          </span>
        </div>
      ) : (
        <div className="bg-emerald-800/90 text-white text-xs py-1.5 px-3.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 border border-emerald-600 pointer-events-auto">
          <Wifi className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          <span className="font-semibold">החיבור חודש! הנתונים מעודכנים</span>
        </div>
      )}
    </div>
  );
};
