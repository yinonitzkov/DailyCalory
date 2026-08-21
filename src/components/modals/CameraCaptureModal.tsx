import React, { useState, useEffect, useRef } from 'react';
import { Camera, Image as ImageIcon, RotateCcw, Send, X, AlertCircle, Sparkles, SwitchCamera, ShieldCheck } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitImage: (imageBase64: string, mimeType: string) => void;
  isProcessing?: boolean;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onSubmitImage,
  isProcessing = false,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedMime, setCapturedMime] = useState<string>('image/jpeg');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Monitor offline state
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // When modal opens/closes
  useEffect(() => {
    if (isOpen && !isOffline) {
      resetState();
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const resetState = () => {
    setCapturedImage(null);
    setCapturedMime('image/jpeg');
    setErrorMessage(null);
  };

  const startCamera = async () => {
    stopCamera();
    setErrorMessage(null);

    if (isOffline) {
      setErrorMessage('זיהוי תמונה דורש חיבור אינטרנט פעיל (Vision AI).');
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('הדפדפן אינו תומך בהפעלת מצלמה ישירה');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream error, falling back to file picker:', err);
      setCameraActive(false);
      setErrorMessage('לא ניתן לגשת למצלמה. ניתן להעלות תמונה מהגלריה.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture snapshot from video stream
  const takeSnapshot = () => {
    if (!videoRef.current || !cameraActive) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    // Max dimension 1200px for optimal speed and clarity
    const maxDim = 1200;
    let targetW = width;
    let targetH = height;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        targetW = maxDim;
        targetH = Math.round((height * maxDim) / width);
      } else {
        targetH = maxDim;
        targetW = Math.round((width * maxDim) / height);
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, targetW, targetH);
    const base64Data = canvas.toDataURL('image/jpeg', 0.85);

    setCapturedImage(base64Data);
    setCapturedMime('image/jpeg');
    stopCamera();
  };

  // Handle file selection from gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('אנא בחר קובץ תמונה תקין (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('גודל התמונה עולה על 10MB. אנא בחר תמונה קטנה יותר.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCapturedImage(result);
        setCapturedMime(file.type || 'image/jpeg');
        setErrorMessage(null);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSend = () => {
    if (!capturedImage || isProcessing) return;
    onSubmitImage(capturedImage, capturedMime);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="camera-capture-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        id="camera-capture-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-modal-title"
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div className="text-right">
              <h2 id="camera-modal-title" className="text-sm font-bold text-slate-900">
                צילום ארוחה חכם (Vision AI)
              </h2>
              <p className="text-[11px] text-slate-500">
                צלם את הצלחת וה-AI יזהה את המרכיבים והערכים
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

        {/* Offline notice if disconnected */}
        {isOffline && (
          <div className="m-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 text-right">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p>
              <strong>מצב לא מקוון:</strong> צילום תמונה דורש חיבור אינטרנט. ניתן להמשיך ברישום טקסט offline.
            </p>
          </div>
        )}

        {/* Error message */}
        {errorMessage && !isOffline && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-xs text-rose-800 text-right">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-[11px] text-rose-700">ניתן להעלות תמונה מהגלריה או לכתוב בטקסט.</p>
            </div>
          </div>
        )}

        {/* Viewport Stage: Video Stream OR Image Preview */}
        <div className="relative bg-slate-900 w-full aspect-4/3 sm:aspect-square flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            /* Preview of captured image */
            <img
              src={capturedImage}
              alt="תמונת המנה שצולמה"
              className="w-full h-full object-cover"
            />
          ) : cameraActive ? (
            /* Live camera feed */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Target Aim Frame */}
              <div className="absolute inset-8 border-2 border-white/60 border-dashed rounded-3xl pointer-events-none flex items-center justify-center">
                <span className="text-[11px] font-bold text-white/90 bg-slate-950/60 px-3 py-1 rounded-full backdrop-blur-xs">
                  כוון למרכז הצלחת
                </span>
              </div>

              {/* Flip camera button */}
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="absolute top-3 left-3 p-2.5 bg-slate-950/60 hover:bg-slate-950/80 text-white rounded-full backdrop-blur-xs transition-colors"
                aria-label="החלף מצלמה"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            </>
          ) : (
            /* Fallback state when camera is inactive */
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <ImageIcon className="w-8 h-8" />
              </div>
              <p className="text-xs text-slate-400 max-w-xs">
                בחר תמונה מגלריית המכשיר או אפשר גישה למצלמה
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                <span>בחר תמונה מהגלריה</span>
              </button>
            </div>
          )}

          {/* AI Processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 space-y-2 text-center animate-in fade-in">
              <Sparkles className="w-8 h-8 text-teal-400 animate-spin" />
              <p className="text-sm font-bold">ה-AI מנתח את הצלחת...</p>
              <p className="text-xs text-slate-300">
                מזהה פריטים, מעריך כמויות ומחשב ערכים תזונתיים
              </p>
            </div>
          )}
        </div>

        {/* Hidden File Input for Gallery Selection */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Zero-Storage Privacy Badge */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>פרטיות מלאה: התמונה מעובדת בזיכרון בלבד ונמחקת מיד (Zero-Storage AI)</span>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white flex items-center justify-between gap-3">
          {capturedImage ? (
            <>
              {/* Retake */}
              <button
                type="button"
                id="btn-photo-retake"
                onClick={() => {
                  resetState();
                  startCamera();
                }}
                disabled={isProcessing}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>צלם שוב</span>
              </button>

              {/* Submit Photo */}
              <button
                type="button"
                id="btn-photo-submit"
                onClick={handleSend}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors active:scale-95"
              >
                <Send className="w-4 h-4 rotate-180" />
                <span>פענח ושמור ביומן</span>
              </button>
            </>
          ) : (
            <>
              {/* Gallery button */}
              <button
                type="button"
                id="btn-photo-gallery"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || isOffline}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                <span>גלריה</span>
              </button>

              {/* Main Shutter Button */}
              <button
                type="button"
                id="btn-photo-shutter"
                onClick={takeSnapshot}
                disabled={!cameraActive || isProcessing || isOffline}
                className="w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-40 text-white flex items-center justify-center shadow-lg ring-4 ring-teal-200 transition-all mx-auto"
                aria-label="צלם תמונה"
              >
                <Camera className="w-6 h-6" />
              </button>

              {/* Cancel */}
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="py-2.5 px-4 text-slate-500 hover:text-slate-800 text-xs font-semibold transition-colors"
              >
                ביטול
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
