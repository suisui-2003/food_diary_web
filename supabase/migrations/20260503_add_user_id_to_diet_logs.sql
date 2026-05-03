-- Add user_id column to diet_logs table
ALTER TABLE diet_logs
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_diet_logs_user_id ON diet_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_logs_user_date ON diet_logs(user_id, log_date);

-- Enable Row Level Security
ALTER TABLE diet_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own logs" ON diet_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON diet_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON diet_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON diet_logs;

-- Create policies for data isolation
CREATE POLICY "Users can view own logs"
ON diet_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
ON diet_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs"
ON diet_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
ON diet_logs FOR DELETE
USING (auth.uid() = user_id);
