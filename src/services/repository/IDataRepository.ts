import {
  UserProfile,
  FoodReport,
  WeightEntry,
  UserFoodMemory,
} from '../../types';

export interface AppBackupData {
  exportedAt: string;
  version: string;
  userProfile: UserProfile | null;
  foodReports: FoodReport[];
  weightEntries: WeightEntry[];
  foodMemories: UserFoodMemory[];
  waterEntries: Record<string, number>;
}

export interface ReportFilterOptions {
  date?: string; // YYYY-MM-DD
  fromDate?: string;
  toDate?: string;
  status?: string;
}

/**
 * Common Data Repository Interface (Contract)
 * Decouples UI / Context layer from the underlying storage mechanism (LocalStorage, Supabase, etc.)
 */
export interface IDataRepository {
  // --- Profile & Targets ---
  getProfile(userId?: string): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<UserProfile>;
  updateProfile(userId: string, partial: Partial<UserProfile>): Promise<UserProfile>;

  // --- Food Reports & Nutrients ---
  getReports(userId?: string, filters?: ReportFilterOptions): Promise<FoodReport[]>;
  getReportById(reportId: string): Promise<FoodReport | null>;
  createReport(report: FoodReport): Promise<FoodReport>;
  updateReport(report: FoodReport): Promise<FoodReport>;
  deleteReport(reportId: string): Promise<boolean>;

  // --- Weight Tracking ---
  getWeightEntries(userId?: string): Promise<WeightEntry[]>;
  addWeightEntry(entry: WeightEntry): Promise<WeightEntry>;
  deleteWeightEntry(id: string): Promise<boolean>;

  // --- Personalized Food Memories ---
  getFoodMemories(userId?: string): Promise<UserFoodMemory[]>;
  saveFoodMemory(memory: UserFoodMemory): Promise<UserFoodMemory>;
  updateFoodMemory(memory: UserFoodMemory): Promise<UserFoodMemory>;
  deleteFoodMemory(id: string): Promise<boolean>;

  // --- Water Tracking ---
  getWaterEntries(userId?: string): Promise<Record<string, number>>;
  getWaterByDate(date: string, userId?: string): Promise<number>;
  setWater(date: string, amountMl: number, userId?: string): Promise<number>;
  addWater(date: string, amountMl: number, userId?: string): Promise<number>;

  // --- Backup, Import & Reset Operations ---
  exportAllData(userId?: string): Promise<AppBackupData>;
  importAllData(data: Partial<AppBackupData>, userId?: string): Promise<boolean>;
  clearAllData(userId?: string): Promise<boolean>;
}
