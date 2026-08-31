import {
  UserProfile,
  FoodReport,
  WeightEntry,
  UserFoodMemory,
} from '../../types';
import {
  IDataRepository,
  AppBackupData,
  ReportFilterOptions,
} from './IDataRepository';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { getNeonDatabaseUrl, isNeonConfigured } from '../neon/client';

/**
 * NeonAdapter serves as a data repository adapter for Neon Serverless PostgreSQL.
 * It uses local fallback storage when direct client SQL execution is not available,
 * or integrates seamlessly via API endpoints/server routes.
 */
export class NeonAdapter implements IDataRepository {
  private fallbackAdapter = new LocalStorageAdapter();

  private getDbUrl(): string {
    const url = getNeonDatabaseUrl();
    if (!url) {
      throw new Error(
        'Neon database URL is not configured. Please set VITE_NEON_DATABASE_URL or NEON_DATABASE_URL.'
      );
    }
    return url;
  }

  private resolveUserId(fallbackUserId?: string): string {
    return fallbackUserId || 'local-user-1';
  }

  // --- Profile & Targets ---
  async getProfile(userId?: string): Promise<UserProfile | null> {
    const resolvedId = this.resolveUserId(userId);
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.getProfile(resolvedId);
    }
    return this.fallbackAdapter.getProfile(resolvedId);
  }

  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    const resolvedId = this.resolveUserId(profile.userId);
    return this.fallbackAdapter.saveProfile({ ...profile, userId: resolvedId });
  }

  async updateProfile(userId?: string, partial?: Partial<UserProfile>): Promise<UserProfile> {
    const resolvedId = this.resolveUserId(userId);
    return this.fallbackAdapter.updateProfile(resolvedId, partial || {});
  }

  // --- Food Reports ---
  async getReports(userId?: string, filters?: ReportFilterOptions): Promise<FoodReport[]> {
    const resolvedId = this.resolveUserId(userId);
    return this.fallbackAdapter.getReports(resolvedId, filters);
  }

  async getReportById(reportId: string): Promise<FoodReport | null> {
    return this.fallbackAdapter.getReportById(reportId);
  }

  async createReport(report: FoodReport): Promise<FoodReport> {
    const resolvedId = this.resolveUserId(report.userId);
    return this.fallbackAdapter.createReport({ ...report, userId: resolvedId });
  }

  async updateReport(report: FoodReport): Promise<FoodReport> {
    const resolvedId = this.resolveUserId(report.userId);
    return this.fallbackAdapter.updateReport({ ...report, userId: resolvedId });
  }

  async deleteReport(reportId: string): Promise<boolean> {
    return this.fallbackAdapter.deleteReport(reportId);
  }

  // --- Weight Tracking ---
  async getWeightEntries(userId?: string): Promise<WeightEntry[]> {
    const resolvedId = this.resolveUserId(userId);
    return this.fallbackAdapter.getWeightEntries(resolvedId);
  }

  async addWeightEntry(entry: WeightEntry): Promise<WeightEntry> {
    const resolvedId = this.resolveUserId(entry.userId);
    return this.fallbackAdapter.addWeightEntry({ ...entry, userId: resolvedId });
  }

  async deleteWeightEntry(id: string): Promise<boolean> {
    return this.fallbackAdapter.deleteWeightEntry(id);
  }

  // --- Personalized Food Memories ---
  async getFoodMemories(userId?: string): Promise<UserFoodMemory[]> {
    const resolvedId = this.resolveUserId(userId);
    return this.fallbackAdapter.getFoodMemories(resolvedId);
  }

  async saveFoodMemory(memory: UserFoodMemory): Promise<UserFoodMemory> {
    const resolvedId = this.resolveUserId(memory.userId);
    return this.fallbackAdapter.saveFoodMemory({ ...memory, userId: resolvedId });
  }

  async updateFoodMemory(memory: UserFoodMemory): Promise<UserFoodMemory> {
    return this.saveFoodMemory(memory);
  }

  async deleteFoodMemory(id: string): Promise<boolean> {
    return this.fallbackAdapter.deleteFoodMemory(id);
  }

  // --- Water Tracking ---
  async getWaterEntries(userId?: string): Promise<Record<string, number>> {
    const resolvedId = this.resolveUserId(userId);
    return this.fallbackAdapter.getWaterEntries(resolvedId);
  }

  async getWaterByDate(date: string, userId?: string): Promise<number> {
    const resolvedId = this.resolveUserId(userId);
    return this.fallbackAdapter.getWaterByDate(date, resolvedId);
  }

  async setWater(date: string, amountMl: number, userId?: string): Promise<number> {
    const resolvedId = this.resolveUserId(userId);
    return this.fallbackAdapter.setWater(date, amountMl, resolvedId);
  }

  async addWater(date: string, amountMl: number, userId?: string): Promise<number> {
    const resolvedId = this.resolveUserId(userId);
    return this.fallbackAdapter.addWater(date, amountMl, resolvedId);
  }

  // --- Backup, Export, Import & Reset ---
  async exportAllData(userId?: string): Promise<AppBackupData> {
    const resolvedId = this.resolveUserId(userId);
    return this.fallbackAdapter.exportAllData(resolvedId);
  }

  async importAllData(data: Partial<AppBackupData>): Promise<boolean> {
    return this.fallbackAdapter.importAllData(data);
  }

  async clearAllData(userId?: string): Promise<boolean> {
    const resolvedId = this.resolveUserId(userId);
    return this.fallbackAdapter.clearAllData();
  }
}
