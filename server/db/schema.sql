-- Run this once against the Neon database. API ownership checks are enforced server-side.
-- ==============================================================================
-- PostgreSQL schema for DailyCalory on Neon
-- ==============================================================================

-- 1. Create updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  birth_date DATE,
  biological_sex TEXT CHECK (biological_sex IN ('male', 'female')),
  height_cm NUMERIC(5, 2),
  current_weight_kg NUMERIC(5, 2),
  target_weight_kg NUMERIC(5, 2),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very_active', 'extra_active')),
  calorie_target_kcal INTEGER NOT NULL DEFAULT 2000,
  protein_target_g NUMERIC(5, 1) NOT NULL DEFAULT 120.0,
  carb_target_g NUMERIC(5, 1) NOT NULL DEFAULT 200.0,
  fat_target_g NUMERIC(5, 1) NOT NULL DEFAULT 60.0,
  fiber_target_g NUMERIC(5, 1) NOT NULL DEFAULT 25.0,
  water_target_ml INTEGER NOT NULL DEFAULT 2500,
  timezone TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
  locale TEXT NOT NULL DEFAULT 'he-IL',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 3. Food Reports Table
CREATE TABLE IF NOT EXISTS food_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  client_request_id TEXT,
  input_type TEXT NOT NULL CHECK (input_type IN ('text', 'image', 'photo', 'voice', 'manual')),
  original_text TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('draft', 'analyzing', 'saved', 'deleted')),
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  calories NUMERIC(7, 1) NOT NULL DEFAULT 0,
  protein_g NUMERIC(6, 1) NOT NULL DEFAULT 0,
  carbs_g NUMERIC(6, 1) NOT NULL DEFAULT 0,
  fat_g NUMERIC(6, 1) NOT NULL DEFAULT 0,
  fiber_g NUMERIC(6, 1) NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_reports_user_date ON food_reports(user_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_food_reports_status ON food_reports(status);

CREATE TRIGGER trg_food_reports_updated_at
BEFORE UPDATE ON food_reports
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4. Food Components Table (Sub-items for each food report)
CREATE TABLE IF NOT EXISTS food_components (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES food_reports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity_value NUMERIC(7, 2) NOT NULL DEFAULT 1,
  quantity_unit TEXT NOT NULL DEFAULT 'יחידה',
  calories NUMERIC(7, 1) NOT NULL DEFAULT 0,
  protein_g NUMERIC(6, 1) NOT NULL DEFAULT 0,
  carbs_g NUMERIC(6, 1) NOT NULL DEFAULT 0,
  fat_g NUMERIC(6, 1) NOT NULL DEFAULT 0,
  fiber_g NUMERIC(6, 1) NOT NULL DEFAULT 0,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  is_estimated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_components_report_id ON food_components(report_id);

-- 5. Weight Entries Table
CREATE TABLE IF NOT EXISTS weight_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  weight_kg NUMERIC(5, 2) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weight_entries_user_date ON weight_entries(user_id, recorded_at DESC);

-- 6. Personalized Food Memories Table
CREATE TABLE IF NOT EXISTS user_food_memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  trigger_name TEXT NOT NULL,
  resolved_description TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_memories_user_trigger ON user_food_memories(user_id, trigger_name);

CREATE TRIGGER trg_user_food_memories_updated_at
BEFORE UPDATE ON user_food_memories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 7. Daily Water Entries Table
CREATE TABLE IF NOT EXISTS water_entries (
  id TEXT PRIMARY KEY, -- e.g. "user123_2026-08-20"
  user_id TEXT NOT NULL,
  date_key TEXT NOT NULL, -- "YYYY-MM-DD"
  amount_ml INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_water_user_date UNIQUE(user_id, date_key)
);

CREATE INDEX IF NOT EXISTS idx_water_entries_user_date ON water_entries(user_id, date_key);

CREATE TRIGGER trg_water_entries_updated_at
BEFORE UPDATE ON water_entries
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- 9. Workout plans. Exercise definitions remain versioned application seed data;
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
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_workout_plan_items_day_order ON workout_plan_items(day_id, sort_order);
