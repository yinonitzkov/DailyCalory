import {
  UserProfile,
  FoodReport,
  FoodComponent,
  WeightEntry,
  UserFoodMemory,
  WorkoutPlan,
} from '../../types';
import {
  IDataRepository,
  AppBackupData,
  ReportFilterOptions,
} from './IDataRepository';
import { getSupabaseClient } from '../supabase/client';

export class LegacySupabaseMigrationSource implements IDataRepository {
  async testSourceConnection(): Promise<void> {
    const client = this.getClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) throw new Error('יש להתחבר לחשבון Supabase הישן לפני העברת הנתונים.');
    const { error } = await client.from('user_profiles').select('user_id').eq('user_id', user.id).limit(1);
    if (error) throw new Error(`לא ניתן לקרוא את מסד Supabase הישן: ${error.message}`);
  }

  private getClient() {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error(
        'Supabase client is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      );
    }
    return client;
  }

  /**
   * Resolves the active user ID from the Supabase session, or falls back to the provided userId or 'local-user-1'
   */
  private async resolveUserId(fallbackUserId?: string): Promise<string> {
    try {
      const supabase = this.getClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        return data.user.id;
      }
    } catch {
      // Fallback
    }
    return fallbackUserId || 'local-user-1';
  }

  // --- Profile & Targets ---
  async getProfile(userId?: string): Promise<UserProfile | null> {
    const resolvedId = await this.resolveUserId(userId);
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', resolvedId)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseAdapter] getProfile error:', error);
      return null;
    }
    if (!data) return null;

    return {
      userId: data.user_id,
      birthDate: data.birth_date,
      biologicalSex: data.biological_sex,
      heightCm: Number(data.height_cm),
      currentWeightKg: Number(data.current_weight_kg),
      targetWeightKg: Number(data.target_weight_kg),
      activityLevel: data.activity_level,
      calorieTargetKcal: Number(data.calorie_target_kcal),
      proteinTargetG: Number(data.protein_target_g),
      carbTargetG: Number(data.carb_target_g),
      fatTargetG: Number(data.fat_target_g),
      fiberTargetG: Number(data.fiber_target_g),
      waterTargetMl: Number(data.water_target_ml),
      timezone: data.timezone,
      locale: data.locale,
      onboardingCompleted: Boolean(data.onboarding_completed),
    };
  }

  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    const resolvedId = await this.resolveUserId(profile.userId);
    const supabase = this.getClient();
    const row = {
      user_id: resolvedId,
      birth_date: profile.birthDate || null,
      biological_sex: profile.biologicalSex || null,
      height_cm: profile.heightCm || null,
      current_weight_kg: profile.currentWeightKg || null,
      target_weight_kg: profile.targetWeightKg || null,
      activity_level: profile.activityLevel || null,
      calorie_target_kcal: profile.calorieTargetKcal,
      protein_target_g: profile.proteinTargetG,
      carb_target_g: profile.carbTargetG,
      fat_target_g: profile.fatTargetG,
      fiber_target_g: profile.fiberTargetG,
      water_target_ml: profile.waterTargetMl,
      timezone: profile.timezone,
      locale: profile.locale,
      onboarding_completed: profile.onboardingCompleted,
    };

    const { error } = await supabase.from('user_profiles').upsert(row);
    if (error) {
      console.error('[SupabaseAdapter] saveProfile error:', error);
      throw error;
    }
    return { ...profile, userId: resolvedId };
  }

  async updateProfile(userId?: string, partial?: Partial<UserProfile>): Promise<UserProfile> {
    const resolvedId = await this.resolveUserId(userId);
    const current = await this.getProfile(resolvedId);
    const updated: UserProfile = {
      ...(current || {
        userId: resolvedId,
        calorieTargetKcal: 2000,
        proteinTargetG: 120,
        carbTargetG: 186,
        fatTargetG: 55,
        fiberTargetG: 23,
        waterTargetMl: 2500,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem',
        locale: 'he-IL',
        onboardingCompleted: false,
      }),
      ...(partial || {}),
    };
    await this.saveProfile(updated);
    return updated;
  }

  // --- Food Reports ---
  async getReports(userId?: string, filters?: ReportFilterOptions): Promise<FoodReport[]> {
    const resolvedId = await this.resolveUserId(userId);
    const supabase = this.getClient();
    let query = supabase
      .from('food_reports')
      .select(`
        *,
        food_components (*)
      `)
      .eq('user_id', resolvedId)
      .order('recorded_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.neq('status', 'deleted');
    }

    if (filters?.date) {
      // Calculate start and end of that local date accounting for client timezone
      const [year, month, day] = filters.date.split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

      query = query
        .gte('recorded_at', startOfDay.toISOString())
        .lte('recorded_at', endOfDay.toISOString());
    }

    const { data, error } = await query;
    if (error) {
      console.error('[SupabaseAdapter] getReports error:', error);
      return [];
    }

    return (data || []).map((row) => this.mapReportFromDb(row));
  }

  async getReportById(reportId: string): Promise<FoodReport | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('food_reports')
      .select(`
        *,
        food_components (*)
      `)
      .eq('id', reportId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return this.mapReportFromDb(data);
  }

  async createReport(report: FoodReport): Promise<FoodReport> {
    const resolvedId = await this.resolveUserId(report.userId);
    const supabase = this.getClient();

    // 1. Insert/Upsert report header
    const reportRow = {
      id: report.id,
      user_id: resolvedId,
      client_request_id: report.clientRequestId || null,
      input_type: report.inputType,
      original_text: report.originalText || null,
      image_url: report.imageUrl || null,
      status: report.status,
      confidence: report.confidence,
      calories: report.calories,
      protein_g: report.proteinG,
      carbs_g: report.carbsG,
      fat_g: report.fatG,
      fiber_g: report.fiberG,
      recorded_at: report.recordedAt,
    };

    const { error: reportError } = await supabase.from('food_reports').upsert(reportRow);
    if (reportError) {
      console.error('[SupabaseAdapter] createReport header error:', reportError);
      throw reportError;
    }

    // 2. Clean existing components for this report and insert new
    await supabase.from('food_components').delete().eq('report_id', report.id);

    if (report.components && report.components.length > 0) {
      const compRows = report.components.map((c) => ({
        id: c.id,
        report_id: report.id,
        name: c.name,
        quantity_value: c.quantityValue,
        quantity_unit: c.quantityUnit,
        calories: c.calories,
        protein_g: c.proteinG,
        carbs_g: c.carbsG,
        fat_g: c.fatG,
        fiber_g: c.fiberG,
        confidence: c.confidence,
        is_estimated: Boolean(c.isEstimated),
      }));

      const { error: compError } = await supabase.from('food_components').insert(compRows);
      if (compError) {
        console.error('[SupabaseAdapter] createReport components error:', compError);
      }
    }

    return { ...report, userId: resolvedId };
  }

  async updateReport(report: FoodReport): Promise<FoodReport> {
    const resolvedId = await this.resolveUserId(report.userId);
    const supabase = this.getClient();

    // 1. Update report
    const reportRow = {
      user_id: resolvedId,
      input_type: report.inputType,
      original_text: report.originalText || null,
      image_url: report.imageUrl || null,
      status: report.status,
      confidence: report.confidence,
      calories: report.calories,
      protein_g: report.proteinG,
      carbs_g: report.carbsG,
      fat_g: report.fatG,
      fiber_g: report.fiberG,
      recorded_at: report.recordedAt,
    };

    await supabase.from('food_reports').update(reportRow).eq('id', report.id);

    // 2. Refresh components: delete old ones and insert new
    await supabase.from('food_components').delete().eq('report_id', report.id);

    if (report.components && report.components.length > 0) {
      const compRows = report.components.map((c) => ({
        id: c.id,
        report_id: report.id,
        name: c.name,
        quantity_value: c.quantityValue,
        quantity_unit: c.quantityUnit,
        calories: c.calories,
        protein_g: c.proteinG,
        carbs_g: c.carbsG,
        fat_g: c.fatG,
        fiber_g: c.fiberG,
        confidence: c.confidence,
        is_estimated: Boolean(c.isEstimated),
      }));
      await supabase.from('food_components').insert(compRows);
    }

    return { ...report, userId: resolvedId };
  }

  async deleteReport(reportId: string): Promise<boolean> {
    const supabase = this.getClient();
    // Soft delete by updating status to 'deleted'
    const { error } = await supabase
      .from('food_reports')
      .update({ status: 'deleted' })
      .eq('id', reportId);

    if (error) {
      console.error('[SupabaseAdapter] deleteReport error:', error);
      return false;
    }
    return true;
  }

  // --- Weight Tracking ---
  async getWeightEntries(userId?: string): Promise<WeightEntry[]> {
    const resolvedId = await this.resolveUserId(userId);
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('user_id', resolvedId)
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('[SupabaseAdapter] getWeightEntries error:', error);
      return [];
    }

    return (data || []).map((w) => ({
      id: w.id,
      userId: w.user_id,
      weightKg: Number(w.weight_kg),
      recordedAt: w.recorded_at,
    }));
  }

  async addWeightEntry(entry: WeightEntry): Promise<WeightEntry> {
    const resolvedId = await this.resolveUserId(entry.userId);
    const supabase = this.getClient();
    const row = {
      id: entry.id,
      user_id: resolvedId,
      weight_kg: entry.weightKg,
      recorded_at: entry.recordedAt,
    };

    const { error } = await supabase.from('weight_entries').upsert(row);
    if (error) {
      console.error('[SupabaseAdapter] addWeightEntry error:', error);
      throw error;
    }
    return { ...entry, userId: resolvedId };
  }

  async deleteWeightEntry(id: string): Promise<boolean> {
    const supabase = this.getClient();
    const { error } = await supabase.from('weight_entries').delete().eq('id', id);
    return !error;
  }

  // --- Personalized Food Memories ---
  async getFoodMemories(userId?: string): Promise<UserFoodMemory[]> {
    const resolvedId = await this.resolveUserId(userId);
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('user_food_memories')
      .select('*')
      .eq('user_id', resolvedId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SupabaseAdapter] getFoodMemories error:', error);
      return [];
    }

    return (data || []).map((m) => ({
      id: m.id,
      userId: m.user_id,
      triggerName: m.trigger_name,
      resolvedDescription: m.resolved_description,
      notes: m.notes || undefined,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));
  }

  async saveFoodMemory(memory: UserFoodMemory): Promise<UserFoodMemory> {
    const resolvedId = await this.resolveUserId(memory.userId);
    const supabase = this.getClient();
    const row = {
      id: memory.id,
      user_id: resolvedId,
      trigger_name: memory.triggerName,
      resolved_description: memory.resolvedDescription,
      notes: memory.notes || null,
    };

    const { error } = await supabase.from('user_food_memories').upsert(row);
    if (error) {
      console.error('[SupabaseAdapter] saveFoodMemory error:', error);
      throw error;
    }
    return { ...memory, userId: resolvedId };
  }

  async updateFoodMemory(memory: UserFoodMemory): Promise<UserFoodMemory> {
    return this.saveFoodMemory(memory);
  }

  async deleteFoodMemory(id: string): Promise<boolean> {
    const supabase = this.getClient();
    const { error } = await supabase.from('user_food_memories').delete().eq('id', id);
    return !error;
  }

  // --- Water Tracking ---
  async getWaterEntries(userId?: string): Promise<Record<string, number>> {
    const resolvedId = await this.resolveUserId(userId);
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('water_entries')
      .select('*')
      .eq('user_id', resolvedId);

    if (error) {
      console.error('[SupabaseAdapter] getWaterEntries error:', error);
      return {};
    }

    const result: Record<string, number> = {};
    (data || []).forEach((row) => {
      result[row.date_key] = Number(row.amount_ml);
    });
    return result;
  }

  async getWaterByDate(date: string, userId?: string): Promise<number> {
    const resolvedId = await this.resolveUserId(userId);
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('water_entries')
      .select('amount_ml')
      .eq('user_id', resolvedId)
      .eq('date_key', date)
      .maybeSingle();

    if (error || !data) return 0;
    return Number(data.amount_ml);
  }

  async setWater(date: string, amountMl: number, userId?: string): Promise<number> {
    const resolvedId = await this.resolveUserId(userId);
    const supabase = this.getClient();
    const safeAmount = Math.max(0, amountMl);
    const row = {
      id: `${resolvedId}_${date}`,
      user_id: resolvedId,
      date_key: date,
      amount_ml: safeAmount,
    };

    const { error } = await supabase.from('water_entries').upsert(row);
    if (error) {
      console.error('[SupabaseAdapter] setWater error:', error);
    }
    return safeAmount;
  }

  async addWater(date: string, amountMl: number, userId?: string): Promise<number> {
    const resolvedId = await this.resolveUserId(userId);
    const current = await this.getWaterByDate(date, resolvedId);
    const next = Math.max(0, current + amountMl);
    return this.setWater(date, next, resolvedId);
  }

  // --- Workout Plans ---
  async getWorkoutPlans(userId?: string): Promise<WorkoutPlan[]> {
    const resolvedId = await this.resolveUserId(userId);
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*, workout_plan_days(*, workout_plan_items(*))')
      .eq('user_id', resolvedId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      durationWeeks: row.duration_weeks,
      daysPerWeek: row.days_per_week,
      focuses: row.focuses || [],
      durationMinMinutes: row.duration_min_minutes,
      durationMaxMinutes: row.duration_max_minutes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      days: (row.workout_plan_days || []).sort((a: any, b: any) => a.day_number - b.day_number).map((day: any) => ({
        id: day.id,
        dayNumber: day.day_number,
        focus: day.focus,
        items: (day.workout_plan_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((item: any) => ({
          id: item.id,
          exerciseId: item.exercise_id,
          sets: item.sets,
          targetType: item.target_type,
          targetValue: item.target_value,
          restSeconds: item.rest_seconds,
          sortOrder: item.sort_order,
        })),
      })),
    }));
  }

  async saveWorkoutPlan(plan: WorkoutPlan): Promise<WorkoutPlan> {
    const resolvedId = await this.resolveUserId(plan.userId);
    const supabase = this.getClient();
    const { error: planError } = await supabase.from('workout_plans').upsert({
      id: plan.id,
      user_id: resolvedId,
      name: plan.name,
      duration_weeks: plan.durationWeeks,
      days_per_week: plan.daysPerWeek,
      focuses: plan.focuses,
      duration_min_minutes: plan.durationMinMinutes,
      duration_max_minutes: plan.durationMaxMinutes,
      updated_at: plan.updatedAt,
    });
    if (planError) throw planError;

    const { data: previousDays, error: daysReadError } = await supabase.from('workout_plan_days').select('id').eq('plan_id', plan.id);
    if (daysReadError) throw daysReadError;
    const nextDayIds = new Set(plan.days.map((day) => day.id));
    for (const day of plan.days) {
      const { error: dayError } = await supabase.from('workout_plan_days').upsert({
        id: day.id,
        plan_id: plan.id,
        day_number: day.dayNumber,
        focus: day.focus,
      });
      if (dayError) throw dayError;
      const { data: previousItems, error: itemsReadError } = await supabase.from('workout_plan_items').select('id').eq('day_id', day.id);
      if (itemsReadError) throw itemsReadError;
      if (day.items.length) {
        const { error: itemsError } = await supabase.from('workout_plan_items').upsert(day.items.map((item) => ({
          id: item.id,
          day_id: day.id,
          exercise_id: item.exerciseId,
          sets: item.sets,
          target_type: item.targetType,
          target_value: item.targetValue,
          rest_seconds: item.restSeconds,
          sort_order: item.sortOrder,
        })));
        if (itemsError) throw itemsError;
      }
      const nextItemIds = new Set(day.items.map((item) => item.id));
      for (const oldItem of previousItems || []) {
        if (!nextItemIds.has(oldItem.id)) {
          const { error } = await supabase.from('workout_plan_items').delete().eq('id', oldItem.id);
          if (error) throw error;
        }
      }
    }
    for (const oldDay of previousDays || []) {
      if (!nextDayIds.has(oldDay.id)) {
        const { error } = await supabase.from('workout_plan_days').delete().eq('id', oldDay.id);
        if (error) throw error;
      }
    }
    return { ...plan, userId: resolvedId };
  }

  async deleteWorkoutPlan(planId: string): Promise<boolean> {
    const supabase = this.getClient();
    const resolvedId = await this.resolveUserId();
    const { error } = await supabase.from('workout_plans').delete().eq('id', planId).eq('user_id', resolvedId);
    return !error;
  }

  // --- Backup, Export, Import & Reset ---
  async exportAllData(userId?: string): Promise<AppBackupData> {
    const resolvedId = await this.resolveUserId(userId);
    const [userProfile, foodReports, weightEntries, foodMemories, waterEntries] = await Promise.all([
      this.getProfile(resolvedId),
      this.getReports(resolvedId),
      this.getWeightEntries(resolvedId),
      this.getFoodMemories(resolvedId),
      this.getWaterEntries(resolvedId),
    ]);
    let workoutPlans: WorkoutPlan[] = [];
    try {
      workoutPlans = await this.getWorkoutPlans(resolvedId);
    } catch (error: any) {
      // Existing installations may predate the workout migration.
      if (error?.code !== 'PGRST205' && error?.code !== '42P01') throw error;
    }

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
        await this.saveProfile(data.userProfile);
      }
      if (Array.isArray(data.foodReports)) {
        for (const report of data.foodReports) {
          await this.createReport(report);
        }
      }
      if (Array.isArray(data.weightEntries)) {
        for (const entry of data.weightEntries) {
          await this.addWeightEntry(entry);
        }
      }
      if (Array.isArray(data.foodMemories)) {
        for (const mem of data.foodMemories) {
          await this.saveFoodMemory(mem);
        }
      }
      if (data.waterEntries) {
        for (const [date, ml] of Object.entries(data.waterEntries)) {
          await this.setWater(date, ml);
        }
      }
      if (Array.isArray(data.workoutPlans)) {
        for (const plan of data.workoutPlans) await this.saveWorkoutPlan(plan);
      }
      return true;
    } catch (err) {
      console.error('[SupabaseAdapter] importAllData failed:', err);
      return false;
    }
  }

  async clearAllData(userId?: string): Promise<boolean> {
    const resolvedId = await this.resolveUserId(userId);
    const supabase = this.getClient();
    try {
      await Promise.all([
        supabase.from('user_profiles').delete().eq('user_id', resolvedId),
        supabase.from('food_reports').delete().eq('user_id', resolvedId),
        supabase.from('weight_entries').delete().eq('user_id', resolvedId),
        supabase.from('user_food_memories').delete().eq('user_id', resolvedId),
        supabase.from('water_entries').delete().eq('user_id', resolvedId),
        supabase.from('workout_plans').delete().eq('user_id', resolvedId),
      ]);
      return true;
    } catch (err) {
      console.error('[SupabaseAdapter] clearAllData failed:', err);
      return false;
    }
  }

  // --- Internal mapping helpers ---
  private mapReportFromDb(row: any): FoodReport {
    const rawComponents = Array.isArray(row.food_components) ? row.food_components : [];
    const components: FoodComponent[] = rawComponents.map((c: any) => ({
      id: c.id,
      reportId: c.report_id,
      name: c.name,
      quantityValue: Number(c.quantity_value),
      quantityUnit: c.quantity_unit,
      calories: Number(c.calories),
      proteinG: Number(c.protein_g),
      carbsG: Number(c.carbs_g),
      fatG: Number(c.fat_g),
      fiberG: Number(c.fiber_g),
      confidence: c.confidence || 'medium',
      isEstimated: Boolean(c.is_estimated),
    }));

    return {
      id: row.id,
      userId: row.user_id,
      clientRequestId: row.client_request_id || undefined,
      inputType: row.input_type,
      originalText: row.original_text || undefined,
      imageUrl: row.image_url || undefined,
      status: row.status,
      confidence: row.confidence,
      calories: Number(row.calories),
      proteinG: Number(row.protein_g),
      carbsG: Number(row.carbs_g),
      fatG: Number(row.fat_g),
      fiberG: Number(row.fiber_g),
      recordedAt: row.recorded_at,
      components,
    };
  }
}
