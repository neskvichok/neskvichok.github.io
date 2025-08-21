-- Створення таблиці для результатів режиму "Точність"
CREATE TABLE IF NOT EXISTS accuracy_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  set_id UUID REFERENCES public.sets(id) ON DELETE CASCADE,
  accuracy DECIMAL(5,2) NOT NULL,
  time_spent DECIMAL(8,2) NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_attempts INTEGER NOT NULL,
  errors INTEGER NOT NULL,
  words_completed INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Індекси для швидкого пошуку
  CONSTRAINT fk_accuracy_user FOREIGN KEY (uid) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_accuracy_set FOREIGN KEY (set_id) REFERENCES public.sets(id) ON DELETE CASCADE
);

-- Створення індексів
CREATE INDEX IF NOT EXISTS idx_accuracy_results_uid ON accuracy_results(uid);
CREATE INDEX IF NOT EXISTS idx_accuracy_results_set_id ON accuracy_results(set_id);
CREATE INDEX IF NOT EXISTS idx_accuracy_results_created_at ON accuracy_results(created_at);

-- RLS політики
ALTER TABLE accuracy_results ENABLE ROW LEVEL SECURITY;

-- Користувач може бачити тільки свої результати
CREATE POLICY "Users can view own accuracy results" ON accuracy_results
  FOR SELECT USING (auth.uid() = uid);

-- Користувач може додавати тільки свої результати
CREATE POLICY "Users can insert own accuracy results" ON accuracy_results
  FOR INSERT WITH CHECK (auth.uid() = uid);

-- Користувач може оновлювати тільки свої результати
CREATE POLICY "Users can update own accuracy results" ON accuracy_results
  FOR UPDATE USING (auth.uid() = uid);
