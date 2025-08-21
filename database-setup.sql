-- Налаштування бази даних для Quiz Trainer

-- Створення таблиці наборів
CREATE TABLE IF NOT EXISTS sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Створення таблиці слів
CREATE TABLE IF NOT EXISTS words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID REFERENCES sets(id) ON DELETE CASCADE,
  hint TEXT NOT NULL,
  answers TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Створення таблиці прогресу користувача
CREATE TABLE IF NOT EXISTS user_progress (
  uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  set_id UUID REFERENCES sets(id) ON DELETE CASCADE,
  word_id UUID REFERENCES words(id) ON DELETE CASCADE,
  short_memory INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (uid, word_id)
);

-- Створення таблиці статистики наборів
CREATE TABLE IF NOT EXISTS user_set_stats (
  uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  set_id UUID REFERENCES sets(id) ON DELETE CASCADE,
  attempts INTEGER DEFAULT 0,
  correct INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (uid, set_id)
);

-- Включення RLS
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_set_stats ENABLE ROW LEVEL SECURITY;

-- Політики для таблиці sets (дозволяємо всім читати, але тільки авторизованим створювати)
CREATE POLICY "Sets are viewable by everyone" ON sets FOR SELECT USING (true);
CREATE POLICY "Users can create sets" ON sets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their sets" ON sets FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete their sets" ON sets FOR DELETE USING (auth.role() = 'authenticated');

-- Політики для таблиці words (дозволяємо всім читати, але тільки авторизованим створювати)
CREATE POLICY "Words are viewable by everyone" ON words FOR SELECT USING (true);
CREATE POLICY "Users can create words" ON words FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update words" ON words FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete words" ON words FOR DELETE USING (auth.role() = 'authenticated');

-- Політики для таблиці user_progress (тільки власник може читати/писати)
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = uid);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = uid);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = uid);
CREATE POLICY "Users can delete own progress" ON user_progress FOR DELETE USING (auth.uid() = uid);

-- Політики для таблиці user_set_stats (тільки власник може читати/писати)
CREATE POLICY "Users can view own stats" ON user_set_stats FOR SELECT USING (auth.uid() = uid);
CREATE POLICY "Users can insert own stats" ON user_set_stats FOR INSERT WITH CHECK (auth.uid() = uid);
CREATE POLICY "Users can update own stats" ON user_set_stats FOR UPDATE USING (auth.uid() = uid);
CREATE POLICY "Users can delete own stats" ON user_set_stats FOR DELETE USING (auth.uid() = uid);

-- Створення індексів для кращої продуктивності
CREATE INDEX IF NOT EXISTS idx_words_set_id ON words(set_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_uid ON user_progress(uid);
CREATE INDEX IF NOT EXISTS idx_user_progress_set_id ON user_progress(set_id);
CREATE INDEX IF NOT EXISTS idx_user_set_stats_uid ON user_set_stats(uid);
CREATE INDEX IF NOT EXISTS idx_user_set_stats_set_id ON user_set_stats(set_id);

-- Функція для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Тригери для автоматичного оновлення updated_at
CREATE TRIGGER update_sets_updated_at BEFORE UPDATE ON sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_words_updated_at BEFORE UPDATE ON words FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_set_stats_updated_at BEFORE UPDATE ON user_set_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
