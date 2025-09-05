"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { QuizSet, QuizWord } from "@/lib/quiz-data/types";
import { getSetProgress, saveWordProgress } from "@/lib/quiz-logic/persistence";
import { selectNextWord, isLearned, calcProgress } from "@/lib/quiz-logic/shortMemory";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { createClient } from "@/lib/supabase-client";

interface FlashCardModeProps {
  setDef: QuizSet;
  onGameStateChange?: (isActive: boolean) => void;
}

export function FlashCardMode({ setDef, onGameStateChange }: FlashCardModeProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [words, setWords] = useState<QuizWord[]>(() => setDef.words.map(w => ({ ...w, shortMemory: 0 })));
  const [current, setCurrent] = useState<QuizWord | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [askedHistoryIds, setAskedHistoryIds] = useState<string[]>([]);
  const [feedbackWords, setFeedbackWords] = useState<Array<{ id: string; hint: string; answer: string; remaining: number }>>([]);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [wordCounter, setWordCounter] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const startedAtRef = useRef(performance.now());

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const progress = await getSetProgress(userId, setDef.id);
      const merged = setDef.words.map(w => ({
        ...w,
        shortMemory: (progress as any)[w.id]?.shortMemory ?? 0,
      }));
      if (!mounted) return;
      setWords(merged);
      // При первинному виборі також врахуємо історію (порожня на старті)
      let selectable = merged.filter(w => !isLearned(w) && !askedHistoryIds.includes(w.id) && !blockedWords.includes(w.id));
      if (selectable.length === 0) {
        // Якщо вибору немає, дозволимо з історії
        selectable = merged.filter(w => !isLearned(w) && !blockedWords.includes(w.id));
      }
      if (selectable.length === 0) {
        // Якщо все ще немає вибору, дозволимо все крім вивчених
        selectable = merged.filter(w => !isLearned(w));
      }
      // Якщо всі слова в feedback, дозволимо їх
      if (selectable.length === 0 && feedbackWords.length > 0) {
        selectable = merged.filter(w => !isLearned(w));
      }
      // Якщо все ще немає вибору, дозволимо вивчені слова
      if (selectable.length === 0) {
        selectable = merged.filter(w => !askedHistoryIds.includes(w.id) && !blockedWords.includes(w.id));
      }
      // Якщо все ще немає вибору, показуємо будь-яке слово
      if (selectable.length === 0) {
        selectable = merged.filter(w => !blockedWords.includes(w.id));
      }
      // Якщо всі слова заблоковані, показуємо будь-яке слово
      if (selectable.length === 0) {
        selectable = merged;
      }
      setCurrent(selectable.length ? selectNextWord(selectable) : null);
      startedAtRef.current = performance.now();
    })();
    return () => { mounted = false; };
  }, [userId, setDef.id]);

  const progress = calcProgress(words);

  const startSession = () => {
    setIsStarted(true);
    onGameStateChange?.(true);
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  async function applyResult(ok: boolean) {
    const nextWords = words.map(w => {
      if (!current || w.id !== current.id) return w;
      // Якщо це вивчене слово і відповідь неправильна, скинути до 0
      const newShortMemory = ok ? (w.shortMemory ?? 0) + 1 : 0;
      return { ...w, shortMemory: newShortMemory };
    });
    setWords(nextWords);

    if (current) {
      // Використовуємо originalSetId якщо є (для об'єднаних наборів), інакше setDef.id
      let targetSetId = current.originalSetId || setDef.id;
      
      // Для "Всі слова" зберігаємо з оригінальним set_id слова
      if (setDef.id === 'all-words-combined' && current.originalSetId) {
        targetSetId = current.originalSetId;
      }
      
      await saveWordProgress(userId, targetSetId, current.id, {
        shortMemory: nextWords.find(w => w.id === current.id)?.shortMemory ?? 0,
      });
    }

    // Оновити історію (відкласти поточне слово мінімум на 3 наступних)
    const newHistory = current ? [...askedHistoryIds, current.id].slice(-3) : askedHistoryIds;
    setAskedHistoryIds(newHistory);

    // Зменшити лічильник для всіх feedback слів (крім поточного, якщо він щойно доданий) і видалити ті, що досягли 0
    setFeedbackWords(prev => {
      const updated = prev.map(word => ({
        ...word,
        remaining: word.id === current?.id ? word.remaining : word.remaining - 1
      })).filter(word => word.remaining > 0);
      
      // Оновити заблоковані слова - видалити ті, що досягли лічильника 0
      const remainingIds = updated.map(word => word.id);
      setBlockedWords(prevBlocked => {
        const newBlocked = prevBlocked.filter(id => remainingIds.includes(id));
        return newBlocked;
      });
      
      return updated;
    });

    // Визначити чи потрібно показати вивчене слово для повторення
    const unlearnedCount = nextWords.filter(w => !isLearned(w) && !newHistory.includes(w.id) && !blockedWords.includes(w.id)).length;
    const shouldShowLearned = wordCounter % 10 === 0 || 
      unlearnedCount < 3 || 
      calcProgress(nextWords) === 100;
    
    let pool: QuizWord[] = [];
    
    if (shouldShowLearned) {
      // Показати вивчене слово для повторення
      const learnedWords = nextWords.filter(w => isLearned(w) && !newHistory.includes(w.id) && !blockedWords.includes(w.id));
      if (learnedWords.length > 0) {
        const selectedWord = selectNextWord(learnedWords);
        if (selectedWord) {
          pool = [selectedWord];
        }
      }
      // Якщо прогрес 100%, можна показувати і невивчені слова для повторення
      if (pool.length === 0 && calcProgress(nextWords) === 100) {
        const allWords = nextWords.filter(w => !newHistory.includes(w.id) && !blockedWords.includes(w.id));
        if (allWords.length > 0) {
          const selectedWord = selectNextWord(allWords);
          if (selectedWord) {
            pool = [selectedWord];
          }
        }
      }
    }
    
    // Якщо не показуємо вивчене або немає вивчених, показуємо невивчені
    if (pool.length === 0) {
      pool = nextWords.filter(w => !isLearned(w) && !newHistory.includes(w.id) && !blockedWords.includes(w.id));
      
      if (pool.length === 0) {
        // Якщо вибору немає, дозволимо з історії (щоб не зациклитись)
        pool = nextWords.filter(w => !isLearned(w) && !blockedWords.includes(w.id));
      }
      if (pool.length === 0) {
        // Якщо все ще немає вибору, дозволимо все крім вивчених
        pool = nextWords.filter(w => !isLearned(w));
      }
      // Якщо всі слова в feedback, дозволимо їх
      if (pool.length === 0 && feedbackWords.length > 0) {
        pool = nextWords.filter(w => !isLearned(w));
      }
    }
    
    // Якщо все ще немає слів (всі вивчені), показуємо будь-яке слово для повторення
    if (pool.length === 0) {
      pool = nextWords.filter(w => !newHistory.includes(w.id) && !blockedWords.includes(w.id));
      
      if (pool.length === 0) {
        // Якщо все ще немає вибору, показуємо будь-яке слово
        pool = nextWords.filter(w => !blockedWords.includes(w.id));
      }
      
      if (pool.length === 0) {
        // Якщо всі слова заблоковані, показуємо будь-яке слово
        pool = nextWords;
      }
    }
    
    // Змішати pool перед вибором для більшої випадковості
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    setCurrent(shuffledPool.length ? shuffledPool[0] : null);
    setIsFlipped(false);
  }

  function processAnswer(ok: boolean) {
    if (!current) return;
    
    if (!ok) {
      // Додати або оновити слово в feedback
      setFeedbackWords(prev => {
        const existingIndex = prev.findIndex(w => w.id === current.id);
        if (existingIndex >= 0) {
          // Якщо слово вже є, оновити лічильник на максимум
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            remaining: Math.max(updated[existingIndex].remaining, 5)
          };
          return updated;
        } else {
          // Додати нове слово з лічильником 5
          return [
            ...prev,
            {
              id: current.id,
              hint: current.hint,
              answer: Array.isArray(current.answer) ? current.answer.join(", ") : current.answer,
              remaining: 5
            }
          ];
        }
      });
      // Заблокувати слово на 5 наступних вводів
      setBlockedWords(prev => [...prev, current.id]);
    }
    
    setWordCounter(prev => prev + 1);
    applyResult(ok);
    startedAtRef.current = performance.now();
  }

  if (!words.length) {
    return (
      <div className="text-center text-gray-600 py-8">
        <div className="text-4xl mb-4">📚</div>
        <p>Немає слів для вивчення в цьому наборі.</p>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">🃏 Режим Флеш-карток</h2>
          <p className="text-gray-600 mb-4">
            Вивчайте слова з флеш-картками. Переглядайте слово, натисніть "Показати відповідь", 
            а потім оцініть, чи знали ви це слово.
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Як працює режим:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Подивіться на слово/фразу</li>
            <li>• Натисніть "Показати відповідь"</li>
            <li>• Оцініть свої знання: "Знаю", "Не знаю"</li>
            <li>• Слово вважається вивченим після 15 правильних відповідей</li>
            <li>• Система адаптивних повторень як в режимі навчання</li>
          </ul>
        </div>

        <div className="mb-6">
          <p className="text-lg">
            <strong>{words.length}</strong> слів для вивчення
          </p>
        </div>

        <button 
          onClick={startSession}
          className="btn btn-primary btn-lg"
        >
          Почати вивчення
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="ml-auto w-full md:w-64">
          <ProgressBar value={progress} />
        </div>
      </div>

      <div className="card p-6">
        {current ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm text-gray-500">Підказка</div>
              {isLearned(current) && (
                <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Повторення
                </div>
              )}
              {calcProgress(words) === 100 && (
                <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Всі вивчені!
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-2xl md:text-3xl font-semibold">{current.hint}</div>
              <div className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {current.shortMemory ?? 0}/15
              </div>
              <div className="text-xs text-gray-500">
                Доступно: {words.filter(w => !isLearned(w) && !askedHistoryIds.includes(w.id) && !blockedWords.includes(w.id)).length}
              </div>
            </div>

            {/* Флеш-картка */}
            <div className="mt-6">
              <div 
                className="bg-white border-2 border-gray-200 rounded-lg p-4 md:p-8 min-h-[150px] md:min-h-[200px] flex items-center justify-center cursor-pointer transition-all duration-300 hover:border-blue-300"
                onClick={flipCard}
              >
                <div className="text-center">
                  {!isFlipped ? (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">Слово/Фраза</div>
                      <div className="text-lg md:text-2xl font-bold text-gray-800">
                        {current.hint}
                      </div>
                      <div className="text-sm text-gray-400 mt-4">
                        Натисніть, щоб показати відповідь
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">Відповідь</div>
                      <div className="text-lg md:text-xl font-semibold text-gray-800">
                        {Array.isArray(current.answer) ? current.answer.join(", ") : current.answer}
                      </div>
                      <div className="text-sm text-gray-400 mt-4">
                        Натисніть, щоб приховати відповідь
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Кнопки дій */}
            {isFlipped && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <button 
                  onClick={() => processAnswer(true)}
                  className="btn btn-success text-sm md:text-base py-3 md:py-2"
                >
                  ✅ Знаю
                </button>
                <button 
                  onClick={() => processAnswer(false)}
                  className="btn btn-error text-sm md:text-base py-3 md:py-2"
                >
                  ❌ Не знаю
                </button>
              </div>
            )}

            {/* Кнопка показати відповідь */}
            {!isFlipped && (
              <div className="mt-6 text-center">
                <button 
                  onClick={flipCard}
                  className="btn btn-primary text-sm md:text-base py-3 md:py-2"
                >
                  Показати відповідь
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-700">
            Завантаження наступного слова...
          </div>
        )}
      </div>

      {feedbackWords.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <div className="text-sm font-semibold text-red-800">Неправильні відповіді</div>
            <div className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              {feedbackWords.length} слів
            </div>
          </div>
          <div className="grid gap-2">
            {feedbackWords.map((word, index) => (
              <div key={word.id} className="flex items-center justify-between bg-white/60 rounded-md p-2 border border-red-100">
                <div className="text-sm text-gray-800">
                  <span className="font-medium text-red-700">{word.hint}</span>
                  <span className="text-gray-500 mx-1">→</span>
                  <span className="font-semibold text-green-700">{word.answer}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="text-xs text-gray-500">залишилося</div>
                  <div className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full min-w-[20px] text-center">
                    {word.remaining}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
