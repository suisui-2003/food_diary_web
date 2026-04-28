-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table - 用户个人信息
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  height_cm INTEGER,
  weight_kg NUMERIC(5,2),
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')) DEFAULT 'moderate',
  goal TEXT CHECK (goal IN ('lose_weight', 'maintain', 'gain_muscle')) DEFAULT 'maintain',
  daily_calories_target INTEGER,
  daily_protein_target_g NUMERIC(8,2),
  daily_fat_target_g NUMERIC(8,2),
  daily_carbs_target_g NUMERIC(8,2),
  daily_sodium_target_mg NUMERIC(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food items table - 营养成分库
CREATE TABLE IF NOT EXISTS food_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  protein_g NUMERIC(8,2) NOT NULL DEFAULT 0,
  fat_g NUMERIC(8,2) NOT NULL DEFAULT 0,
  calories NUMERIC(8,2) NOT NULL DEFAULT 0,
  sodium_mg NUMERIC(8,2) DEFAULT 0,
  carbs_g NUMERIC(8,2) NOT NULL DEFAULT 0,
  notes TEXT,
  serving_size_g NUMERIC(8,2) DEFAULT 100,
  source TEXT CHECK (source IN ('manual', 'ai_scan', 'default')) DEFAULT 'manual',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diet logs table - 饮食记录
CREATE TABLE IF NOT EXISTS diet_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) DEFAULT 'lunch',
  natural_language_input TEXT NOT NULL,
  food_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily nutrition table - 每日营养汇总
CREATE TABLE IF NOT EXISTS daily_nutrition (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_calories NUMERIC(8,2) DEFAULT 0,
  total_protein_g NUMERIC(8,2) DEFAULT 0,
  total_fat_g NUMERIC(8,2) DEFAULT 0,
  total_carbs_g NUMERIC(8,2) DEFAULT 0,
  total_sodium_mg NUMERIC(8,2) DEFAULT 0,
  meets_target BOOLEAN DEFAULT FALSE,
  ai_suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_food_items_name ON food_items(name);
CREATE INDEX IF NOT EXISTS idx_diet_logs_date ON diet_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_daily_nutrition_date ON daily_nutrition(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_items_updated_at
  BEFORE UPDATE ON food_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_nutrition_updated_at
  BEFORE UPDATE ON daily_nutrition
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default profile (for demo without auth)
INSERT INTO profiles (id, height_cm, weight_kg, age, gender, activity_level, goal)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  175,
  70,
  25,
  'male',
  'moderate',
  'maintain'
)
ON CONFLICT (id) DO NOTHING;
