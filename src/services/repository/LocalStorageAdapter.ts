import {
  UserProfile,
  FoodReport,
  WeightEntry,
  UserFoodMemory,
  WorkoutPlan,
} from '../../types';
import {
  IDataRepository,
  AppBackupData,
  ReportFilterOptions,
} from './IDataRepository';
import { isSameDay, getLocalDateString } from '../../utils/dateUtils';

export const STORAGE_KEY_PROFILE = 'calories_user_profile_v1';
export const STORAGE_KEY_REPORTS = 'calories_food_reports_v1';
export const STORAGE_KEY_WEIGHTS = 'calories_weights_v1';
export const STORAGE_KEY_MEMORIES = 'calories_food_memories_v1';
export const STORAGE_KEY_WATER = 'calories_water_entries_v1';
export const STORAGE_KEY_WORKOUT_PLANS = 'calories_workout_plans_v1';

export const DEFAULT_PROFILE: UserProfile = {
  userId: 'local-user-1',
  birthDate: '1995-01-01',
  biologicalSex: 'female',
  heightCm: 168,
  currentWeightKg: 70,
  targetWeightKg: 64,
  activityLevel: 'moderate',
  calorieTargetKcal: 1650,
  proteinTargetG: 103,
  carbTargetG: 186,
  fatTargetG: 55,
  fiberTargetG: 23,
  waterTargetMl: 2500,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem',
  locale: 'he-IL',
  onboardingCompleted: false,
};

export const INITIAL_MEMORIES_SAMPLE: UserFoodMemory[] = [
  {
    id: 'mem-1',
    triggerName: 'קפה',
    resolvedDescription: 'קפה עם 60 מ״ל חלב 3%',
    notes: 'הגדרת קפה מותאמת אישית',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-2',
    triggerName: 'ביו',
    resolvedDescription: 'גביע יוגורט ביו 3% לא ממותק 200 גרם',
    notes: 'הגדרת יוגורט ביו קבועה',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_REPORTS_SAMPLE: FoodReport[] = [
  {
    id: 'report-sample-1',
    userId: 'local-user-1',
    clientRequestId: 'req-sample-1',
    inputType: 'text',
    originalText: 'שתי ביצים קשות, פרוסת לחם שיפון וכף טחינה גולמית',
    status: 'saved',
    confidence: 'high',
    calories: 320,
    proteinG: 18.5,
    carbsG: 17.0,
    fatG: 19.5,
    fiberG: 3.2,
    recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    components: [
      {
        id: 'comp-1',
        reportId: 'report-sample-1',
        name: 'ביצים קשות',
        quantityValue: 2,
        quantityUnit: 'יחידות',
        calories: 140,
        proteinG: 12.0,
        carbsG: 1.0,
        fatG: 10.0,
        fiberG: 0.0,
        confidence: 'high',
        isEstimated: false,
      },
      {
        id: 'comp-2',
        reportId: 'report-sample-1',
        name: 'לחם שיפון',
        quantityValue: 1,
        quantityUnit: 'פרוסה (30 גרם)',
        calories: 80,
        proteinG: 3.0,
        carbsG: 15.0,
        fatG: 0.5,
        fiberG: 2.2,
        confidence: 'high',
        isEstimated: false,
      },
      {
        id: 'comp-3',
        reportId: 'report-sample-1',
        name: 'טחינה גולמית',
        quantityValue: 1,
        quantityUnit: 'כף (15 גרם)',
        calories: 100,
        proteinG: 3.5,
        carbsG: 1.0,
        fatG: 9.0,
        fiberG: 1.0,
        confidence: 'high',
        isEstimated: false,
      },
    ],
  },
  {
    id: 'report-sample-2',
    userId: 'local-user-1',
    clientRequestId: 'req-sample-2',
    inputType: 'text',
    originalText: 'חזה עוף בגריל 150 גרם, אורז בסמטי 150 גרם וסלט ירקות קטן עם שמן זית',
    status: 'saved',
    confidence: 'high',
    calories: 520,
    proteinG: 48.0,
    carbsG: 44.0,
    fatG: 14.5,
    fiberG: 4.8,
    recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
    components: [
      {
        id: 'comp-4',
        reportId: 'report-sample-2',
        name: 'חזה עוף צלוי',
        quantityValue: 150,
        quantityUnit: 'גרם',
        calories: 248,
        proteinG: 46.5,
        carbsG: 0.0,
        fatG: 5.4,
        fiberG: 0.0,
        confidence: 'high',
        isEstimated: false,
      },
      {
        id: 'comp-5',
        reportId: 'report-sample-2',
        name: 'אורז בסמטי מבושל',
        quantityValue: 150,
        quantityUnit: 'גרם',
        calories: 195,
        proteinG: 4.1,
        carbsG: 42.0,
        fatG: 0.5,
        fiberG: 0.8,
        confidence: 'high',
        isEstimated: false,
      },
      {
        id: 'comp-6',
        reportId: 'report-sample-2',
        name: 'סלט ירקות עם כפית שמן זית',
        quantityValue: 150,
        quantityUnit: 'גרם',
        calories: 77,
        proteinG: 1.4,
        carbsG: 4.0,
        fatG: 6.0,
        fiberG: 2.0,
        confidence: 'high',
        isEstimated: true,
      },
    ],
  },
];

export const INITIAL_WEIGHTS_SAMPLE: WeightEntry[] = [
  {
    id: 'w-1',
    userId: 'local-user-1',
    weightKg: 70.4,
    recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'w-2',
    userId: 'local-user-1',
    weightKg: 70.0,
    recordedAt: new Date().toISOString(),
  },
];

export class LocalStorageAdapter implements IDataRepository {
  // Helper for safe localStorage reads
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (err) {
      console.warn(`[LocalStorageAdapter] Failed reading ${key}:`, err);
    }
    return defaultValue;
  }

  // Helper for safe localStorage writes
  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`[LocalStorageAdapter] Failed writing ${key}:`, err);
    }
  }

  // Synchronous initial snapshot for fast startup
  getInitialSnapshot(): {
    userProfile: UserProfile;
    foodReports: FoodReport[];
    weightEntries: WeightEntry[];
    foodMemories: UserFoodMemory[];
    waterEntries: Record<string, number>;
  } {
    const userProfile = this.getItem<UserProfile>(STORAGE_KEY_PROFILE, DEFAULT_PROFILE);
    const foodReports = this.getItem<FoodReport[]>(STORAGE_KEY_REPORTS, INITIAL_REPORTS_SAMPLE);
    const weightEntries = this.getItem<WeightEntry[]>(STORAGE_KEY_WEIGHTS, INITIAL_WEIGHTS_SAMPLE);
    const foodMemories = this.getItem<UserFoodMemory[]>(STORAGE_KEY_MEMORIES, INITIAL_MEMORIES_SAMPLE);
    const todayKey = getLocalDateString(new Date());
    const waterEntries = this.getItem<Record<string, number>>(STORAGE_KEY_WATER, { [todayKey]: 1250 });

    return {
      userProfile,
      foodReports,
      weightEntries,
      foodMemories,
      waterEntries,
    };
  }

  // --- Profile & Targets ---
  async getProfile(userId?: string): Promise<UserProfile | null> {
    const profile = this.getItem<UserProfile | null>(STORAGE_KEY_PROFILE, DEFAULT_PROFILE);
    if (profile && userId && profile.userId && profile.userId !== userId) {
      return null;
    }
    return profile;
  }

  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    this.setItem(STORAGE_KEY_PROFILE, profile);
    return profile;
  }

  async updateProfile(userId: string, partial: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getProfile(userId);
    const updated: UserProfile = {
      ...(current || {
        ...DEFAULT_PROFILE,
        userId,
      }),
      ...partial,
    };
    this.setItem(STORAGE_KEY_PROFILE, updated);
    return updated;
  }

  // --- Food Reports ---
  async getReports(userId?: string, filters?: ReportFilterOptions): Promise<FoodReport[]> {
    const reports = this.getItem<FoodReport[]>(STORAGE_KEY_REPORTS, INITIAL_REPORTS_SAMPLE);
    let filtered = reports;

    if (userId) {
      filtered = filtered.filter((r) => !r.userId || r.userId === userId);
    }

    if (filters?.status) {
      filtered = filtered.filter((r) => r.status === filters.status);
    } else {
      // By default filter out deleted
      filtered = filtered.filter((r) => r.status !== 'deleted');
    }

    if (filters?.date) {
      const targetDateObj = new Date(filters.date + 'T12:00:00');
      filtered = filtered.filter((r) => isSameDay(r.recordedAt, targetDateObj));
    }

    return filtered;
  }

  async getReportById(reportId: string): Promise<FoodReport | null> {
    const reports = this.getItem<FoodReport[]>(STORAGE_KEY_REPORTS, INITIAL_REPORTS_SAMPLE);
    return reports.find((r) => r.id === reportId) || null;
  }

  async createReport(report: FoodReport): Promise<FoodReport> {
    const reports = this.getItem<FoodReport[]>(STORAGE_KEY_REPORTS, INITIAL_REPORTS_SAMPLE);
    const updated = [report, ...reports];
    this.setItem(STORAGE_KEY_REPORTS, updated);
    return report;
  }

  async updateReport(report: FoodReport): Promise<FoodReport> {
    const reports = this.getItem<FoodReport[]>(STORAGE_KEY_REPORTS, INITIAL_REPORTS_SAMPLE);
    const updated = reports.map((r) => (r.id === report.id ? report : r));
    this.setItem(STORAGE_KEY_REPORTS, updated);
    return report;
  }

  async deleteReport(reportId: string): Promise<boolean> {
    const reports = this.getItem<FoodReport[]>(STORAGE_KEY_REPORTS, INITIAL_REPORTS_SAMPLE);
    const updated = reports.filter((r) => r.id !== reportId);
    this.setItem(STORAGE_KEY_REPORTS, updated);
    return true;
  }

  // --- Weight Tracking ---
  async getWeightEntries(userId?: string): Promise<WeightEntry[]> {
    const entries = this.getItem<WeightEntry[]>(STORAGE_KEY_WEIGHTS, INITIAL_WEIGHTS_SAMPLE);
    if (userId) {
      return entries.filter((e) => !e.userId || e.userId === userId);
    }
    return entries;
  }

  async addWeightEntry(entry: WeightEntry): Promise<WeightEntry> {
    const entries = this.getItem<WeightEntry[]>(STORAGE_KEY_WEIGHTS, INITIAL_WEIGHTS_SAMPLE);
    const updated = [entry, ...entries].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
    this.setItem(STORAGE_KEY_WEIGHTS, updated);
    return entry;
  }

  async deleteWeightEntry(id: string): Promise<boolean> {
    const entries = this.getItem<WeightEntry[]>(STORAGE_KEY_WEIGHTS, INITIAL_WEIGHTS_SAMPLE);
    const updated = entries.filter((e) => e.id !== id);
    this.setItem(STORAGE_KEY_WEIGHTS, updated);
    return true;
  }

  // --- Personalized Food Memories ---
  async getFoodMemories(userId?: string): Promise<UserFoodMemory[]> {
    const memories = this.getItem<UserFoodMemory[]>(STORAGE_KEY_MEMORIES, INITIAL_MEMORIES_SAMPLE);
    if (userId) {
      return memories.filter((m) => !m.userId || m.userId === userId);
    }
    return memories;
  }

  async saveFoodMemory(memory: UserFoodMemory): Promise<UserFoodMemory> {
    const memories = this.getItem<UserFoodMemory[]>(STORAGE_KEY_MEMORIES, INITIAL_MEMORIES_SAMPLE);
    const filtered = memories.filter(
      (m) => m.triggerName.toLowerCase() !== memory.triggerName.toLowerCase() && m.id !== memory.id
    );
    const updated = [memory, ...filtered];
    this.setItem(STORAGE_KEY_MEMORIES, updated);
    return memory;
  }

  async updateFoodMemory(memory: UserFoodMemory): Promise<UserFoodMemory> {
    const memories = this.getItem<UserFoodMemory[]>(STORAGE_KEY_MEMORIES, INITIAL_MEMORIES_SAMPLE);
    const updated = memories.map((m) => (m.id === memory.id ? memory : m));
    this.setItem(STORAGE_KEY_MEMORIES, updated);
    return memory;
  }

  async deleteFoodMemory(id: string): Promise<boolean> {
    const memories = this.getItem<UserFoodMemory[]>(STORAGE_KEY_MEMORIES, INITIAL_MEMORIES_SAMPLE);
    const updated = memories.filter((m) => m.id !== id);
    this.setItem(STORAGE_KEY_MEMORIES, updated);
    return true;
  }

  // --- Water Tracking ---
  async getWaterEntries(_userId?: string): Promise<Record<string, number>> {
    const todayKey = getLocalDateString(new Date());
    return this.getItem<Record<string, number>>(STORAGE_KEY_WATER, { [todayKey]: 1250 });
  }

  async getWaterByDate(date: string, _userId?: string): Promise<number> {
    const entries = await this.getWaterEntries();
    return entries[date] || 0;
  }

  async setWater(date: string, amountMl: number, _userId?: string): Promise<number> {
    const entries = await this.getWaterEntries();
    const updated = {
      ...entries,
      [date]: Math.max(0, amountMl),
    };
    this.setItem(STORAGE_KEY_WATER, updated);
    return updated[date];
  }

  async addWater(date: string, amountMl: number, _userId?: string): Promise<number> {
    const entries = await this.getWaterEntries();
    const current = entries[date] || 0;
    const next = Math.max(0, current + amountMl);
    const updated = {
      ...entries,
      [date]: next,
    };
    this.setItem(STORAGE_KEY_WATER, updated);
    return next;
  }

  async getWorkoutPlans(userId?: string): Promise<WorkoutPlan[]> {
    const plans = this.getItem<WorkoutPlan[]>(STORAGE_KEY_WORKOUT_PLANS, []);
    return userId ? plans.filter((plan) => plan.userId === userId) : plans;
  }

  async saveWorkoutPlan(plan: WorkoutPlan): Promise<WorkoutPlan> {
    const plans = this.getItem<WorkoutPlan[]>(STORAGE_KEY_WORKOUT_PLANS, []);
    this.setItem(STORAGE_KEY_WORKOUT_PLANS, [plan, ...plans.filter((item) => item.id !== plan.id)]);
    return plan;
  }

  async deleteWorkoutPlan(planId: string): Promise<boolean> {
    const plans = this.getItem<WorkoutPlan[]>(STORAGE_KEY_WORKOUT_PLANS, []);
    this.setItem(STORAGE_KEY_WORKOUT_PLANS, plans.filter((plan) => plan.id !== planId));
    return true;
  }

  // --- Backup, Import & Reset ---
  async exportAllData(userId?: string): Promise<AppBackupData> {
    const [userProfile, foodReports, weightEntries, foodMemories, waterEntries, workoutPlans] = await Promise.all([
      this.getProfile(userId),
      this.getReports(userId),
      this.getWeightEntries(userId),
      this.getFoodMemories(userId),
      this.getWaterEntries(),
      this.getWorkoutPlans(userId),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      version: '1.3',
      userProfile,
      foodReports,
      weightEntries,
      foodMemories,
      waterEntries,
      workoutPlans,
    };
  }

  async importAllData(data: Partial<AppBackupData>): Promise<boolean> {
    try {
      if (data.userProfile) {
        this.setItem(STORAGE_KEY_PROFILE, data.userProfile);
      }
      if (Array.isArray(data.foodReports)) {
        this.setItem(STORAGE_KEY_REPORTS, data.foodReports);
      }
      if (Array.isArray(data.weightEntries)) {
        this.setItem(STORAGE_KEY_WEIGHTS, data.weightEntries);
      }
      if (Array.isArray(data.foodMemories)) {
        this.setItem(STORAGE_KEY_MEMORIES, data.foodMemories);
      }
      if (data.waterEntries && typeof data.waterEntries === 'object') {
        this.setItem(STORAGE_KEY_WATER, data.waterEntries);
      }
      if (Array.isArray(data.workoutPlans)) {
        this.setItem(STORAGE_KEY_WORKOUT_PLANS, data.workoutPlans);
      }
      return true;
    } catch {
      return false;
    }
  }

  async clearAllData(): Promise<boolean> {
    try {
      localStorage.removeItem(STORAGE_KEY_PROFILE);
      localStorage.removeItem(STORAGE_KEY_REPORTS);
      localStorage.removeItem(STORAGE_KEY_WEIGHTS);
      localStorage.removeItem(STORAGE_KEY_MEMORIES);
      localStorage.removeItem(STORAGE_KEY_WATER);
      localStorage.removeItem(STORAGE_KEY_WORKOUT_PLANS);
      return true;
    } catch {
      return false;
    }
  }
}
