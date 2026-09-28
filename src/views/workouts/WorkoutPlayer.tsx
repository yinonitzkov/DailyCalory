import React, { useEffect, useRef, useState } from 'react';
import { Exercise } from '../../types';

declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void }
}
let youtubeApiPromise: Promise<void> | null = null;
function loadYoutubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (!youtubeApiPromise) youtubeApiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    window.onYouTubeIframeAPIReady = () => resolve();
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => reject(new Error('YouTube player failed to load'));
      document.head.appendChild(script);
    }
    window.setTimeout(() => window.YT?.Player && resolve(), 8000);
  });
  return youtubeApiPromise;
}

export const WorkoutPlayer: React.FC<{ exercise: Exercise; onClose: () => void }> = ({ exercise, onClose }) => {
  const playerRef = useRef<any>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [playerError, setPlayerError] = useState('');
  const video = exercise.videos[0];

  useEffect(() => {
    let cancelled = false;
    if (!video) return;
    loadYoutubeApi().then(() => {
      if (cancelled || !mountRef.current) return;
      const host = document.createElement('div');
      mountRef.current.replaceChildren(host);
      playerRef.current = new window.YT!.Player(host, {
        width: '100%', height: '100%', videoId: video.youtubeVideoId,
        playerVars: { enablejsapi: 1, playsinline: 1, rel: 0 },
        events: {
          onReady: (event: any) => event.target.cueVideoById({
            videoId: video.youtubeVideoId,
            startSeconds: video.startSeconds,
            ...(video.endSeconds != null ? { endSeconds: video.endSeconds } : {}),
          }),
          onError: () => setPlayerError('הסרטון אינו זמין כרגע. אפשר לנסות סרטון אחר בהמשך.'),
        },
      });
    }).catch(() => setPlayerError('לא ניתן לטעון כרגע את נגן YouTube.'));
    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [video?.youtubeVideoId, video?.startSeconds, video?.endSeconds]);

  return <div className="fixed inset-0 z-[80] bg-slate-950/90 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`הדגמת ${exercise.nameHe}`} dir="rtl">
    <div className="w-full max-w-lg rounded-3xl bg-white p-4 shadow-2xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold text-slate-900">{exercise.nameHe}</h2><p className="text-xs text-slate-500">הדגמת התרגיל דרך YouTube</p></div>
        <button onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">סגירה</button>
      </div>
      {video ? <div className="aspect-video overflow-hidden rounded-2xl bg-black"><div ref={mountRef} className="h-full w-full" /></div> : <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">אין כרגע סרטון משויך לתרגיל.</p>}
      {playerError && <p className="mt-2 text-sm text-rose-700">{playerError}</p>}
    </div>
  </div>;
};
