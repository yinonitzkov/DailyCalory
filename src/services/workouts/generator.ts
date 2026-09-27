import { Exercise, WorkoutFocus, WorkoutPlan, WorkoutPlanDay, WorkoutPlanItem } from '../../types';
import { EXERCISES, exercisesForFocus, FOCUS_LABELS } from './catalog';
export interface WorkoutPlanPreferences {
  daysPerWeek: number; durationWeeks: number; focuses: WorkoutFocus[];
  durationMinMinutes: number; durationMaxMinutes: number; userId: string;
}
const uid = () => globalThis.crypto?.randomUUID?.() || `workout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
function dayExercises(focus: WorkoutFocus, preferences: WorkoutPlanPreferences, dayIndex: number): Exercise[] {
  if (focus !== 'full_body') return exercisesForFocus(focus);
  const chosen: Exercise[] = [];
  for (const selectedFocus of preferences.focuses.filter((value) => value !== 'full_body' && value !== 'cardio')) {
    const group = exercisesForFocus(selectedFocus);
    if (group.length) chosen.push(group[(dayIndex * 2) % group.length]);
  }
  const balanced = exercisesForFocus('full_body').filter((exercise) => !chosen.some((item) => item.id === exercise.id));
  chosen.push(...balanced.slice(0, Math.max(0, 5 - chosen.length)));
  if (chosen.length < 4) chosen.push(...EXERCISES.filter((exercise) => ['legs', 'chest', 'back', 'core'].includes(exercise.category) && !chosen.some((item) => item.id === exercise.id)).slice(0, 4 - chosen.length));
  return chosen;
}
function makeItems(focus: WorkoutFocus, candidates: Exercise[], targetMinutes: number, dayIndex: number): WorkoutPlanItem[] {
  const cardio = focus === 'cardio';
  const preferredCount = Math.max(3, Math.min(cardio ? 2 : 6, Math.round(targetMinutes / (cardio ? 12 : 5))));
  const selected: Exercise[] = [];
  for (let i = 0; i < Math.min(candidates.length, preferredCount); i++) selected.push(candidates[(i + dayIndex) % candidates.length]);
  if (!selected.length) return [];
  const sets = cardio
    ? Math.max(4, Math.min(24, Math.round(targetMinutes / 1.5)))
    : Math.max(3, Math.min(6, Math.round(Math.max(1, targetMinutes - 8) / (selected.length * 1.33))));
  return selected.map((exercise, index) => ({
    id: uid(), exerciseId: exercise.id, sets, targetType: cardio ? 'time' : 'reps',
    targetValue: cardio ? '30 שניות' : (focus === 'core' ? '10–15' : '8–12'),
    restSeconds: cardio ? 15 : (focus === 'legs' ? 75 : 60), sortOrder: index,
  }));
}
export function estimateWorkoutMinutes(day: WorkoutPlanDay): number {
  const totalSeconds = day.items.reduce((sum, item) => {
    const workSeconds = item.targetType === 'time' ? (Number.parseInt(item.targetValue, 10) || 30) : 40;
    return sum + item.sets * workSeconds + Math.max(0, item.sets - 1) * item.restSeconds;
  }, 0) + (day.items.length ? 240 + day.items.length * 45 : 0); // warm-up, transitions, and equipment setup estimate
  return Math.max(5, Math.round(totalSeconds / 60));
}
export function generateWorkoutPlan(preferences: WorkoutPlanPreferences): WorkoutPlan {
  const focusOptions: WorkoutFocus[] = preferences.focuses.length ? preferences.focuses : ['full_body'];
  const midpoint = Math.round((preferences.durationMinMinutes + preferences.durationMaxMinutes) / 2);
  const days: WorkoutPlanDay[] = Array.from({ length: preferences.daysPerWeek }, (_, index) => {
    const focus = focusOptions[index % focusOptions.length];
    const items = makeItems(focus, dayExercises(focus, preferences, index), midpoint, index);
    return { id: uid(), dayNumber: index + 1, focus, items };
  });
  const stamp = new Date().toISOString();
  const name = focusOptions.map((focus) => FOCUS_LABELS[focus]).join(' · ');
  return { id: uid(), userId: preferences.userId, name: `תוכנית ${name}`,
    durationWeeks: preferences.durationWeeks, daysPerWeek: preferences.daysPerWeek, focuses: focusOptions,
    durationMinMinutes: preferences.durationMinMinutes, durationMaxMinutes: preferences.durationMaxMinutes,
    createdAt: stamp, updatedAt: stamp, days };
}
