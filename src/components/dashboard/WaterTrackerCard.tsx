import React, { useState } from 'react';
import { Droplet, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const WaterTrackerCard: React.FC = () => {
  const { userProfile, selectedDateWaterMl, addWater, setWater, selectedDate } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [tempAmount, setTempAmount] = useState('');

  const targetMl = userProfile?.waterTargetMl || 2500;
  const currentMl = selectedDateWaterMl;
  const percentage = Math.min(100, Math.round((currentMl / targetMl) * 100));
  const isGoalReached = currentMl >= targetMl;

  const glassesCount = Math.round((currentMl / 250) * 10) / 10;

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(tempAmount, 10);
    if (!isNaN(val)) {
      setWater(val, selectedDate);
    }
    setIsEditing(false);
  };

  return (
    <div
      id="water-tracker-card"
      className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-blue-950/30 border border-cyan-800/40 rounded-3xl p-5 shadow-sm text-slate-100"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Droplet className="w-5 h-5 fill-cyan-400/20" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">מעקב שתיית מים</h3>
            <p className="text-xs text-slate-400">
              {glassesCount} כוסות מתוך {targetMl / 250} כוסות ({percentage}%)
            </p>
          </div>
        </div>

        {isGoalReached && (
          <div className="flex items-center gap-1 text-xs font-medium text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-1 rounded-full animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>היעד הושג!</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3.5 bg-slate-800 rounded-full overflow-hidden mb-3 border border-slate-700/50">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Numerical info & Quick Add Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div>
          {isEditing ? (
            <form onSubmit={handleSaveCustom} className="flex items-center gap-1.5">
              <input
                type="number"
                value={tempAmount}
                onChange={(e) => setTempAmount(e.target.value)}
                placeholder={String(currentMl)}
                className="w-20 bg-slate-950 border border-cyan-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-1 rounded-lg"
              >
                שמור
              </button>
            </form>
          ) : (
            <div
              onClick={() => {
                setTempAmount(String(currentMl));
                setIsEditing(true);
              }}
              className="cursor-pointer group flex items-baseline gap-1"
              title="לחץ לעריכה ידנית"
            >
              <span className="text-lg font-bold text-cyan-300 tracking-tight">
                {currentMl.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">/ {targetMl.toLocaleString()} מ״ל</span>
            </div>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1.5">
          {currentMl > 0 && (
            <button
              id="water-minus-btn"
              onClick={() => addWater(-250, selectedDate)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 border border-slate-700/60 transition-all text-xs flex items-center justify-center"
              title="הפחת כוס (250 מ״ל)"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            id="water-add-cup-btn"
            onClick={() => addWater(250, selectedDate)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 active:scale-95 text-cyan-300 border border-cyan-800/60 transition-all text-xs font-medium shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>כוס (250 מ״ל)</span>
          </button>

          <button
            id="water-add-bottle-btn"
            onClick={() => addWater(500, selectedDate)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-950 hover:bg-blue-900 active:scale-95 text-blue-300 border border-blue-800/60 transition-all text-xs font-medium shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>בקבוק (500 מ״ל)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
