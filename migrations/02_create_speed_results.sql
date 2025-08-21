-- Створення таблиці для результатів режиму "Швидкість"
CREATE TABLE IF NOT EXISTS speed_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  set_id TEXT NOT NULL,
  words_per_minute DECIMAL(6,2) NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL,
  time_spent DECIMAL(8,2) NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_attempts INTEGER NOT NULL,
  errors INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Індекси для швидкого пошуку
  CONSTRAINT fk_speed_user FOREIGN KEY (uid) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Створення індексів
CREATE INDEX IF NOT EXISTS idx_speed_results_uid ON speed_results(uid);
CREATE INDEX IF NOT EXISTS idx_speed_results_set_id ON speed_results(set_id);
CREATE INDEX IF NOT EXISTS idx_speed_results_created_at ON speed_results(created_at);
CREATE INDEX IF NOT EXISTS idx_speed_results_wpm ON speed_results(words_per_minute);

-- RLS політики
ALTER TABLE speed_results ENABLE ROW LEVEL SECURITY;

-- Користувач може бачити тільки свої результати
CREATE POLICY "Users can view own speed results" ON speed_results
  FOR SELECT USING (auth.uid() = uid);

-- Користувач може додавати тільки свої результати
CREATE POLICY "Users can insert own speed results" ON speed_results
  FOR INSERT WITH CHECK (auth.uid() = uid);

-- Користувач може оновлювати тільки свої результати
CREATE POLICY "Users can update own speed results" ON speed_results
  FOR UPDATE USING (auth.uid() = uid);
