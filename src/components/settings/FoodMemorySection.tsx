import React, { useState } from 'react';
import { BrainCircuit, Plus, Trash2, Edit2, Sparkles, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserFoodMemory } from '../../types';

export const FoodMemorySection: React.FC = () => {
  const { foodMemories, addFoodMemory, updateFoodMemory, deleteFoodMemory } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [triggerName, setTriggerName] = useState('');
  const [resolvedDescription, setResolvedDescription] = useState('');
  const [notes, setNotes] = useState('');

  const [editTrigger, setEditTrigger] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const handleStartAdd = (presetTrigger?: string, presetDesc?: string) => {
    setTriggerName(presetTrigger || '');
    setResolvedDescription(presetDesc || '');
    setNotes('');
    setIsAdding(true);
    setEditingId(null);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerName.trim() || !resolvedDescription.trim()) return;

    addFoodMemory({
      triggerName: triggerName.trim(),
      resolvedDescription: resolvedDescription.trim(),
      notes: notes.trim(),
    });

    setTriggerName('');
    setResolvedDescription('');
    setNotes('');
    setIsAdding(false);
  };

  const handleStartEdit = (memory: UserFoodMemory) => {
    setEditingId(memory.id);
    setEditTrigger(memory.triggerName);
    setEditDescription(memory.resolvedDescription);
    setEditNotes(memory.notes || '');
    setIsAdding(false);
  };

  const handleSaveEdit = (memory: UserFoodMemory) => {
    if (!editTrigger.trim() || !editDescription.trim()) return;
    updateFoodMemory({
      ...memory,
      triggerName: editTrigger.trim(),
      resolvedDescription: editDescription.trim(),
      notes: editNotes.trim(),
    });
    setEditingId(null);
  };

  return (
    <div
      id="food-memory-section"
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm text-slate-100 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base">זיכרון והעדפות מזון אישיות</h3>
            <p className="text-xs text-slate-400">
              הגדר ל-AI מה הכוונה המדויקת כשאתה כותב מילים קבועות (למשל "קפה" או "ביו")
            </p>
          </div>
        </div>

        {!isAdding && (
          <button
            id="add-memory-btn"
            onClick={() => handleStartAdd()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>הגדרה חדשה</span>
          </button>
        )}
      </div>

      {/* Quick Suggestions presets */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-500 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>הצעות מהירות:</span>
        </span>
        <button
          type="button"
          onClick={() => handleStartAdd('קפה', 'קפה עם 60 מ״ל חלב 3%')}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          ☕ קפה קבוע
        </button>
        <button
          type="button"
          onClick={() => handleStartAdd('ביו', 'גביע יוגורט ביו 3% לא ממותק 200 גרם')}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          🥛 יוגורט ביו
        </button>
        <button
          type="button"
          onClick={() => handleStartAdd('שייק בוקר', 'שקית אבקת חלבון 25 גרם, כוס חלב סויה ובננה')}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          🥤 שייק בוקר
        </button>
        <button
          type="button"
          onClick={() => handleStartAdd('סלט הבית', 'סלט מלפפון ועגבניה עם כף שמן זית ו-50 גרם בולגרית 5%')}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          🥗 סלט הבית
        </button>
      </div>

      {/* Add New Memory Form */}
      {isAdding && (
        <form
          onSubmit={handleSaveNew}
          className="bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-xs font-bold text-emerald-400">הוספת זיכרון מזון אישי ל-AI</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-medium">מילת המפתח / הקיצור (מה אתה כותב)</label>
            <input
              type="text"
              value={triggerName}
              onChange={(e) => setTriggerName(e.target.value)}
              placeholder="למשל: קפה / ביו / סלט קבוע"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-medium">הפירוט המדויק שה-AI יזהה</label>
            <textarea
              value={resolvedDescription}
              onChange={(e) => setResolvedDescription(e.target.value)}
              placeholder="למשל: כוס נס קפה עם 60 מ״ל חלב 3% וכפית סוכר"
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400">הערה אישית (אופציונלי)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="למשל: שותה בכל בוקר"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>שמור הגדרה</span>
            </button>
          </div>
        </form>
      )}

      {/* List of Saved Memories */}
      <div className="space-y-2.5">
        {foodMemories.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
            עדיין לא הוגדרו זיכרונות אישיים. לחץ על &quot;הגדרה חדשה&quot; כדי להוסיף.
          </div>
        ) : (
          foodMemories.map((mem) => {
            const isEditingThis = editingId === mem.id;

            if (isEditingThis) {
              return (
                <div
                  key={mem.id}
                  className="bg-slate-950 border border-emerald-500/50 rounded-2xl p-3 space-y-2"
                >
                  <input
                    type="text"
                    value={editTrigger}
                    onChange={(e) => setEditTrigger(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
                    >
                      ביטול
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(mem)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg"
                    >
                      שמור
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={mem.id}
                className="flex items-start justify-between bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 hover:border-slate-700/80 transition-all"
              >
                <div className="space-y-1 pr-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400 text-sm tracking-tight bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-0.5 rounded-lg">
                      {mem.triggerName}
                    </span>
                    {mem.notes && (
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({mem.notes})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {mem.resolvedDescription}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <button
                    onClick={() => handleStartEdit(mem)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title="ערוך הגדרה"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteFoodMemory(mem.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="מחק הגדרה"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
