import { FoodReport, UserFoodMemory, UserProfile, WeightEntry, WorkoutPlan } from '../../types';
import { getSupabaseClient } from '../supabase/client';
import { AppBackupData, IDataRepository, ReportFilterOptions } from './IDataRepository';

/** Cloud persistence is proxied through the application server; database credentials never reach the browser. */
export class NeonAdapter implements IDataRepository {
  static async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const client = new NeonAdapter();
      await client.request('health');
      return { ok: true, message: 'החיבור ל־Neon תקין.' };
    } catch (error: any) {
      return { ok: false, message: error?.message || 'לא ניתן להתחבר למסד הנתונים Neon.' };
    }
  }

  private async request<T>(action: string, args: Record<string, unknown> = {}): Promise<T> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('יש להתחבר לחשבון כדי להשתמש בשמירה בענן.');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('יש להתחבר לחשבון כדי להשתמש בשמירה בענן.');
    const response = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action, args }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'שגיאה בשמירת הנתונים בענן');
    return result.data as T;
  }

  getProfile(_userId?: string) { return this.request<UserProfile | null>('getProfile'); }
  saveProfile(profile: UserProfile) { return this.request<UserProfile>('saveProfile', { profile }); }
  async updateProfile(userId: string, partial: Partial<UserProfile>) {
    const current = await this.getProfile(userId);
    const profile = { ...(current || { userId, calorieTargetKcal: 2000, proteinTargetG: 120, carbTargetG: 186, fatTargetG: 55, fiberTargetG: 23, waterTargetMl: 2500, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem', locale: 'he-IL', onboardingCompleted: false }), ...partial } as UserProfile;
    return this.saveProfile(profile);
  }

  getReports(_userId?: string, filters?: ReportFilterOptions) {
    if (!filters?.date) return this.request<FoodReport[]>('getReports', { filters });
    const [year, month, day] = filters.date.split('-').map(Number);
    const fromDate = new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
    const toDate = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
    const { date: _date, ...rest } = filters;
    return this.request<FoodReport[]>('getReports', { filters: { ...rest, fromDate, toDate } });
  }
  getReportById(reportId: string) { return this.request<FoodReport | null>('getReportById', { reportId }); }
  createReport(report: FoodReport) { return this.request<FoodReport>('createReport', { report }); }
  updateReport(report: FoodReport) { return this.request<FoodReport>('updateReport', { report }); }
  deleteReport(reportId: string) { return this.request<boolean>('deleteReport', { reportId }); }

  getWeightEntries(_userId?: string) { return this.request<WeightEntry[]>('getWeightEntries'); }
  addWeightEntry(entry: WeightEntry) { return this.request<WeightEntry>('addWeightEntry', { entry }); }
  deleteWeightEntry(id: string) { return this.request<boolean>('deleteWeightEntry', { id }); }

  getFoodMemories(_userId?: string) { return this.request<UserFoodMemory[]>('getFoodMemories'); }
  saveFoodMemory(memory: UserFoodMemory) { return this.request<UserFoodMemory>('saveFoodMemory', { memory }); }
  updateFoodMemory(memory: UserFoodMemory) { return this.saveFoodMemory(memory); }
  deleteFoodMemory(id: string) { return this.request<boolean>('deleteFoodMemory', { id }); }

  getWaterEntries(_userId?: string) { return this.request<Record<string, number>>('getWaterEntries'); }
  getWaterByDate(date: string, _userId?: string) { return this.request<number>('getWaterByDate', { date }); }
  setWater(date: string, amountMl: number, _userId?: string) { return this.request<number>('setWater', { date, amountMl }); }
  addWater(date: string, amountMl: number, _userId?: string) { return this.request<number>('addWater', { date, amountMl }); }

  getWorkoutPlans(_userId?: string) { return this.request<WorkoutPlan[]>('getWorkoutPlans'); }
  saveWorkoutPlan(plan: WorkoutPlan) { return this.request<WorkoutPlan>('saveWorkoutPlan', { plan }); }
  deleteWorkoutPlan(planId: string) { return this.request<boolean>('deleteWorkoutPlan', { planId }); }

  exportAllData(_userId?: string) { return this.request<AppBackupData>('exportAllData'); }
  importAllData(data: Partial<AppBackupData>) { return this.request<boolean>('importAllData', { data }); }
  clearAllData(_userId?: string) { return this.request<boolean>('clearAllData'); }
}
