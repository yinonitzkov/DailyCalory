import { IDataRepository } from './IDataRepository';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { SupabaseAdapter } from './SupabaseAdapter';
import { isSupabaseConfigured, testSupabaseConnection } from '../supabase/client';

export * from './IDataRepository';
export * from './LocalStorageAdapter';
export * from './SupabaseAdapter';

const STORAGE_PREF_KEY = 'calories_storage_provider_preference';

// Singleton instance
let currentRepository: IDataRepository | null = null;
let currentStorageType: 'local' | 'supabase' = 'local';

export function getActiveStorageType(): 'local' | 'supabase' {
  if (typeof window !== 'undefined') {
    const savedPref = localStorage.getItem(STORAGE_PREF_KEY);
    if (savedPref === 'supabase' && isSupabaseConfigured()) {
      return 'supabase';
    }
    if (savedPref === 'local') {
      return 'local';
    }
  }
  return isSupabaseConfigured() ? 'supabase' : 'local';
}

export function getDataRepository(forceType?: 'local' | 'supabase'): IDataRepository {
  if (forceType === 'local') {
    return new LocalStorageAdapter();
  }
  if (forceType === 'supabase') {
    return new SupabaseAdapter();
  }

  const activeType = getActiveStorageType();
  if (!currentRepository || currentStorageType !== activeType) {
    currentStorageType = activeType;
    if (activeType === 'supabase') {
      currentRepository = new SupabaseAdapter();
    } else {
      currentRepository = new LocalStorageAdapter();
    }
  }
  return currentRepository;
}

export function switchStorageType(type: 'local' | 'supabase'): IDataRepository {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_PREF_KEY, type);
  }
  currentStorageType = type;
  if (type === 'supabase') {
    currentRepository = new SupabaseAdapter();
  } else {
    currentRepository = new LocalStorageAdapter();
  }
  return currentRepository;
}

export function setDataRepository(repo: IDataRepository): void {
  currentRepository = repo;
}

/**
 * Step 4/5 Migration Engine:
 * Safely copies all offline local data into Supabase Cloud
 */
export async function migrateLocalToCloud(
  targetUserId?: string,
  onProgress?: (step: string) => void
): Promise<{
  success: boolean;
  message: string;
  count: {
    reports: number;
    weights: number;
    memories: number;
    water: number;
  };
}> {
  const localRepo = new LocalStorageAdapter();
  const cloudRepo = new SupabaseAdapter();

  try {
    // 1. Verify cloud connection first
    onProgress?.('בודק קישוריות ל-Supabase...');
    const testResult = await testSupabaseConnection();
    if (!testResult.ok) {
      return {
        success: false,
        message: testResult.message,
        count: { reports: 0, weights: 0, memories: 0, water: 0 },
      };
    }

    // 2. Export local data
    onProgress?.('קורא נתונים מקומיים...');
    const localData = await localRepo.exportAllData();

    // 3. Migrate profile
    if (localData.userProfile) {
      onProgress?.('מעלה פרופיל משתמש ויעדים...');
      const profileToSave = targetUserId
        ? { ...localData.userProfile, userId: targetUserId }
        : localData.userProfile;
      await cloudRepo.saveProfile(profileToSave);
    }

    // 4. Migrate food reports & components
    let reportsCount = 0;
    if (Array.isArray(localData.foodReports) && localData.foodReports.length > 0) {
      onProgress?.(`מעלה ${localData.foodReports.length} דיווחים ביומן...`);
      for (const report of localData.foodReports) {
        const reportToSave = targetUserId ? { ...report, userId: targetUserId } : report;
        await cloudRepo.createReport(reportToSave);
        reportsCount++;
      }
    }

    // 5. Migrate weights
    let weightsCount = 0;
    if (Array.isArray(localData.weightEntries) && localData.weightEntries.length > 0) {
      onProgress?.(`מעלה ${localData.weightEntries.length} שקילות...`);
      for (const w of localData.weightEntries) {
        const weightToSave = targetUserId ? { ...w, userId: targetUserId } : w;
        await cloudRepo.addWeightEntry(weightToSave);
        weightsCount++;
      }
    }

    // 6. Migrate food memories
    let memoriesCount = 0;
    if (Array.isArray(localData.foodMemories) && localData.foodMemories.length > 0) {
      onProgress?.(`מעלה ${localData.foodMemories.length} הגדרות זיכרון מותאם...`);
      for (const m of localData.foodMemories) {
        const memToSave = targetUserId ? { ...m, userId: targetUserId } : m;
        await cloudRepo.saveFoodMemory(memToSave);
        memoriesCount++;
      }
    }

    // 7. Migrate water entries
    let waterCount = 0;
    if (localData.waterEntries && Object.keys(localData.waterEntries).length > 0) {
      onProgress?.('מעלה רישומי שתיית מים...');
      for (const [date, ml] of Object.entries(localData.waterEntries)) {
        await cloudRepo.setWater(date, ml, targetUserId);
        waterCount++;
      }
    }

    onProgress?.('הסנכרון הושלם בהצלחה!');
    return {
      success: true,
      message: `סונכרנו בהצלחה: ${reportsCount} דיווחים, ${weightsCount} שקילות, ${memoriesCount} זיכרונות ו-${waterCount} ימי מים.`,
      count: {
        reports: reportsCount,
        weights: weightsCount,
        memories: memoriesCount,
        water: waterCount,
      },
    };
  } catch (err: any) {
    console.error('[migrateLocalToCloud] Migration failed:', err);
    return {
      success: false,
      message: `שגיאה בתהליך הסנכרון: ${err.message || String(err)}`,
      count: { reports: 0, weights: 0, memories: 0, water: 0 },
    };
  }
}
