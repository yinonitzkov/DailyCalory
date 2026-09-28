import { Pool, PoolClient } from 'pg';
import { AppBackupData, ReportFilterOptions } from '../src/services/repository/IDataRepository';
import { FoodReport, UserFoodMemory, UserProfile, WeightEntry, WorkoutPlan } from '../src/types';

let neonPool: Pool | null = null;

const requirePool = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Neon is not configured. Set DATABASE_URL on the server.');
  if (!neonPool) neonPool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000 });
  return neonPool;
};

const mapProfile = (r: any): UserProfile => ({
  userId: r.user_id, birthDate: r.birth_date, biologicalSex: r.biological_sex,
  heightCm: Number(r.height_cm), currentWeightKg: Number(r.current_weight_kg), targetWeightKg: Number(r.target_weight_kg),
  activityLevel: r.activity_level, calorieTargetKcal: Number(r.calorie_target_kcal), proteinTargetG: Number(r.protein_target_g),
  carbTargetG: Number(r.carb_target_g), fatTargetG: Number(r.fat_target_g), fiberTargetG: Number(r.fiber_target_g),
  waterTargetMl: Number(r.water_target_ml), timezone: r.timezone, locale: r.locale, onboardingCompleted: Boolean(r.onboarding_completed),
});
const mapComponent = (c: any) => ({
  id: c.id, reportId: c.report_id, name: c.name, quantityValue: Number(c.quantity_value), quantityUnit: c.quantity_unit,
  calories: Number(c.calories), proteinG: Number(c.protein_g), carbsG: Number(c.carbs_g), fatG: Number(c.fat_g),
  fiberG: Number(c.fiber_g), confidence: c.confidence, isEstimated: Boolean(c.is_estimated),
});
const mapReport = (r: any): FoodReport => ({
  id: r.id, userId: r.user_id, clientRequestId: r.client_request_id || undefined, inputType: r.input_type,
  originalText: r.original_text || undefined, imageUrl: r.image_url || undefined, status: r.status, confidence: r.confidence,
  calories: Number(r.calories), proteinG: Number(r.protein_g), carbsG: Number(r.carbs_g), fatG: Number(r.fat_g),
  fiberG: Number(r.fiber_g), recordedAt: r.recorded_at, components: (r.food_components || []).map(mapComponent),
});
const mapMemory = (r: any): UserFoodMemory => ({
  id: r.id, userId: r.user_id, triggerName: r.trigger_name, resolvedDescription: r.resolved_description,
  notes: r.notes || undefined, createdAt: r.created_at, updatedAt: r.updated_at,
});

async function getReport(client: Pool | PoolClient, id: string, userId: string) {
  const result = await client.query(
    `SELECT r.*, COALESCE(json_agg(c) FILTER (WHERE c.id IS NOT NULL), '[]') AS food_components
     FROM food_reports r LEFT JOIN food_components c ON c.report_id = r.id
     WHERE r.id = $1 AND r.user_id = $2 GROUP BY r.id`, [id, userId]);
  return result.rows[0] ? mapReport(result.rows[0]) : null;
}

async function saveReport(client: Pool | PoolClient, report: FoodReport, userId: string) {
  await client.query(
    `INSERT INTO food_reports(id,user_id,client_request_id,input_type,original_text,image_url,status,confidence,calories,protein_g,carbs_g,fat_g,fiber_g,recorded_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT(id) DO UPDATE SET user_id=EXCLUDED.user_id,client_request_id=EXCLUDED.client_request_id,input_type=EXCLUDED.input_type,
       original_text=EXCLUDED.original_text,image_url=EXCLUDED.image_url,status=EXCLUDED.status,confidence=EXCLUDED.confidence,
       calories=EXCLUDED.calories,protein_g=EXCLUDED.protein_g,carbs_g=EXCLUDED.carbs_g,fat_g=EXCLUDED.fat_g,fiber_g=EXCLUDED.fiber_g,recorded_at=EXCLUDED.recorded_at
     WHERE food_reports.user_id=EXCLUDED.user_id`,
    [report.id,userId,report.clientRequestId || null,report.inputType,report.originalText || null,report.imageUrl || null,report.status,
      report.confidence,report.calories,report.proteinG,report.carbsG,report.fatG,report.fiberG,report.recordedAt]);
  const owned = await client.query('SELECT id FROM food_reports WHERE id=$1 AND user_id=$2', [report.id,userId]);
  if (!owned.rowCount) throw new Error('Food report not found for current user.');
  await client.query('DELETE FROM food_components WHERE report_id=$1', [report.id]);
  for (const c of report.components || []) await client.query(
    `INSERT INTO food_components(id,report_id,name,quantity_value,quantity_unit,calories,protein_g,carbs_g,fat_g,fiber_g,confidence,is_estimated)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [c.id,report.id,c.name,c.quantityValue,c.quantityUnit,c.calories,c.proteinG,c.carbsG,c.fatG,c.fiberG,c.confidence,Boolean(c.isEstimated)]);
  return { ...report, userId };
}

async function savePlan(client: Pool | PoolClient, plan: WorkoutPlan, userId: string) {
  await client.query(
    `INSERT INTO workout_plans(id,user_id,name,duration_weeks,days_per_week,focuses,duration_min_minutes,duration_max_minutes,created_at,updated_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,NOW()),COALESCE($10,NOW()))
     ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,duration_weeks=EXCLUDED.duration_weeks,days_per_week=EXCLUDED.days_per_week,
       focuses=EXCLUDED.focuses,duration_min_minutes=EXCLUDED.duration_min_minutes,duration_max_minutes=EXCLUDED.duration_max_minutes,updated_at=NOW()
     WHERE workout_plans.user_id=EXCLUDED.user_id`,
    [plan.id,userId,plan.name,plan.durationWeeks,plan.daysPerWeek,plan.focuses,plan.durationMinMinutes,plan.durationMaxMinutes,plan.createdAt,plan.updatedAt]);
  const ownPlan = await client.query('SELECT id FROM workout_plans WHERE id=$1 AND user_id=$2', [plan.id,userId]);
  if (!ownPlan.rowCount) throw new Error('Workout plan not found for current user.');
  const keepDays = plan.days.map(d => d.id);
  if (keepDays.length) await client.query('DELETE FROM workout_plan_days WHERE plan_id=$1 AND NOT (id=ANY($2::text[]))', [plan.id,keepDays]);
  else await client.query('DELETE FROM workout_plan_days WHERE plan_id=$1', [plan.id]);
  for (const day of plan.days) {
    await client.query(`INSERT INTO workout_plan_days(id,plan_id,day_number,focus) VALUES($1,$2,$3,$4)
      ON CONFLICT(id) DO UPDATE SET day_number=EXCLUDED.day_number,focus=EXCLUDED.focus WHERE workout_plan_days.plan_id=EXCLUDED.plan_id`, [day.id,plan.id,day.dayNumber,day.focus]);
    const ownedDay = await client.query('SELECT id FROM workout_plan_days WHERE id=$1 AND plan_id=$2', [day.id,plan.id]);
    if (!ownedDay.rowCount) throw new Error('Workout day not found for current user.');
    const keepItems = day.items.map(i => i.id);
    if (keepItems.length) await client.query('DELETE FROM workout_plan_items WHERE day_id=$1 AND NOT (id=ANY($2::text[]))', [day.id,keepItems]);
    else await client.query('DELETE FROM workout_plan_items WHERE day_id=$1', [day.id]);
    for (const item of day.items) await client.query(
      `INSERT INTO workout_plan_items(id,day_id,exercise_id,sets,target_type,target_value,rest_seconds,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT(id) DO UPDATE SET exercise_id=EXCLUDED.exercise_id,sets=EXCLUDED.sets,target_type=EXCLUDED.target_type,target_value=EXCLUDED.target_value,
       rest_seconds=EXCLUDED.rest_seconds,sort_order=EXCLUDED.sort_order WHERE workout_plan_items.day_id=EXCLUDED.day_id`,
      [item.id,day.id,item.exerciseId,item.sets,item.targetType,item.targetValue,item.restSeconds,item.sortOrder]);
  }
  return { ...plan, userId };
}

async function runInTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await requirePool().connect();
  try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

export async function executeNeonOperation(action: string, args: any, userId: string): Promise<any> {
  const db = requirePool();
  switch (action) {
    case 'health': await db.query('SELECT 1'); return { ok: true };
    case 'getProfile': {
      const r = await db.query('SELECT * FROM user_profiles WHERE user_id=$1', [userId]); return r.rows[0] ? mapProfile(r.rows[0]) : null;
    }
    case 'saveProfile': {
      const p: UserProfile = args.profile;
      const r = await db.query(`INSERT INTO user_profiles(user_id,birth_date,biological_sex,height_cm,current_weight_kg,target_weight_kg,activity_level,calorie_target_kcal,protein_target_g,carb_target_g,fat_target_g,fiber_target_g,water_target_ml,timezone,locale,onboarding_completed)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT(user_id) DO UPDATE SET birth_date=EXCLUDED.birth_date,biological_sex=EXCLUDED.biological_sex,height_cm=EXCLUDED.height_cm,current_weight_kg=EXCLUDED.current_weight_kg,target_weight_kg=EXCLUDED.target_weight_kg,activity_level=EXCLUDED.activity_level,calorie_target_kcal=EXCLUDED.calorie_target_kcal,protein_target_g=EXCLUDED.protein_target_g,carb_target_g=EXCLUDED.carb_target_g,fat_target_g=EXCLUDED.fat_target_g,fiber_target_g=EXCLUDED.fiber_target_g,water_target_ml=EXCLUDED.water_target_ml,timezone=EXCLUDED.timezone,locale=EXCLUDED.locale,onboarding_completed=EXCLUDED.onboarding_completed RETURNING *`,
      [userId,p.birthDate||null,p.biologicalSex||null,p.heightCm||null,p.currentWeightKg||null,p.targetWeightKg||null,p.activityLevel||null,p.calorieTargetKcal,p.proteinTargetG,p.carbTargetG,p.fatTargetG,p.fiberTargetG,p.waterTargetMl,p.timezone,p.locale,p.onboardingCompleted]); return mapProfile(r.rows[0]);
    }
    case 'getReports': {
      const filters: ReportFilterOptions = args.filters || {}; const values: any[] = [userId]; let where = 'r.user_id=$1';
      if (filters.status) { values.push(filters.status); where += ` AND r.status=$${values.length}`; } else where += ` AND r.status <> 'deleted'`;
      if (filters.date) { const start=new Date(`${filters.date}T00:00:00.000Z`); const end=new Date(`${filters.date}T23:59:59.999Z`); values.push(start.toISOString(),end.toISOString()); where += ` AND r.recorded_at >= $${values.length-1} AND r.recorded_at <= $${values.length}`; }
      if (filters.fromDate) { values.push(filters.fromDate); where += ` AND r.recorded_at >= $${values.length}`; }
      if (filters.toDate) { values.push(filters.toDate); where += ` AND r.recorded_at <= $${values.length}`; }
      const r = await db.query(`SELECT r.*,COALESCE(json_agg(c) FILTER (WHERE c.id IS NOT NULL),'[]') food_components FROM food_reports r LEFT JOIN food_components c ON c.report_id=r.id WHERE ${where} GROUP BY r.id ORDER BY r.recorded_at DESC`,values); return r.rows.map(mapReport);
    }
    case 'getReportById': return getReport(db,args.reportId,userId);
    case 'createReport': return runInTransaction(client => saveReport(client,args.report,userId));
    case 'updateReport': return runInTransaction(client => saveReport(client,args.report,userId));
    case 'deleteReport': { const r = await db.query("UPDATE food_reports SET status='deleted' WHERE id=$1 AND user_id=$2",[args.reportId,userId]); return Boolean(r.rowCount); }
    case 'getWeightEntries': { const r = await db.query('SELECT * FROM weight_entries WHERE user_id=$1 ORDER BY recorded_at DESC',[userId]); return r.rows.map(x=>({id:x.id,userId:x.user_id,weightKg:Number(x.weight_kg),recordedAt:x.recorded_at})); }
    case 'addWeightEntry': { const w: WeightEntry=args.entry; await db.query('INSERT INTO weight_entries(id,user_id,weight_kg,recorded_at) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET weight_kg=EXCLUDED.weight_kg,recorded_at=EXCLUDED.recorded_at WHERE weight_entries.user_id=EXCLUDED.user_id',[w.id,userId,w.weightKg,w.recordedAt]); return {...w,userId}; }
    case 'deleteWeightEntry': { const r=await db.query('DELETE FROM weight_entries WHERE id=$1 AND user_id=$2',[args.id,userId]); return Boolean(r.rowCount); }
    case 'getFoodMemories': { const r=await db.query('SELECT * FROM user_food_memories WHERE user_id=$1 ORDER BY created_at DESC',[userId]); return r.rows.map(mapMemory); }
    case 'saveFoodMemory': { const m:UserFoodMemory=args.memory; const r=await db.query(`INSERT INTO user_food_memories(id,user_id,trigger_name,resolved_description,notes) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET trigger_name=EXCLUDED.trigger_name,resolved_description=EXCLUDED.resolved_description,notes=EXCLUDED.notes WHERE user_food_memories.user_id=EXCLUDED.user_id RETURNING *`,[m.id,userId,m.triggerName,m.resolvedDescription,m.notes||null]); return r.rows[0]?mapMemory(r.rows[0]):m; }
    case 'deleteFoodMemory': { const r=await db.query('DELETE FROM user_food_memories WHERE id=$1 AND user_id=$2',[args.id,userId]); return Boolean(r.rowCount); }
    case 'getWaterEntries': { const r=await db.query('SELECT date_key,amount_ml FROM water_entries WHERE user_id=$1',[userId]); return Object.fromEntries(r.rows.map(x=>[x.date_key,Number(x.amount_ml)])); }
    case 'getWaterByDate': { const r=await db.query('SELECT amount_ml FROM water_entries WHERE user_id=$1 AND date_key=$2',[userId,args.date]); return Number(r.rows[0]?.amount_ml||0); }
    case 'setWater': { const n=Math.max(0,Number(args.amountMl)||0); await db.query('INSERT INTO water_entries(id,user_id,date_key,amount_ml) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,date_key) DO UPDATE SET amount_ml=EXCLUDED.amount_ml',[`${userId}_${args.date}`,userId,args.date,n]); return n; }
    case 'addWater': { const r=await db.query('INSERT INTO water_entries(id,user_id,date_key,amount_ml) VALUES($1,$2,$3,GREATEST(0,$4)) ON CONFLICT(user_id,date_key) DO UPDATE SET amount_ml=GREATEST(0,water_entries.amount_ml+EXCLUDED.amount_ml) RETURNING amount_ml',[`${userId}_${args.date}`,userId,args.date,args.amountMl]); return Number(r.rows[0].amount_ml); }
    case 'getWorkoutPlans': {
      const r=await db.query(`SELECT p.*,COALESCE(jsonb_agg(jsonb_build_object('id',d.id,'day_number',d.day_number,'focus',d.focus) ORDER BY d.day_number) FILTER(WHERE d.id IS NOT NULL),'[]'::jsonb) days FROM workout_plans p LEFT JOIN workout_plan_days d ON d.plan_id=p.id WHERE p.user_id=$1 GROUP BY p.id ORDER BY p.created_at DESC`,[userId]);
      const plans:WorkoutPlan[]=[];
      for(const p of r.rows){const days=[];for(const d of p.days){const items=await db.query('SELECT * FROM workout_plan_items WHERE day_id=$1 ORDER BY sort_order',[d.id]);days.push({id:d.id,dayNumber:d.day_number,focus:d.focus,items:items.rows.map(i=>({id:i.id,exerciseId:i.exercise_id,sets:i.sets,targetType:i.target_type,targetValue:i.target_value,restSeconds:i.rest_seconds,sortOrder:i.sort_order}))});} plans.push({id:p.id,userId,name:p.name,durationWeeks:p.duration_weeks,daysPerWeek:p.days_per_week,focuses:p.focuses||[],durationMinMinutes:p.duration_min_minutes,durationMaxMinutes:p.duration_max_minutes,createdAt:p.created_at,updatedAt:p.updated_at,days});}return plans;
    }
    case 'saveWorkoutPlan': return runInTransaction(client=>savePlan(client,args.plan,userId));
    case 'deleteWorkoutPlan': { const r=await db.query('DELETE FROM workout_plans WHERE id=$1 AND user_id=$2',[args.planId,userId]);return Boolean(r.rowCount); }
    case 'exportAllData': {
      const [profile,reports,weights,memories,water,plans]=await Promise.all([
        executeNeonOperation('getProfile',{},userId),executeNeonOperation('getReports',{},userId),executeNeonOperation('getWeightEntries',{},userId),executeNeonOperation('getFoodMemories',{},userId),executeNeonOperation('getWaterEntries',{},userId),executeNeonOperation('getWorkoutPlans',{},userId)]);
      return {exportedAt:new Date().toISOString(),version:'1.3',userProfile:profile,foodReports:reports,weightEntries:weights,foodMemories:memories,waterEntries:water,workoutPlans:plans} satisfies AppBackupData;
    }
    case 'importAllData': {
      const data:Partial<AppBackupData>=args.data;
      return runInTransaction(async client=>{if(data.userProfile) await executeProfileOnClient(client,data.userProfile,userId);for(const report of data.foodReports||[]) await saveReport(client,report,userId);for(const w of data.weightEntries||[]) await client.query('INSERT INTO weight_entries(id,user_id,weight_kg,recorded_at) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET weight_kg=EXCLUDED.weight_kg,recorded_at=EXCLUDED.recorded_at WHERE weight_entries.user_id=EXCLUDED.user_id',[w.id,userId,w.weightKg,w.recordedAt]);for(const m of data.foodMemories||[]) await client.query('INSERT INTO user_food_memories(id,user_id,trigger_name,resolved_description,notes) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET trigger_name=EXCLUDED.trigger_name,resolved_description=EXCLUDED.resolved_description,notes=EXCLUDED.notes WHERE user_food_memories.user_id=EXCLUDED.user_id',[m.id,userId,m.triggerName,m.resolvedDescription,m.notes||null]);for(const [date,ml] of Object.entries(data.waterEntries||{})) await client.query('INSERT INTO water_entries(id,user_id,date_key,amount_ml) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,date_key) DO UPDATE SET amount_ml=EXCLUDED.amount_ml',[`${userId}_${date}`,userId,date,ml]);for(const plan of data.workoutPlans||[]) await savePlan(client,plan,userId);return true;});
    }
    case 'clearAllData': return runInTransaction(async client=>{await client.query('DELETE FROM food_reports WHERE user_id=$1',[userId]);await client.query('DELETE FROM weight_entries WHERE user_id=$1',[userId]);await client.query('DELETE FROM user_food_memories WHERE user_id=$1',[userId]);await client.query('DELETE FROM water_entries WHERE user_id=$1',[userId]);await client.query('DELETE FROM workout_plans WHERE user_id=$1',[userId]);await client.query('DELETE FROM user_profiles WHERE user_id=$1',[userId]);return true;});
    default: throw new Error('Unknown data operation.');
  }
}

async function executeProfileOnClient(client: PoolClient, p: UserProfile, userId: string) {
  await client.query(`INSERT INTO user_profiles(user_id,birth_date,biological_sex,height_cm,current_weight_kg,target_weight_kg,activity_level,calorie_target_kcal,protein_target_g,carb_target_g,fat_target_g,fiber_target_g,water_target_ml,timezone,locale,onboarding_completed)
  VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT(user_id) DO UPDATE SET birth_date=EXCLUDED.birth_date,biological_sex=EXCLUDED.biological_sex,height_cm=EXCLUDED.height_cm,current_weight_kg=EXCLUDED.current_weight_kg,target_weight_kg=EXCLUDED.target_weight_kg,activity_level=EXCLUDED.activity_level,calorie_target_kcal=EXCLUDED.calorie_target_kcal,protein_target_g=EXCLUDED.protein_target_g,carb_target_g=EXCLUDED.carb_target_g,fat_target_g=EXCLUDED.fat_target_g,fiber_target_g=EXCLUDED.fiber_target_g,water_target_ml=EXCLUDED.water_target_ml,timezone=EXCLUDED.timezone,locale=EXCLUDED.locale,onboarding_completed=EXCLUDED.onboarding_completed`,[userId,p.birthDate||null,p.biologicalSex||null,p.heightCm||null,p.currentWeightKg||null,p.targetWeightKg||null,p.activityLevel||null,p.calorieTargetKcal,p.proteinTargetG,p.carbTargetG,p.fatTargetG,p.fiberTargetG,p.waterTargetMl,p.timezone,p.locale,p.onboardingCompleted]);
}
