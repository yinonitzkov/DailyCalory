CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Workout plans. Exercise definitions remain versioned application seed data;
-- plan items retain only stable exercise IDs and per-plan prescription values.
CREATE TABLE IF NOT EXISTS workout_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks BETWEEN 1 AND 52),
  days_per_week INTEGER NOT NULL CHECK (days_per_week BETWEEN 1 AND 7),
  focuses TEXT[] NOT NULL DEFAULT '{}',
  duration_min_minutes INTEGER NOT NULL CHECK (duration_min_minutes BETWEEN 10 AND 180),
  duration_max_minutes INTEGER NOT NULL CHECK (duration_max_minutes BETWEEN duration_min_minutes AND 180),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_created ON workout_plans(user_id, created_at DESC);
DROP TRIGGER IF EXISTS trg_workout_plans_updated_at ON workout_plans;
CREATE TRIGGER trg_workout_plans_updated_at BEFORE UPDATE ON workout_plans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS workout_plan_days (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  focus TEXT NOT NULL CHECK (focus IN ('core', 'legs', 'cardio', 'full_body')),
  UNIQUE(plan_id, day_number)
);
CREATE INDEX IF NOT EXISTS idx_workout_plan_days_plan ON workout_plan_days(plan_id, day_number);

CREATE TABLE IF NOT EXISTS workout_plan_items (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES workout_plan_days(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  sets INTEGER NOT NULL CHECK (sets BETWEEN 1 AND 20),
  target_type TEXT NOT NULL CHECK (target_type IN ('reps', 'time')),
  target_value TEXT NOT NULL,
  rest_seconds INTEGER NOT NULL DEFAULT 60 CHECK (rest_seconds BETWEEN 0 AND 600),
  sort_order INTEGER NOT NULL DEFAULT 0,
);
CREATE INDEX IF NOT EXISTS idx_workout_plan_items_day_order ON workout_plan_items(day_id, sort_order);

ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plan_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their workout plans" ON workout_plans;
CREATE POLICY "Users manage their workout plans" ON workout_plans
  FOR ALL USING (auth.uid()::text = user_id OR user_id = 'local-user-1')
  WITH CHECK (auth.uid()::text = user_id OR user_id = 'local-user-1');
DROP POLICY IF EXISTS "Users manage their workout plan days" ON workout_plan_days;
CREATE POLICY "Users manage their workout plan days" ON workout_plan_days
  FOR ALL USING (EXISTS (SELECT 1 FROM workout_plans p WHERE p.id = plan_id AND (p.user_id = auth.uid()::text OR p.user_id = 'local-user-1')))
  WITH CHECK (EXISTS (SELECT 1 FROM workout_plans p WHERE p.id = plan_id AND (p.user_id = auth.uid()::text OR p.user_id = 'local-user-1')));
DROP POLICY IF EXISTS "Users manage their workout plan items" ON workout_plan_items;
CREATE POLICY "Users manage their workout plan items" ON workout_plan_items
  FOR ALL USING (EXISTS (SELECT 1 FROM workout_plan_days d JOIN workout_plans p ON p.id = d.plan_id WHERE d.id = day_id AND (p.user_id = auth.uid()::text OR p.user_id = 'local-user-1')))
  WITH CHECK (EXISTS (SELECT 1 FROM workout_plan_days d JOIN workout_plans p ON p.id = d.plan_id WHERE d.id = day_id AND (p.user_id = auth.uid()::text OR p.user_id = 'local-user-1')));
