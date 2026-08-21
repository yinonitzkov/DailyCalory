import React, { useState, useEffect } from 'react';
import { FoodComponent } from '../../types';
import { X, Trash2, Check, Scale } from 'lucide-react';
import { scaleComponentNutrition } from '../../utils/nutritionCalculations';

interface EditComponentSheetProps {
  isOpen: boolean;
  component: FoodComponent | null;
  onClose: () => void;
  onSave: (updatedComponent: FoodComponent) => void;
  onDelete: (componentId: string) => void;
}

export const EditComponentSheet: React.FC<EditComponentSheetProps> = ({
  isOpen,
  component,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [quantityValue, setQuantityValue] = useState<number>(100);
  const [quantityUnit, setQuantityUnit] = useState('גרם');
  const [calories, setCalories] = useState<number>(0);
  const [proteinG, setProteinG] = useState<number>(0);
  const [carbsG, setCarbsG] = useState<number>(0);
  const [fatG, setFatG] = useState<number>(0);
  const [fiberG, setFiberG] = useState<number>(0);
  const [isEstimated, setIsEstimated] = useState<boolean>(false);

  useEffect(() => {
    if (component) {
      setName(component.name);
      setQuantityValue(component.quantityValue);
      setQuantityUnit(component.quantityUnit);
      setCalories(component.calories);
      setProteinG(component.proteinG);
      setCarbsG(component.carbsG);
      setFatG(component.fatG);
      setFiberG(component.fiberG);
      setIsEstimated(component.isEstimated);
    }
  }, [component]);

  if (!isOpen || !component) return null;

  // Proportional quantity adjustment handler
  const handleQuantityChange = (newVal: number) => {
    setQuantityValue(newVal);
    if (newVal > 0 && component.quantityValue > 0) {
      const scaled = scaleComponentNutrition(component, newVal);
      if (scaled.calories !== undefined) setCalories(scaled.calories);
      if (scaled.proteinG !== undefined) setProteinG(scaled.proteinG);
      if (scaled.carbsG !== undefined) setCarbsG(scaled.carbsG);
      if (scaled.fatG !== undefined) setFatG(scaled.fatG);
      if (scaled.fiberG !== undefined) setFiberG(scaled.fiberG);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: FoodComponent = {
      ...component,
      name: name.trim(),
      quantityValue: Number(quantityValue) || 1,
      quantityUnit: quantityUnit.trim() || 'גרם',
      calories: Math.round(Number(calories) || 0),
      proteinG: Math.round((Number(proteinG) || 0) * 10) / 10,
      carbsG: Math.round((Number(carbsG) || 0) * 10) / 10,
      fatG: Math.round((Number(fatG) || 0) * 10) / 10,
      fiberG: Math.round((Number(fiberG) || 0) * 10) / 10,
      isEstimated,
    };

    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    onDelete(component.id);
    onClose();
  };

  return (
    <div
      id="edit-component-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="edit-component-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-component-title"
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 id="edit-component-title" className="text-sm font-bold text-slate-900">
                עריכת רכיב במנה
              </h2>
              <p className="text-[11px] text-slate-500">
                עדכון כמויות וערכים תזונתיים של רכיב בדיד
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור חלון עריכה"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Component Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">שם הרכיב</label>
            <input
              type="text"
              id="input-component-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Quantity and Unit Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">כמות</label>
              <input
                type="number"
                step="any"
                id="input-component-quantity"
                value={quantityValue}
                onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">יחידת מידה</label>
              <input
                type="text"
                id="input-component-unit"
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value)}
                placeholder="למשל: גרם / יחידה / כף"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Calories and Macros Grid */}
          <div className="space-y-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">ערכים תזונתיים</span>
              <span className="text-[10px] text-teal-700 font-medium">
                משתנים אוטומטית לפי הכמות
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="text-[11px] font-semibold text-slate-600">
                  קלוריות (קק״ל)
                </label>
                <input
                  type="number"
                  id="input-component-calories"
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
                  id="input-component-protein"
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
                  id="input-component-carbs"
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
                  id="input-component-fat"
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
                id="input-component-fiber"
                value={fiberG}
                onChange={(e) => setFiberG(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              id="btn-delete-component"
              onClick={handleDelete}
              className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>מחק רכיב</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                ביטול
              </button>

              <button
                type="submit"
                id="btn-save-component"
                className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>שמור שינויים</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
