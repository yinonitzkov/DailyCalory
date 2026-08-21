import React from 'react';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getLocalDateString } from '../../utils/dateUtils';

export const DateNavigationBar: React.FC = () => {
  const { selectedDate, setSelectedDate } = useApp();
  const todayStr = getLocalDateString(new Date());
  const isToday = selectedDate === todayStr;

  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(getLocalDateString(d));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(getLocalDateString(d));
  };

  const handleResetToday = () => {
    setSelectedDate(todayStr);
  };

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === todayStr) return 'היום';
    const d = new Date(dateStr + 'T12:00:00');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === getLocalDateString(yesterday)) return 'אתמול';
    
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const dayName = dayNames[d.getDay()];
    const formatted = `${d.getDate()}/${d.getMonth() + 1}`;
    return `יום ${dayName}, ${formatted}`;
  };

  return (
    <div
      id="date-navigation-bar"
      className="flex items-center justify-between bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2 px-3 text-slate-100 shadow-sm"
    >
      {/* Right button: Go to next day (RTL) */}
      <button
        id="date-nav-next-btn"
        onClick={handleNextDay}
        className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 active:scale-95 transition-all"
        title="יום הבא"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Center: Selected date display & quick date picker */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="date-picker-input"
          className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-sm font-semibold transition-colors"
        >
          <CalendarIcon className="w-4 h-4 text-emerald-400" />
          <span>{formatDateLabel(selectedDate)}</span>
        </label>
        <input
          id="date-picker-input"
          type="date"
          value={selectedDate}
          max={getLocalDateString(new Date(Date.now() + 1000 * 60 * 60 * 24 * 30))}
          onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
          className="sr-only"
        />

        {!isToday && (
          <button
            id="date-nav-today-btn"
            onClick={handleResetToday}
            className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg hover:bg-emerald-900/60 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>חזור להיום</span>
          </button>
        )}
      </div>

      {/* Left button: Go to prev day (RTL) */}
      <button
        id="date-nav-prev-btn"
        onClick={handlePrevDay}
        className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 active:scale-95 transition-all"
        title="יום קודם"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    </div>
  );
};
