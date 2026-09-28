import { IDataRepository } from './IDataRepository';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { NeonAdapter } from './NeonAdapter';
import { LegacySupabaseMigrationSource } from './LegacySupabaseMigrationSource';
import { isSupabaseConfigured } from '../supabase/client';

export * from './IDataRepository';
export * from './LocalStorageAdapter';
export * from './NeonAdapter';

const STORAGE_PREF_KEY = 'calories_storage_provider_preference';
let currentRepository: IDataRepository | null = null;
let currentStorageType: 'local' | 'neon' = 'local';

export function getActiveStorageType(): 'local' | 'neon' {
  if (typeof window !== 'undefined') {
    const savedPref = localStorage.getItem(STORAGE_PREF_KEY);
    if ((savedPref === 'neon' || savedPref === 'supabase') && isSupabaseConfigured()) return 'neon';
    if (savedPref === 'local') return 'local';
  }
  return isSupabaseConfigured() ? 'neon' : 'local';
}

export function getDataRepository(forceType?: 'local' | 'neon'): IDataRepository {
  if (forceType === 'local') return new LocalStorageAdapter();
  if (forceType === 'neon') return new NeonAdapter();
  const activeType = getActiveStorageType();
  if (!currentRepository || currentStorageType !== activeType) {
    currentStorageType = activeType;
    currentRepository = activeType === 'neon' ? new NeonAdapter() : new LocalStorageAdapter();
  }
  return currentRepository;
}

export function switchStorageType(type: 'local' | 'neon'): IDataRepository {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_PREF_KEY, type);
  currentStorageType = type;
  currentRepository = type === 'neon' ? new NeonAdapter() : new LocalStorageAdapter();
  return currentRepository;
}

export function setDataRepository(repo: IDataRepository): void { currentRepository = repo; }

export async function migrateLocalToCloud(
  _targetUserId?: string,
  onProgress?: (step: string) => void
): Promise<{ success: boolean; message: string; count: { reports: number; weights: number; memories: number; water: number; plans: number } }> {
  const zero = { reports: 0, weights: 0, memories: 0, water: 0, plans: 0 };
  try {
    onProgress?.('בודק חיבור ל־Neon...');
    const connection = await NeonAdapter.testConnection();
    if (!connection.ok) return { success: false, message: connection.message, count: zero };
    onProgress?.('קורא את הנתונים המקומיים...');
    const localData = await new LocalStorageAdapter().exportAllData();
    onProgress?.('מעתיק פרופיל, יומן, שקילות, מים, זיכרונות ותוכניות אימון...');
    const imported = await new NeonAdapter().importAllData(localData);
    if (!imported) return { success: false, message: 'לא ניתן היה לייבא את הנתונים לענן.', count: zero };
    const count = {
      reports: localData.foodReports.length,
      weights: localData.weightEntries.length,
      memories: localData.foodMemories.length,
      water: Object.keys(localData.waterEntries).length,
      plans: localData.workoutPlans?.length || 0,
    };
    onProgress?.('הסנכרון ל־Neon הושלם.');
    return { success: true, message: `סונכרנו ${count.reports} דיווחים, ${count.weights} שקילות ו־${count.plans} תוכניות אימון.`, count };
  } catch (error: any) {
    console.error('[migrateLocalToCloud] Migration failed:', error);
    return { success: false, message: `שגיאה בסנכרון: ${error?.message || String(error)}`, count: zero };
  }
}

/** One-time bridge for existing Supabase database rows before retiring that database. */
export async function migrateExistingSupabaseDataToNeon(
  onProgress?: (step: string) => void
): Promise<{ success: boolean; message: string }> {
  try {
    onProgress?.('קורא נתונים ממסד Supabase הקיים...');
    const source = new LegacySupabaseMigrationSource();
    await source.testSourceConnection();
    const existingData = await source.exportAllData();
    onProgress?.('מעתיק את הנתונים ואת תוכניות האימון ל־Neon...');
    const success = await new NeonAdapter().importAllData(existingData);
    if (!success) return { success: false, message: 'הייבוא נכשל; מסד Supabase הישן נשאר ללא שינוי.' };
    const plans = existingData.workoutPlans?.length || 0;
    return { success: true, message: `הנתונים הועתקו ל־Neon, כולל ${plans} תוכניות אימון. אפשר לבדוק אותם באפליקציה לפני שמכבים את מסד Supabase הישן.` };
  } catch (error: any) {
    return { success: false, message: `ההעברה מ־Supabase נכשלה: ${error?.message || String(error)}` };
  }
}
