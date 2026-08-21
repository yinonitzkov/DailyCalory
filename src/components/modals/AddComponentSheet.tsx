import React, { useState } from 'react';
import { FoodComponent } from '../../types';
import { X, Plus, Check } from 'lucide-react';

interface AddComponentSheetProps {
  isOpen: boolean;
  reportId: string;
  onClose: () => void;
  onAdd: (newComponent: FoodComponent) => void;
}

export const AddComponentSheet: React.FC<AddComponentSheetProps> = ({
  isOpen,
  reportId,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [quantityValue, setQuantityValue] = useState<number>(100);
  const [quantityUnit, setQuantityUnit] = useState('גרם');
  const [calories, setCalories] = useState<number>(100);
  const [proteinG, setProteinG] = useState<number>(0);
  const [carbsG, setCarbsG] = useState<number>(0);
  const [fatG, setFatG] = useState<number>(0);
  const [fiberG, setFiberG] = useState<number>(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newComponent: FoodComponent = {
      id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reportId,
      name: name.trim(),
      quantityValue: Number(quantityValue) || 1,
      quantityUnit: quantityUnit.trim() || 'גרם',
      calories: Math.round(Number(calories) || 0),
      proteinG: Math.round((Number(proteinG) || 0) * 10) / 10,
      carbsG: Math.round((Number(carbsG) || 0) * 10) / 10,
      fatG: Math.round((Number(fatG) || 0) * 10) / 10,
      fiberG: Math.round((Number(fiberG) || 0) * 10) / 10,
      confidence: 'medium',
      isEstimated: false,
    };

    onAdd(newComponent);
    onClose();
  };

  return (
    <div
      id="add-component-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="add-component-sheet"
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 duration-200"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">הוספת רכיב למנה</h2>
              <p className="text-[11px] text-slate-500">
                הוסף מאכל או תוספת לחישוב הקלורי הכולל
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">שם הרכיב / המאכל</label>
            <input
              type="text"
              id="input-new-component-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="למשל: כף שמן זית, תפוח ירוק, גבינה צהובה"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">כמות</label>
              <input
                type="number"
                step="any"
                id="input-new-component-quantity"
                value={quantityValue}
                onChange={(e) => setQuantityValue(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">יחידת מידה</label>
              <input
                type="text"
                id="input-new-component-unit"
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value)}
                placeholder="גרם / יחידה / כף"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="space-y-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-800 block">ערכים תזונתיים</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="text-[11px] font-semibold text-slate-600">
                  קלוריות (קק״ל)
                </label>
                <input
                  type="number"
                  id="input-new-component-calories"
                  value={calories}
                  onChange={(e) => setCalories(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[11px] font-semibold text-teal-700">
                  חלבון (גרם)
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="input-new-component-protein"
                  value={proteinG}
                  onChange={(e) => setProteinG(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[11px] font-semibold text-blue-700">
                  פחמימות (גרם)
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="input-new-component-carbs"
                  value={carbsG}
                  onChange={(e) => setCarbsG(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[11px] font-semibold text-amber-700">
                  שומן (גרם)
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="input-new-component-fat"
                  value={fatG}
                  onChange={(e) => setFatG(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-0.5 pt-1">
              <label className="text-[11px] font-semibold text-emerald-700">
                סיבים תזונתיים (גרם)
              </label>
              <input
                type="number"
                step="0.1"
                id="input-new-component-fiber"
                value={fiberG}
                onChange={(e) => setFiberG(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
            >
              ביטול
            </button>

            <button
              type="submit"
              id="btn-confirm-add-component"
              className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>הוסף רכיב למנה</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
