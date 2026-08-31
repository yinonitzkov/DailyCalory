import {
  UserProfile,
  FoodReport,
  FoodComponent,
  WeightEntry,
  UserFoodMemory,
} from '../../types';
import {
  IDataRepository,
  AppBackupData,
  ReportFilterOptions,
} from './IDataRepository';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { queryNeon, isNeonConfigured } from '../neon/client';

export class NeonAdapter implements IDataRepository {
  private fallbackAdapter = new LocalStorageAdapter();

  private resolveUserId(fallbackUserId?: string): string {
    return fallbackUserId || 'local-user-1';
  }

  private async executeQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return queryNeon<T>(sql, params);
  }

  // --- Profile & Targets ---
  async getProfile(userId?: string): Promise<UserProfile | null> {
    const resolvedId = this.resolveUserId(userId);
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.getProfile(resolvedId);
    }

    try {
      const sql = `SELECT * FROM user_profiles WHERE user_id = $1 LIMIT 1`;
      const rows = await this.executeQuery(sql, [resolvedId]);
      if (!rows || rows.length === 0) return null;

      const data = rows[0];
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
    } catch (err) {
      console.error('[NeonAdapter] getProfile error:', err);
      return this.fallbackAdapter.getProfile(resolvedId);
    }
  }

  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    const resolvedId = this.resolveUserId(profile.userId);
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.saveProfile({ ...profile, userId: resolvedId });
    }

    try {
      const sql = `
        INSERT INTO user_profiles (
          user_id, birth_date, biological_sex, height_cm, current_weight_kg,
          target_weight_kg, activity_level, calorie_target_kcal, protein_target_g,
          carb_target_g, fat_target_g, fiber_target_g, water_target_ml,
          timezone, locale, onboarding_completed
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
        ON CONFLICT (user_id) DO UPDATE SET
          birth_date = EXCLUDED.birth_date,
          biological_sex = EXCLUDED.biological_sex,
          height_cm = EXCLUDED.height_cm,
          current_weight_kg = EXCLUDED.current_weight_kg,
          target_weight_kg = EXCLUDED.target_weight_kg,
          activity_level = EXCLUDED.activity_level,
          calorie_target_kcal = EXCLUDED.calorie_target_kcal,
          protein_target_g = EXCLUDED.protein_target_g,
          carb_target_g = EXCLUDED.carb_target_g,
          fat_target_g = EXCLUDED.fat_target_g,
          fiber_target_g = EXCLUDED.fiber_target_g,
          water_target_ml = EXCLUDED.water_target_ml,
          timezone = EXCLUDED.timezone,
          locale = EXCLUDED.locale,
          onboarding_completed = EXCLUDED.onboarding_completed,
          updated_at = NOW()
      `;

      const params = [
        resolvedId,
        profile.birthDate || null,
        profile.biologicalSex || null,
        profile.heightCm || null,
        profile.currentWeightKg || null,
        profile.targetWeightKg || null,
        profile.activityLevel || null,
        profile.calorieTargetKcal,
        profile.proteinTargetG,
        profile.carbTargetG,
        profile.fatTargetG,
        profile.fiberTargetG,
        profile.waterTargetMl,
        profile.timezone,
        profile.locale,
        profile.onboardingCompleted,
      ];

      await this.executeQuery(sql, params);
      return { ...profile, userId: resolvedId };
    } catch (err) {
      console.error('[NeonAdapter] saveProfile error:', err);
      return this.fallbackAdapter.saveProfile({ ...profile, userId: resolvedId });
    }
  }

  async updateProfile(userId?: string, partial?: Partial<UserProfile>): Promise<UserProfile> {
    const resolvedId = this.resolveUserId(userId);
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
    return this.saveProfile(updated);
  }

  // --- Food Reports ---
  async getReports(userId?: string, filters?: ReportFilterOptions): Promise<FoodReport[]> {
    const resolvedId = this.resolveUserId(userId);
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.getReports(resolvedId, filters);
    }

    try {
      let sql = `
        SELECT r.*,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', c.id,
                     'reportId', c.report_id,
                     'name', c.name,
                     'quantityValue', c.quantity_value,
                     'quantityUnit', c.quantity_unit,
                     'calories', c.calories,
                     'proteinG', c.protein_g,
                     'carbsG', c.carbs_g,
                     'fatG', c.fat_g,
                     'fiberG', c.fiber_g,
                     'confidence', c.confidence,
                     'isEstimated', c.is_estimated
                   )
                 ) FILTER (WHERE c.id IS NOT NULL), '[]'
               ) as components
        FROM food_reports r
        LEFT JOIN food_components c ON r.id = c.report_id
        WHERE r.user_id = $1
      `;

      const params: any[] = [resolvedId];

      if (filters?.status) {
        params.push(filters.status);
        sql += ` AND r.status = $${params.length}`;
      } else {
        sql += ` AND r.status != 'deleted'`;
      }

      if (filters?.date) {
        const [year, month, day] = filters.date.split('-').map(Number);
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
        params.push(startOfDay);
        sql += ` AND r.recorded_at >= $${params.length}`;
        params.push(endOfDay);
        sql += ` AND r.recorded_at <= $${params.length}`;
      }

      sql += ` GROUP BY r.id ORDER BY r.recorded_at DESC`;

      const rows = await this.executeQuery(sql, params);
      return rows.map((row) => ({
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
        components: Array.isArray(row.components) ? row.components : [],
      }));
    } catch (err) {
      console.error('[NeonAdapter] getReports error:', err);
      return this.fallbackAdapter.getReports(resolvedId, filters);
    }
  }

  async getReportById(reportId: string): Promise<FoodReport | null> {
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.getReportById(reportId);
    }
    const reports = await this.getReports();
    return reports.find((r) => r.id === reportId) || null;
  }

  async createReport(report: FoodReport): Promise<FoodReport> {
    const resolvedId = this.resolveUserId(report.userId);
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.createReport({ ...report, userId: resolvedId });
    }

    try {
      const reportSql = `
        INSERT INTO food_reports (
          id, user_id, client_request_id, input_type, original_text,
          image_url, status, confidence, calories, protein_g, carbs_g, fat_g, fiber_g, recorded_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          calories = EXCLUDED.calories,
          protein_g = EXCLUDED.protein_g,
          carbs_g = EXCLUDED.carbs_g,
          fat_g = EXCLUDED.fat_g,
          fiber_g = EXCLUDED.fiber_g,
          updated_at = NOW()
      `;

      await this.executeQuery(reportSql, [
        report.id,
        resolvedId,
        report.clientRequestId || null,
        report.inputType,
        report.originalText || null,
        report.imageUrl || null,
        report.status,
        report.confidence,
        report.calories,
        report.proteinG,
        report.carbsG,
        report.fatG,
        report.fiberG,
        report.recordedAt,
      ]);

      await this.executeQuery(`DELETE FROM food_components WHERE report_id = $1`, [report.id]);

      if (report.components && report.components.length > 0) {
        for (const c of report.components) {
          const compSql = `
            INSERT INTO food_components (
              id, report_id, name, quantity_value, quantity_unit, calories,
              protein_g, carbs_g, fat_g, fiber_g, confidence, is_estimated
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            )
          `;
          await this.executeQuery(compSql, [
            c.id,
            report.id,
            c.name,
            c.quantityValue,
            c.quantityUnit,
            c.calories,
            c.proteinG,
            c.carbsG,
            c.fatG,
            c.fiberG,
            c.confidence,
            Boolean(c.isEstimated),
          ]);
        }
      }

      return { ...report, userId: resolvedId };
    } catch (err) {
      console.error('[NeonAdapter] createReport error:', err);
      return this.fallbackAdapter.createReport({ ...report, userId: resolvedId });
    }
  }

  async updateReport(report: FoodReport): Promise<FoodReport> {
    return this.createReport(report);
  }

  async deleteReport(reportId: string): Promise<boolean> {
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.deleteReport(reportId);
    }

    try {
      await this.executeQuery(`UPDATE food_reports SET status = 'deleted' WHERE id = $1`, [reportId]);
      return true;
    } catch (err) {
      console.error('[NeonAdapter] deleteReport error:', err);
      return this.fallbackAdapter.deleteReport(reportId);
    }
  }

  // --- Weight Tracking ---
  async getWeightEntries(userId?: string): Promise<WeightEntry[]> {
    const resolvedId = this.resolveUserId(userId);
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.getWeightEntries(resolvedId);
    }

    try {
      const rows = await this.executeQuery(
        `SELECT * FROM weight_entries WHERE user_id = $1 ORDER BY recorded_at DESC`,
        [resolvedId]
      );
      return rows.map((w) => ({
        id: w.id,
        userId: w.user_id,
        weightKg: Number(w.weight_kg),
        recordedAt: w.recorded_at,
      }));
    } catch (err) {
      console.error('[NeonAdapter] getWeightEntries error:', err);
      return this.fallbackAdapter.getWeightEntries(resolvedId);
    }
  }

  async addWeightEntry(entry: WeightEntry): Promise<WeightEntry> {
    const resolvedId = this.resolveUserId(entry.userId);
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.addWeightEntry({ ...entry, userId: resolvedId });
    }

    try {
      const sql = `
        INSERT INTO weight_entries (id, user_id, weight_kg, recorded_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET weight_kg = EXCLUDED.weight_kg
      `;
      await this.executeQuery(sql, [entry.id, resolvedId, entry.weightKg, entry.recordedAt]);
      return { ...entry, userId: resolvedId };
    } catch (err) {
      console.error('[NeonAdapter] addWeightEntry error:', err);
      return this.fallbackAdapter.addWeightEntry({ ...entry, userId: resolvedId });
    }
  }

  async deleteWeightEntry(id: string): Promise<boolean> {
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.deleteWeightEntry(id);
    }

    try {
      await this.executeQuery(`DELETE FROM weight_entries WHERE id = $1`, [id]);
      return true;
    } catch (err) {
      console.error('[NeonAdapter] deleteWeightEntry error:', err);
      return this.fallbackAdapter.deleteWeightEntry(id);
    }
  }

  // --- Personalized Food Memories ---
  async getFoodMemories(userId?: string): Promise<UserFoodMemory[]> {
    const resolvedId = this.resolveUserId(userId);
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.getFoodMemories(resolvedId);
    }

    try {
      const rows = await this.executeQuery(
        `SELECT * FROM user_food_memories WHERE user_id = $1 ORDER BY created_at DESC`,
        [resolvedId]
      );
      return rows.map((m) => ({
        id: m.id,
        userId: m.user_id,
        triggerName: m.trigger_name,
        resolvedDescription: m.resolved_description,
        notes: m.notes || undefined,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      }));
    } catch (err) {
      console.error('[NeonAdapter] getFoodMemories error:', err);
      return this.fallbackAdapter.getFoodMemories(resolvedId);
    }
  }

  async saveFoodMemory(memory: UserFoodMemory): Promise<UserFoodMemory> {
    const resolvedId = this.resolveUserId(memory.userId);
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.saveFoodMemory({ ...memory, userId: resolvedId });
    }

    try {
      const sql = `
        INSERT INTO user_food_memories (id, user_id, trigger_name, resolved_description, notes)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          trigger_name = EXCLUDED.trigger_name,
          resolved_description = EXCLUDED.resolved_description,
          notes = EXCLUDED.notes,
          updated_at = NOW()
      `;
      await this.executeQuery(sql, [
        memory.id,
        resolvedId,
        memory.triggerName,
        memory.resolvedDescription,
        memory.notes || null,
      ]);
      return { ...memory, userId: resolvedId };
    } catch (err) {
      console.error('[NeonAdapter] saveFoodMemory error:', err);
      return this.fallbackAdapter.saveFoodMemory({ ...memory, userId: resolvedId });
    }
  }

  async updateFoodMemory(memory: UserFoodMemory): Promise<UserFoodMemory> {
    return this.saveFoodMemory(memory);
  }

  async deleteFoodMemory(id: string): Promise<boolean> {
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.deleteFoodMemory(id);
    }

    try {
      await this.executeQuery(`DELETE FROM user_food_memories WHERE id = $1`, [id]);
      return true;
    } catch (err) {
      console.error('[NeonAdapter] deleteFoodMemory error:', err);
      return this.fallbackAdapter.deleteFoodMemory(id);
    }
  }

  // --- Water Tracking ---
  async getWaterEntries(userId?: string): Promise<Record<string, number>> {
    const resolvedId = this.resolveUserId(userId);
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.getWaterEntries(resolvedId);
    }

    try {
      const rows = await this.executeQuery(
        `SELECT date_key, amount_ml FROM water_entries WHERE user_id = $1`,
        [resolvedId]
      );
      const result: Record<string, number> = {};
      rows.forEach((r) => {
        result[r.date_key] = Number(r.amount_ml);
      });
      return result;
    } catch (err) {
      console.error('[NeonAdapter] getWaterEntries error:', err);
      return this.fallbackAdapter.getWaterEntries(resolvedId);
    }
  }

  async getWaterByDate(date: string, userId?: string): Promise<number> {
    const entries = await this.getWaterEntries(userId);
    return entries[date] || 0;
  }

  async setWater(date: string, amountMl: number, userId?: string): Promise<number> {
    const resolvedId = this.resolveUserId(userId);
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.setWater(date, amountMl, resolvedId);
    }

    try {
      const safeAmount = Math.max(0, amountMl);
      const sql = `
        INSERT INTO water_entries (id, user_id, date_key, amount_ml)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, date_key) DO UPDATE SET
          amount_ml = EXCLUDED.amount_ml,
          updated_at = NOW()
      `;
      await this.executeQuery(sql, [`${resolvedId}_${date}`, resolvedId, date, safeAmount]);
      return safeAmount;
    } catch (err) {
      console.error('[NeonAdapter] setWater error:', err);
      return this.fallbackAdapter.setWater(date, amountMl, resolvedId);
    }
  }

  async addWater(date: string, amountMl: number, userId?: string): Promise<number> {
    const current = await this.getWaterByDate(date, userId);
    return this.setWater(date, current + amountMl, userId);
  }

  // --- Backup, Export, Import & Reset ---
  async exportAllData(userId?: string): Promise<AppBackupData> {
    const resolvedId = this.resolveUserId(userId);
    const [userProfile, foodReports, weightEntries, foodMemories, waterEntries] = await Promise.all([
      this.getProfile(resolvedId),
      this.getReports(resolvedId),
      this.getWeightEntries(resolvedId),
      this.getFoodMemories(resolvedId),
      this.getWaterEntries(resolvedId),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      version: '1.2',
      userProfile,
      foodReports,
      weightEntries,
      foodMemories,
      waterEntries,
    };
  }

  async importAllData(data: Partial<AppBackupData>): Promise<boolean> {
    try {
      if (data.userProfile) await this.saveProfile(data.userProfile);
      if (Array.isArray(data.foodReports)) {
        for (const r of data.foodReports) await this.createReport(r);
      }
      if (Array.isArray(data.weightEntries)) {
        for (const w of data.weightEntries) await this.addWeightEntry(w);
      }
      if (Array.isArray(data.foodMemories)) {
        for (const m of data.foodMemories) await this.saveFoodMemory(m);
      }
      if (data.waterEntries) {
        for (const [date, ml] of Object.entries(data.waterEntries)) {
          await this.setWater(date, ml);
        }
      }
      return true;
    } catch (err) {
      console.error('[NeonAdapter] importAllData failed:', err);
      return false;
    }
  }

  async clearAllData(userId?: string): Promise<boolean> {
    const resolvedId = this.resolveUserId(userId);
    if (!isNeonConfigured()) {
      return this.fallbackAdapter.clearAllData();
    }

    try {
      await Promise.all([
        this.executeQuery(`DELETE FROM user_profiles WHERE user_id = $1`, [resolvedId]),
        this.executeQuery(`DELETE FROM food_reports WHERE user_id = $1`, [resolvedId]),
        this.executeQuery(`DELETE FROM weight_entries WHERE user_id = $1`, [resolvedId]),
        this.executeQuery(`DELETE FROM user_food_memories WHERE user_id = $1`, [resolvedId]),
        this.executeQuery(`DELETE FROM water_entries WHERE user_id = $1`, [resolvedId]),
      ]);
      return true;
    } catch (err) {
      console.error('[NeonAdapter] clearAllData failed:', err);
      return false;
    }
  }
}
