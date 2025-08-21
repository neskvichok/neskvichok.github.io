"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import SignOutButton from "./signout-button";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { withBasePath } from "@/lib/utils";

interface SetStats {
  setId: string;
  setName: string;
  bestAccuracy: string;
  bestSpeed: string;
  learnedWords: number;
  totalWords: number;
}

interface QuizStats {
  totalGames: number;
  totalWords: number;
  averageAccuracy: number;
  bestSpeed: number;
  bestAccuracy: number;
  totalTime: number;
}

interface ModeStats {
  education: QuizStats;
  accuracy: QuizStats;
  speed: QuizStats;
  sets: SetStats[];
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ModeStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        loadUserStats(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserStats(session.user.id);
      } else {
        setStats(null);
        setStatsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserStats = async (userId: string) => {
    setStatsLoading(true);
    const supabase = createClient();
    
    try {
      // Завантажуємо статистику для всіх режимів
      const [accuracyResults, speedResults, userProgress, sets] = await Promise.all([
        supabase.from('accuracy_results').select('*').eq('uid', userId),
        supabase.from('speed_results').select('*').eq('uid', userId),
        supabase.from('user_progress').select('*').eq('uid', userId),
        supabase.from('sets').select('id, name')
      ]);

      console.log('Raw data from DB:', {
        accuracyResults: accuracyResults.data?.length || 0,
        speedResults: speedResults.data?.length || 0,
        userProgress: userProgress.data?.length || 0,
        userProgressSample: userProgress.data?.slice(0, 3),
        accuracyResultsData: accuracyResults.data,
        speedResultsData: speedResults.data
      });
      
      // Розгорнути об'єкти для детального перегляду
      console.log('Accuracy results details:', accuracyResults.data);
      console.log('Speed results details:', speedResults.data);
      console.log('User progress details:', userProgress.data);

      // Обчислюємо статистику для режиму навчання
      const educationStats = calculateEducationStats(userProgress.data || []);
      
      // Обчислюємо статистику для режиму точності
      const accuracyStats = calculateAccuracyStats(accuracyResults.data || []);
      
      // Обчислюємо статистику для режиму швидкості
      const speedStats = calculateSpeedStats(speedResults.data || []);

      // Обчислюємо статистику по наборах
      const setsStats = calculateSetsStats(
        accuracyResults.data || [],
        speedResults.data || [],
        userProgress.data || [],
        sets.data || []
      );

      console.log('Calculated stats:', {
        education: educationStats,
        accuracy: accuracyStats,
        speed: speedStats,
        sets: setsStats
      });
      
      // Розгорнути обчислену статистику
      console.log('Education stats details:', educationStats);
      console.log('Accuracy stats details:', accuracyStats);
      console.log('Speed stats details:', speedStats);
      console.log('Sets stats details:', setsStats);
      
      // Розгорнути детальну інформацію про кожен набір
      setsStats.forEach((setStats, index) => {
        console.log(`Set ${index + 1}:`, {
          id: setStats.setId,
          name: setStats.setName,
          learnedWords: setStats.learnedWords,
          totalWords: setStats.totalWords,
          bestAccuracy: setStats.bestAccuracy,
          bestSpeed: setStats.bestSpeed
        });
      });

      setStats({
        education: educationStats,
        accuracy: accuracyStats,
        speed: speedStats,
        sets: setsStats
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const calculateEducationStats = (progress: any[]): QuizStats => {
    // Рахуємо тільки унікальні слова
    const uniqueWords = new Set(progress.map(p => p.word_id));
    const totalWords = uniqueWords.size;
    
    // Рахуємо тільки слова з short_memory > 15 як вивчені
    const learnedWords = progress.filter(p => p.short_memory > 15).length;
    const averageAccuracy = totalWords > 0 ? (learnedWords / totalWords) * 100 : 0;
    
    return {
      totalGames: 0, // Режим навчання не має окремих ігор
      totalWords: learnedWords, // Показуємо тільки вивчені слова
      averageAccuracy: Math.round(averageAccuracy),
      bestSpeed: 0,
      bestAccuracy: Math.round(averageAccuracy),
      totalTime: 0
    };
  };

  const calculateAccuracyStats = (results: any[]): QuizStats => {
    if (results.length === 0) {
      return { totalGames: 0, totalWords: 0, averageAccuracy: 0, bestSpeed: 0, bestAccuracy: 0, totalTime: 0 };
    }

    const totalGames = results.length;
    const totalWords = results.reduce((sum, r) => sum + (r.correct_answers || 0), 0);
    const averageAccuracy = results.reduce((sum, r) => sum + (r.accuracy || 0), 0) / totalGames;
    const bestAccuracy = Math.max(...results.map(r => r.accuracy || 0));
    const totalTime = results.reduce((sum, r) => sum + (r.time_spent || 0), 0);

    return {
      totalGames,
      totalWords,
      averageAccuracy: Math.round(averageAccuracy),
      bestSpeed: 0,
      bestAccuracy: Math.round(bestAccuracy),
      totalTime
    };
  };

  const calculateSpeedStats = (results: any[]): QuizStats => {
    if (results.length === 0) {
      return { totalGames: 0, totalWords: 0, averageAccuracy: 0, bestSpeed: 0, bestAccuracy: 0, totalTime: 0 };
    }

    const totalGames = results.length;
    const totalWords = results.reduce((sum, r) => sum + (r.correct_answers || 0), 0);
    const averageAccuracy = results.reduce((sum, r) => sum + (r.accuracy || 0), 0) / totalGames;
    const bestSpeed = Math.max(...results.map(r => r.words_per_minute || 0));
    const bestAccuracy = Math.max(...results.map(r => r.accuracy || 0));
    const totalTime = results.reduce((sum, r) => sum + (r.time_spent || 0), 0);

    return {
      totalGames,
      totalWords,
      averageAccuracy: Math.round(averageAccuracy),
      bestSpeed: Math.round(bestSpeed),
      bestAccuracy: Math.round(bestAccuracy),
      totalTime
    };
  };

  const calculateSetsStats = (accuracyResults: any[], speedResults: any[], userProgress: any[], sets: any[]): SetStats[] => {
    // Отримуємо унікальні набори
    const setIds = new Set([
      ...accuracyResults.map(r => r.set_id),
      ...speedResults.map(r => r.set_id),
      ...userProgress.map(p => p.set_id)
    ]);

    // Створюємо мапу назв наборів
    const setsMap = new Map(sets.map(s => [s.id, s.name]));

    return Array.from(setIds).map(setId => {
      // Найкращий результат в режимі точності для цього набору
      const setAccuracyResults = accuracyResults.filter(r => r.set_id === setId);
      let bestAccuracyDisplay = 'Немає';
      if (setAccuracyResults.length > 0) {
        const bestResult = setAccuracyResults.reduce((best, current) => 
          (current.correct_answers || 0) > (best.correct_answers || 0) ? current : best
        );
        const correctWords = bestResult.correct_answers || 0;
        if (correctWords === 20) {
          // Якщо всі 20 слів правильно - показуємо час
          const timeSpent = bestResult.time_spent || 0;
          const minutes = Math.floor(timeSpent / 60);
          const seconds = Math.floor(timeSpent % 60);
          bestAccuracyDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
          // Інакше показуємо кількість слів
          bestAccuracyDisplay = `${correctWords} слів`;
        }
      }

      // Найкращий результат в режимі швидкості для цього набору
      const setSpeedResults = speedResults.filter(r => r.set_id === setId);
      let bestSpeedDisplay = 'Немає';
      if (setSpeedResults.length > 0) {
        const bestResult = setSpeedResults.reduce((best, current) => 
          (current.correct_answers || 0) > (best.correct_answers || 0) ? current : best
        );
        const correctWords = bestResult.correct_answers || 0;
        bestSpeedDisplay = `${correctWords} слів`;
      }

      // Статистика навчання для цього набору
      const setProgress = userProgress.filter(p => p.set_id === setId);
      const uniqueWords = new Set(setProgress.map(p => p.word_id));
      const learnedWords = setProgress.filter(p => p.short_memory > 15).length;

      return {
        setId,
        setName: setsMap.get(setId) || `Набір ${setId.slice(0, 8)}...`,
        bestAccuracy: bestAccuracyDisplay,
        bestSpeed: bestSpeedDisplay,
        learnedWords,
        totalWords: uniqueWords.size
      };
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}г ${minutes}хв`;
    } else if (minutes > 0) {
      return `${minutes}хв ${secs}с`;
    } else {
      return `${secs}с`;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">Завантаження...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto card p-6">
        <h1 className="text-xl font-semibold mb-2">Потрібна авторизація</h1>
        <p className="text-gray-600">Будь ласка, <Link className="underline" href={withBasePath("/auth/sign-in")}>увійдіть</Link> щоб побачити акаунт.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Заголовок та основна інформація */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Профіль користувача</h1>
            <p className="text-gray-600 mt-2">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <Link className="btn btn-primary" href={withBasePath("/quiz")}>Перейти до квізів</Link>
            <Link className="btn btn-ghost" href={withBasePath("/quiz/manage")}>Керувати наборами</Link>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Загальна статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Загальна статистика</h3>
                <div className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.education.totalWords + stats.accuracy.totalWords + stats.speed.totalWords}
                </div>
                <p className="text-blue-700">Слів правильно в іграх</p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800">Середня точність</h3>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  {(() => {
                    const modes = [stats.education, stats.accuracy, stats.speed];
                    const activeModes = modes.filter(m => m.totalGames > 0 || m.totalWords > 0);
                    if (activeModes.length === 0) return 0;
                    const avg = activeModes.reduce((sum, m) => sum + m.averageAccuracy, 0) / activeModes.length;
                    return Math.round(avg);
                  })()}%
                </div>
                <p className="text-green-700">По всім режимам</p>
              </div>
              <div className="text-4xl">🎯</div>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-purple-800">Загальний час</h3>
                <div className="text-3xl font-bold text-purple-600 mt-2">
                  {formatTime(stats.accuracy.totalTime + stats.speed.totalTime)}
                </div>
                <p className="text-purple-700">В режимах точності та швидкості</p>
              </div>
              <div className="text-4xl">⏱️</div>
            </div>
          </div>
        </div>
      )}

      {/* Статистика по наборах */}
      {statsLoading ? (
        <div className="card p-6">
          <div className="text-center">Завантаження статистики...</div>
        </div>
            ) : stats ? (
        stats.sets.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Статистика по наборах</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.sets.map((setStats) => (
                <div key={setStats.setId} className="card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl">📚</div>
                    <h3 className="text-lg font-semibold">{setStats.setName}</h3>
                  </div>
                  <div className="space-y-3">
                    {/* Навчання */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Вивчено слів:</span>
                      <span className="font-semibold text-green-600">
                        {setStats.learnedWords}/{setStats.totalWords}
                      </span>
                    </div>
                    
                                       {/* Точність */}
                   <div className="flex justify-between items-center">
                     <span className="text-gray-600">Найкраща точність:</span>
                     <span className="font-semibold text-blue-600">
                       {setStats.bestAccuracy !== 'Немає' ? setStats.bestAccuracy : 'Немає'}
                     </span>
                   </div>
                   
                   {/* Швидкість */}
                   <div className="flex justify-between items-center">
                     <span className="text-gray-600">Найкраща швидкість:</span>
                     <span className="font-semibold text-red-600">
                       {setStats.bestSpeed !== 'Немає' ? setStats.bestSpeed : 'Немає'}
                     </span>
                   </div>
                    
                    {/* Прогрес-бар навчання */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${setStats.totalWords > 0 ? (setStats.learnedWords / setStats.totalWords) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-6">
            <div className="text-center text-gray-600">
              <div className="text-4xl mb-4">📊</div>
              <p>Почніть грати, щоб побачити статистику по наборах!</p>
              <Link className="btn btn-primary mt-4" href={withBasePath("/quiz")}>
                Перейти до квізів
              </Link>
            </div>
          </div>
        )
      ) : (
        <div className="card p-6">
          <div className="text-center text-gray-600">
            <div className="text-4xl mb-4">📊</div>
            <p>Почніть грати, щоб побачити статистику!</p>
            <Link className="btn btn-primary mt-4" href={withBasePath("/quiz")}>
              Перейти до квізів
            </Link>
          </div>
        </div>
      )}

      {/* Графіки та детальна статистика */}
      {stats && (stats.accuracy.totalGames > 0 || stats.speed.totalGames > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Графік прогресу */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold mb-4">Прогрес по днях</h3>
            <div className="h-64 flex items-end justify-center gap-2">
              {Array.from({ length: 7 }, (_, i) => {
                const dayStats = stats.accuracy.totalGames + stats.speed.totalGames;
                const height = Math.min((dayStats / 10) * 100, 100);
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div 
                      className="w-8 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t transition-all duration-300"
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="text-xs text-gray-500 mt-2">
                      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'][i]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Досягнення */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold mb-4">Досягнення</h3>
            <div className="space-y-3">
              {stats.education.totalWords >= 100 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl">🏆</div>
                  <div>
                    <div className="font-semibold text-yellow-800">Словник</div>
                    <div className="text-sm text-yellow-600">Вивчили 100+ слів</div>
                  </div>
                </div>
              )}
              {stats.accuracy.bestAccuracy >= 90 && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <div className="font-semibold text-green-800">Снайпер</div>
                    <div className="text-sm text-green-600">Точність 90%+ в режимі точності</div>
                  </div>
                </div>
              )}
              {stats.speed.bestSpeed >= 30 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl">⚡</div>
                  <div>
                    <div className="font-semibold text-red-800">Швидкість</div>
                    <div className="text-sm text-red-600">30+ слів/хв в режимі швидкості</div>
                  </div>
                </div>
              )}
              {stats.accuracy.totalGames + stats.speed.totalGames >= 10 && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl">🎮</div>
                  <div>
                    <div className="font-semibold text-purple-800">Гравець</div>
                    <div className="text-sm text-purple-600">10+ ігор зіграно</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
