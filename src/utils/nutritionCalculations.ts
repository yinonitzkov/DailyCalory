import { FoodComponent, FoodReport } from '../types';

/**
 * Recalculates total calories and macronutrients for a FoodReport based on its active components.
 */
export function recalculateReportTotals(
  report: FoodReport,
  updatedComponents: FoodComponent[]
): FoodReport {
  const totalCalories = updatedComponents.reduce(
    (sum, c) => sum + (Number(c.calories) || 0),
    0
  );
  const totalProtein = updatedComponents.reduce(
    (sum, c) => sum + (Number(c.proteinG) || 0),
    0
  );
  const totalCarbs = updatedComponents.reduce(
    (sum, c) => sum + (Number(c.carbsG) || 0),
    0
  );
  const totalFat = updatedComponents.reduce(
    (sum, c) => sum + (Number(c.fatG) || 0),
    0
  );
  const totalFiber = updatedComponents.reduce(
    (sum, c) => sum + (Number(c.fiberG) || 0),
    0
  );

  return {
    ...report,
    components: updatedComponents,
    calories: Math.round(totalCalories),
    proteinG: Math.round(totalProtein * 10) / 10,
    carbsG: Math.round(totalCarbs * 10) / 10,
    fatG: Math.round(totalFat * 10) / 10,
    fiberG: Math.round(totalFiber * 10) / 10,
  };
}

/**
 * Calculates proportional nutrition values when user adjusts quantity ratio.
 */
export function scaleComponentNutrition(
  component: FoodComponent,
  newQuantityValue: number
): Partial<FoodComponent> {
  const prevQuantity = component.quantityValue || 1;
  if (prevQuantity <= 0 || newQuantityValue <= 0) return {};

  const ratio = newQuantityValue / prevQuantity;

  return {
    quantityValue: newQuantityValue,
    calories: Math.round((component.calories || 0) * ratio),
    proteinG: Math.round((component.proteinG || 0) * ratio * 10) / 10,
    carbsG: Math.round((component.carbsG || 0) * ratio * 10) / 10,
    fatG: Math.round((component.fatG || 0) * ratio * 10) / 10,
    fiberG: Math.round((component.fiberG || 0) * ratio * 10) / 10,
  };
}
