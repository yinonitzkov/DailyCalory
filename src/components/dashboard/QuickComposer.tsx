import React, { useState } from 'react';
import { Send, Mic, Camera, Sparkles, BrainCircuit } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface QuickComposerProps {
  onSubmitText?: (text: string) => void;
  onVoiceClick?: () => void;
  onPhotoClick?: () => void;
  isProcessing?: boolean;
  isHighlighted?: boolean;
  externalText?: string;
  onExternalTextConsumed?: () => void;
}

export const QuickComposer: React.FC<QuickComposerProps> = ({
  onSubmitText,
  onVoiceClick,
  onPhotoClick,
  isProcessing = false,
  isHighlighted = false,
  externalText,
  onExternalTextConsumed,
}) => {
  const { foodMemories } = useApp();
  const [text, setText] = useState('');

  // Handle external text injection (e.g. from Undo or suggestions)
  React.useEffect(() => {
    if (externalText !== undefined && externalText !== '') {
      setText(externalText);
      onExternalTextConsumed?.();
    }
  }, [externalText, onExternalTextConsumed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isProcessing) return;
    if (onSubmitText) {
      onSubmitText(text.trim());
      setText('');
    }
  };

  const handleShortcutClick = (trigger: string) => {
    if (onSubmitText) {
      onSubmitText(trigger);
    }
  };

  return (
    <section
      id="quick-food-composer"
      aria-label="אזור דיווח אוכל מהיר"
      className={`p-4 bg-slate-900 border rounded-3xl transition-all duration-300 shadow-sm ${
        isHighlighted
          ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-md'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor="food-input-field"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-100 tracking-tight"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>מה אכלת עכשיו?</span>
          </label>
          <span className="text-[11px] text-slate-400 font-medium">
            כתיבה חופשית, קול או צילום
          </span>
        </div>

        <div className="relative flex items-center">
          <input
            id="food-input-field"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isProcessing}
            placeholder="לדוגמה: קפה, יוגורט ביו, כריך חזה עוף..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pr-4 pl-24 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-right disabled:opacity-60"
          />

          {/* Action buttons inside the input container */}
          <div className="absolute left-2 flex items-center gap-1">
            {/* Camera */}
            <button
              type="button"
              id="btn-composer-camera"
              onClick={onPhotoClick}
              disabled={isProcessing}
              aria-label="צלם או העלה תמונת מנה"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Mic */}
            <button
              type="button"
              id="btn-composer-mic"
              onClick={onVoiceClick}
              disabled={isProcessing}
              aria-label="הקלט דיווח קולי"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Send */}
            <button
              type="submit"
              id="btn-composer-send"
              disabled={!text.trim() || isProcessing}
              aria-label="שלח דיווח לניתוח ושמירה"
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm shadow-emerald-600/20"
            >
              <Send className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>

        {/* Personalized Food Memory Quick Chips */}
        {foodMemories && foodMemories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar text-xs">
            <span className="text-[11px] text-slate-500 shrink-0 flex items-center gap-1">
              <BrainCircuit className="w-3 h-3 text-emerald-400" />
              <span>זיכרון אישי:</span>
            </span>
            {foodMemories.map((mem) => (
              <button
                key={mem.id}
                type="button"
                onClick={() => handleShortcutClick(mem.triggerName)}
                disabled={isProcessing}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 transition-all font-medium"
              >
                <span>{mem.triggerName}</span>
                <span className="text-[10px] text-slate-500">✨</span>
              </button>
            ))}
          </div>
        )}
      </form>
    </section>
  );
};

