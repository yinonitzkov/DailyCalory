import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Send, X, AlertCircle, Sparkles } from 'lucide-react';

interface VoiceRecordingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAudio: (audioBase64: string, mimeType: string) => void;
  onSubmitTextFallback?: (text: string) => void;
  isProcessing?: boolean;
}

export const VoiceRecordingSheet: React.FC<VoiceRecordingSheetProps> = ({
  isOpen,
  onClose,
  onSubmitAudio,
  onSubmitTextFallback,
  isProcessing = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize or reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetState();
      startRecording();
    } else {
      stopAndCleanup();
    }

    return () => {
      stopAndCleanup();
    };
  }, [isOpen]);

  const resetState = () => {
    setIsRecording(false);
    setRecordDuration(0);
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setIsPlayingPreview(false);
    setErrorMessage(null);
    setLiveTranscript('');
    setAudioLevel(0);
    audioChunksRef.current = [];
  };

  const stopAndCleanup = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
  };

  const startRecording = async () => {
    resetState();
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('הדפדפן אינו תומך בהקלטת אודיו');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Audio Level Analyzer for visual waveform
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkLevel = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          }
          animFrameRef.current = requestAnimationFrame(checkLevel);
        };
        checkLevel();
      } catch (err) {
        console.warn('AudioContext level visualization unsupported', err);
      }

      // Browser Web Speech Recognition for live text preview if available
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'he-IL';
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript;
            }
            if (current) setLiveTranscript(current);
          };

          recognition.onerror = (e: any) => {
            console.warn('Speech recognition warning:', e);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn('SpeechRecognition failed to start', e);
        }
      }

      // MediaRecorder for recording the actual audio stream
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mime = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      // Duration counter
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setRecordDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 500);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setErrorMessage(
        'לא ניתן לגשת למיקרופון. אנא ודא שהרשאת המיקרופון מאושרת בדפדפן או נסה לכתוב בטקסט.'
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setAudioLevel(0);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
  };

  const handleSend = () => {
    if (isProcessing) return;

    // If live transcript exists and we have text fallback, we can also use it
    if (audioBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = (reader.result as string) || '';
        const mimeType = audioBlob.type || 'audio/webm';
        onSubmitAudio(base64Audio, mimeType);
        onClose();
      };
      reader.readAsDataURL(audioBlob);
    } else if (liveTranscript.trim() && onSubmitTextFallback) {
      onSubmitTextFallback(liveTranscript.trim());
      onClose();
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;

    if (!audioPreviewRef.current) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingPreview(false);
      audioPreviewRef.current = audio;
    }

    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div
      id="voice-recording-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        id="voice-recording-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-modal-title"
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 text-center animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div className="text-right">
              <h2 id="voice-modal-title" className="text-sm font-bold text-slate-900">
                דיווח קולי חכם
              </h2>
              <p className="text-[11px] text-slate-500">
                ספר מה אכלת בעברית טבעית וה-AI יפרק את המנה
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="סגור"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message state */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-right text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-[11px] text-rose-700">
                ניתן לעבור לדיווח בטקסט חופשי דרך שורת החיפוש הראשית.
              </p>
            </div>
          </div>
        )}

        {/* Recording Animation Stage */}
        <div className="py-4 flex flex-col items-center justify-center space-y-4">
          <div className="relative flex items-center justify-center">
            {/* Pulsing rings when recording */}
            {isRecording && (
              <>
                <div
                  className="absolute w-28 h-28 rounded-full bg-teal-500/20 animate-ping"
                  style={{ animationDuration: '2s' }}
                />
                <div
                  className="absolute w-24 h-24 rounded-full bg-teal-500/30 transition-all duration-75"
                  style={{ transform: `scale(${1 + audioLevel * 0.005})` }}
                />
              </>
            )}

            {/* Central Mic/Action Button */}
            <button
              type="button"
              id="btn-toggle-voice-record"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              aria-label={isRecording ? 'עצור הקלטה' : 'התחל הקלטה'}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 z-10 ${
                isRecording
                  ? 'bg-rose-500 hover:bg-rose-600 text-white ring-4 ring-rose-300 animate-pulse'
                  : audioBlob
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              {isRecording ? (
                <Square className="w-8 h-8 fill-current" />
              ) : (
                <Mic className="w-9 h-9" />
              )}
            </button>
          </div>

          {/* Status Label & Timer */}
          <div className="space-y-1">
            <span className="text-sm font-bold text-slate-800 block">
              {isRecording
                ? 'מקליט כעת... ספר מה אכלת'
                : audioBlob
                ? 'ההקלטה הסתיימה בהצלחה'
                : 'לחץ על המיקרופון כדי להתחיל'}
            </span>
            <span className="text-xs font-mono font-bold text-teal-700">
              {formatSeconds(recordDuration)}
            </span>
          </div>

          {/* Live Transcript Bubble if captured */}
          {liveTranscript && (
            <div className="w-full p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs text-slate-800 italic text-right animate-in fade-in">
              <span className="text-[10px] font-bold text-teal-800 not-italic block mb-0.5">
                תמלול מקדים בזמן אמת:
              </span>
              "{liveTranscript}"
            </div>
          )}
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="p-3 bg-teal-50 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-teal-900 animate-pulse">
            <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
            <span>ה-AI מאזין, מתמלל ומפרק את המנה...</span>
          </div>
        )}

        {/* Controls Footer */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
          {/* Re-record button */}
          <button
            type="button"
            id="btn-voice-rerecord"
            onClick={startRecording}
            disabled={isRecording || isProcessing}
            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>הקלט מחדש</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Audio Preview playback button */}
            {audioUrl && !isRecording && (
              <button
                type="button"
                id="btn-voice-preview"
                onClick={togglePlayback}
                disabled={isProcessing}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                {isPlayingPreview ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>עצור השמעה</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>האזן להקלטה</span>
                  </>
                )}
              </button>
            )}

            {/* Send / Analyze button */}
            <button
              type="button"
              id="btn-voice-submit"
              onClick={handleSend}
              disabled={(!audioBlob && !liveTranscript) || isRecording || isProcessing}
              className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5 rotate-180" />
              <span>שלח לפענוח ושמירה</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
