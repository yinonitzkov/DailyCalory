import { BiologicalSex, ActivityLevel } from '../types';

export interface CalculatorInput {
  birthDate: string; // "YYYY-MM-DD"
  biologicalSex: BiologicalSex;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg?: number;
  activityLevel: ActivityLevel;
}

export interface CalculatedTargets {
  ree: number; // Resting Energy Expenditure
  tdee: number; // Total Daily Energy Expenditure
  suggestedCalories: number; // Daily Target kcal
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  isFloorReached: boolean;
  floorWarningMessage?: string;
}

/**
 * Calculates age in full years from a YYYY-MM-DD birthdate string
 */
export function calculateAge(birthDateString: string): number {
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(1, age);
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { factor: number; label: string; description: string }> = {
  sedentary: {
    factor: 1.2,
    label: 'יושבני / משרדי',
    description: 'ללא פעילות גופנית יזומה או מעט מאוד',
  },
  light: {
    factor: 1.375,
    label: 'פעילות קלה',
    description: 'אימונים קלים 1–3 פעמים בשבוע',
  },
  moderate: {
    factor: 1.55,
    label: 'פעילות בינונית',
    description: 'אימונים סדירים 3–5 פעמים בשבוע',
  },
  active: {
    factor: 1.725,
    label: 'פעיל מאוד',
    description: 'אימונים מאומצים 6–7 פעמים בשבוע',
  },
  very_active: {
    factor: 1.9,
    label: 'מאומץ ביותר',
    description: 'עבודה פיזית קשה או ספורטאים תחרותיים',
  },
};

/**
 * Calculates Mifflin–St Jeor REE, TDEE and macro breakdown based on biological sex and activity level
 */
export function calculateCalorieAndMacroTargets(input: CalculatorInput): CalculatedTargets {
  const age = calculateAge(input.birthDate);
  const { biologicalSex, heightCm, currentWeightKg, targetWeightKg, activityLevel } = input;

  // 1. Mifflin–St Jeor REE formula
  // Male: 10 * weight + 6.25 * height - 5 * age + 5
  // Female: 10 * weight + 6.25 * height - 5 * age - 161
  let ree: number;
  if (biologicalSex === 'male') {
    ree = 10 * currentWeightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    ree = 10 * currentWeightKg + 6.25 * heightCm - 5 * age - 161;
  }
  ree = Math.round(ree);

  // 2. TDEE
  const activityMultiplier = ACTIVITY_MULTIPLIERS[activityLevel]?.factor || 1.2;
  const tdee = Math.round(ree * activityMultiplier);

  // 3. Goal adjustment: if target weight < current weight -> deficit
  const isWeightLoss = targetWeightKg ? targetWeightKg < currentWeightKg : true;
  let targetCalories = tdee;

  if (isWeightLoss) {
    // Max 500 kcal or 20% of TDEE deficit, whichever is smaller
    const maxDeficit = Math.min(500, Math.round(tdee * 0.20));
    targetCalories = tdee - maxDeficit;
  } else if (targetWeightKg && targetWeightKg > currentWeightKg) {
    // Slight surplus for healthy weight gain
    targetCalories = tdee + 300;
  }

  // 4. Safety floor check (1200 kcal female, 1500 kcal male)
  const minSafetyFloor = biologicalSex === 'male' ? 1500 : 1200;
  let isFloorReached = false;
  let floorWarningMessage: string | undefined = undefined;

  if (targetCalories < minSafetyFloor) {
    targetCalories = minSafetyFloor;
    isFloorReached = true;
    floorWarningMessage = `היעד חושב לרצפת הבטיחות המינימלית (${minSafetyFloor} קק״ל). מומלץ להתייעץ עם איש מקצוע.`;
  }

  // 5. Macro Distribution: 25% Protein, 45% Carbs, 30% Fat, 14g Fiber per 1000 kcal
  const proteinG = Math.round((targetCalories * 0.25) / 4);
  const carbsG = Math.round((targetCalories * 0.45) / 4);
  const fatG = Math.round((targetCalories * 0.30) / 9);
  const fiberG = Math.round((targetCalories / 1000) * 14);

  return {
    ree,
    tdee,
    suggestedCalories: targetCalories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    isFloorReached,
    floorWarningMessage,
  };
}
