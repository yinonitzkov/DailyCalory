/**
 * Core Types for Calories App (קלוריות)
 */

export type NavTab = 'report' | 'today' | 'weight' | 'workouts' | 'settings';

export type WorkoutFocus = 'core' | 'legs' | 'cardio' | 'full_body';
export type ExerciseTargetType = 'reps' | 'time';

export interface ExerciseVideo {
  provider: 'youtube';
  youtubeVideoId: string;
  startSeconds: number;
  endSeconds: number | null;
  source?: string;
}

export interface Exercise {
  id: string;
  nameHe: string;
  nameEn: string;
  category: string;
  primaryMuscles: string[];
  equipment: string[];
  difficulty: string;
  movementPattern: string;
  videos: ExerciseVideo[];
}

export interface WorkoutPlanItem {
  id: string;
  exerciseId: string;
  sets: number;
  targetType: ExerciseTargetType;
  targetValue: string;
  restSeconds: number;
  sortOrder: number;
}

export interface WorkoutPlanDay {
  id: string;
  dayNumber: number;
  focus: WorkoutFocus;
  items: WorkoutPlanItem[];
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  durationWeeks: number;
  daysPerWeek: number;
  focuses: WorkoutFocus[];
  durationMinMinutes: number;
  durationMaxMinutes: number;
  createdAt: string;
  updatedAt: string;
  days: WorkoutPlanDay[];
}

export type BiologicalSex = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface UserProfile {
  userId: string;
  birthDate?: string;
  biologicalSex?: BiologicalSex;
  heightCm?: number;
  currentWeightKg?: number;
  targetWeightKg?: number;
  activityLevel?: ActivityLevel;
  calorieTargetKcal: number;
  proteinTargetG: number;
  carbTargetG: number;
  fatTargetG: number;
  fiberTargetG: number;
  waterTargetMl?: number;
  timezone: string;
  locale: string;
  onboardingCompleted: boolean;
}

export interface UserFoodMemory {
  id: string;
  userId?: string;
  triggerName: string; // e.g. "קפה", "ביו", "שייק בוקר"
  resolvedDescription: string; // e.g. "קפה עם 60 מ״ל חלב 3%", "גביע יוגורט ביו 3% 200 גרם לא ממותק"
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InputType = 'text' | 'voice' | 'photo';

export type ReportStatus = 'queued' | 'processing' | 'saved' | 'needs_clarification' | 'failed' | 'deleted';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface FoodComponent {
  id: string;
  reportId: string;
  name: string;
  quantityValue: number;
  quantityUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  confidence: ConfidenceLevel;
  isEstimated: boolean;
  sortOrder?: number;
}

export interface FoodReport {
  id: string;
  userId: string;
  clientRequestId: string;
  inputType: InputType;
  originalText: string;
  imageUrl?: string;
  status: ReportStatus;
  confidence: ConfidenceLevel;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  recordedAt: string; // ISO date string
  components: FoodComponent[];
  clarificationQuestion?: string | null;
}

export interface WeightEntry {
  id: string;
  userId: string;
  weightKg: number;
  recordedAt: string; // ISO date string
  notes?: string;
}

export interface ReportMessage {
  id: string;
  reportId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  operationJson?: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationPreferences {
  foodEnabled: boolean;
  foodTimeLocal: string; // "HH:MM"
  weightEnabled: boolean;
  weightWeekday: number; // 0-6 (0 = Sunday in Israel)
  weightTimeLocal: string; // "HH:MM"
}

export interface DailySummary {
  date: string;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalFiberG: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  targetFiberG: number;
  reportsCount: number;
}
