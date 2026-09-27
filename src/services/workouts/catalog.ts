import seed from '../../data/fitness-video-seed.v1.json';
import { Exercise, WorkoutFocus } from '../../types';

type SeedExercise = {
  id: string; name_en: string; name_he: string; category: string; primary_muscles: string[];
  equipment: string[]; difficulty: string; movement_pattern: string;
  video?: { provider: string; youtube_video_id: string; start_seconds?: number; end_seconds?: number | null; source?: string };
};
const allSeedExercises = (seed as { library: { exercises: SeedExercise[] } }).library.exercises;
export const EXERCISES: Exercise[] = allSeedExercises.map((item) => ({
  id: item.id, nameHe: item.name_he, nameEn: item.name_en, category: item.category,
  primaryMuscles: item.primary_muscles || [], equipment: item.equipment || [],
  difficulty: item.difficulty, movementPattern: item.movement_pattern,
  videos: item.video ? [{ provider: 'youtube', youtubeVideoId: item.video.youtube_video_id,
    startSeconds: item.video.start_seconds || 0, endSeconds: item.video.end_seconds ?? null, source: item.video.source }] : [],
}));
export const VIDEO_WORKOUT_TEMPLATES = (seed as { workouts: { templates: unknown[] } }).workouts.templates;
export const FOCUS_LABELS: Record<WorkoutFocus, string> = {
  core: 'בטן וליבה', legs: 'רגליים', cardio: 'אירובי', full_body: 'משולב / גוף מלא',
};
export const DIFFICULTY_LABELS: Record<string, string> = { beginner: 'מתחיל', intermediate: 'בינוני', advanced: 'מתקדם' };
export const MOVEMENT_LABELS: Record<string, string> = {
  squat: 'סקוואט', 'single-leg-squat': 'סקוואט רגל אחת', lunge: 'מכרע', step: 'עלייה למדרגה',
  hinge: 'כפיפת ירך', 'hinge-power': 'כוח מתפרץ מהירך', 'hip-extension': 'פשיטת ירך',
  'knee-extension': 'פשיטת ברך', 'knee-flexion': 'כפיפת ברך', 'horizontal-push': 'דחיפה אופקית',
  'vertical-push': 'דחיפה אנכית', 'horizontal-pull': 'משיכה אופקית', 'vertical-pull': 'משיכה אנכית',
  'chest-adduction': 'קירוב חזה', 'shoulder-extension': 'פשיטת כתף', 'shoulder-flexion': 'כפיפת כתף',
  'shoulder-horizontal-abduction': 'הרחקת כתף אופקית', 'elbow-flexion': 'כפיפת מרפק', 'elbow-extension': 'פשיטת מרפק',
  'anti-extension': 'ייצוב נגד פשיטה', 'anti-lateral-flexion': 'ייצוב צדי', 'anti-rotation': 'ייצוב נגד סיבוב',
  rotation: 'סיבוב', 'trunk-flexion': 'כפיפת גו', 'trunk-flexion-rotation': 'כפיפה וסיבוב גו', conditioning: 'אירובי / התניה',
};
export const MUSCLE_LABELS: Record<string, string> = {
  quadriceps: 'ארבע ראשי', glutes: 'ישבן', hamstrings: 'המסטרינג', core: 'ליבה', abs: 'בטן', chest: 'חזה',
  triceps: 'יד אחורית', front_delts: 'כתף קדמית', upper_chest: 'חזה עליון', back: 'גב', lats: 'רחב גבי',
  biceps: 'יד קדמית', upper_back: 'גב עליון', rear_delts: 'כתף אחורית', delts: 'כתפיים',
  brachialis: 'זרוע', forearms: 'אמות', obliques: 'אלכסונים',
};
export const EQUIPMENT_LABELS: Record<string, string> = {
  bodyweight: 'משקל גוף', bodyweight_or_dumbbells: 'משקל גוף או משקולות', barbell: 'מוט', rack: 'כלוב',
  dumbbell: 'משקולת', dumbbells: 'משקולות', bench: 'ספסל', incline_bench: 'ספסל בשיפוע', cable_machine: 'כבל',
  rope: 'חבל', pullup_bar: 'מתח', leg_extension_machine: 'מכונת פשיטת ברכיים', leg_curl_machine: 'מכונת כפיפת ברכיים',
  leg_press_machine: 'מכונת לחיצת רגליים', chest_press_machine: 'מכונת לחיצת חזה', shoulder_press_machine: 'מכונת כתפיים',
  dip_bars: 'מקבילים', box_or_bench: 'ארגז או ספסל', preacher_bench: 'ספסל כומר', ez_bar_or_dumbbell: 'מוט EZ או משקולת',
};
export function exercisesForFocus(focus: WorkoutFocus): Exercise[] {
  if (focus === 'core') return EXERCISES.filter((exercise) => exercise.category === 'core');
  if (focus === 'legs') return EXERCISES.filter((exercise) => ['legs', 'glutes'].includes(exercise.category));
  if (focus === 'cardio') return EXERCISES.filter((exercise) => exercise.movementPattern === 'conditioning');
  return EXERCISES.filter((exercise) => ['full_body', 'legs', 'chest', 'back', 'shoulders', 'core'].includes(exercise.category));
}
