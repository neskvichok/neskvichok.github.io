"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { QuizSet, QuizWord } from "@/lib/quiz-data/types";
import { getSetProgress, saveWordProgress } from "@/lib/quiz-logic/persistence";
import { selectNextWord, isLearned, calcProgress } from "@/lib/quiz-logic/shortMemory";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { createClient } from "@/lib/supabase-client";

export function EducationMode({ setDef }: { setDef: QuizSet }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [words, setWords] = useState<QuizWord[]>(() => setDef.words.map(w => ({ ...w, shortMemory: 0 })));
  const [current, setCurrent] = useState<QuizWord | null>(null);
  const [input, setInput] = useState("");
  const [askedHistoryIds, setAskedHistoryIds] = useState<string[]>([]);
  const [feedbackWords, setFeedbackWords] = useState<Array<{ id: string; hint: string; answer: string; remaining: number }>>([]);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [wordCounter, setWordCounter] = useState(0);
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
      setCurrent(selectable.length ? selectNextWord(selectable) : null);
      startedAtRef.current = performance.now();
    })();
    return () => { mounted = false; };
  }, [userId, setDef.id]);

  const acceptableAnswers = useMemo(() => {
    if (!current) return [] as string[];
    return Array.isArray(current.answer) ? current.answer : [current.answer];
  }, [current]);

  async function applyResult(ok: boolean) {
    const nextWords = words.map(w => {
      if (!current || w.id !== current.id) return w;
      // Якщо це вивчене слово і відповідь неправильна, скинути до 0
      const newShortMemory = ok ? (w.shortMemory ?? 0) + 1 : 0;
      return { ...w, shortMemory: newShortMemory };
    });
    setWords(nextWords);

    if (current) {
      await saveWordProgress(userId, setDef.id, current.id, {
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
        console.log("Feedback words:", updated.length, "Blocked words:", newBlocked.length);
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
      console.log("Available unlearned words:", pool.length, "from", nextWords.length);
      console.log("History:", newHistory.length, "Blocked:", blockedWords.length);
      console.log("History IDs:", newHistory);
      console.log("Blocked IDs:", blockedWords);
      
      if (pool.length === 0) {
        // Якщо вибору немає, дозволимо з історії (щоб не зациклитись)
        pool = nextWords.filter(w => !isLearned(w) && !blockedWords.includes(w.id));
        console.log("Using words from history:", pool.length);
      }
      if (pool.length === 0) {
        // Якщо все ще немає вибору, дозволимо все крім вивчених
        pool = nextWords.filter(w => !isLearned(w));
        console.log("Using all unlearned words:", pool.length);
      }
      // Якщо всі слова в feedback, дозволимо їх
      if (pool.length === 0 && feedbackWords.length > 0) {
        pool = nextWords.filter(w => !isLearned(w));
        console.log("Using words despite feedback:", pool.length);
      }
    }
    
    console.log("Final pool size:", pool.length, "Selected word:", pool[0]?.hint);
    console.log("Available words:", pool.map(w => w.hint).join(', '));
    console.log("All words shortMemory:", nextWords.map(w => `${w.hint}:${w.shortMemory}`).join(', '));
    
    // Додаткове логування для selectNextWord
    if (pool.length > 0) {
      const minShortMemory = Math.min(...pool.map(w => w.shortMemory ?? 0));
      const candidates = pool.filter(w => (w.shortMemory ?? 0) === minShortMemory);
      console.log(`Min shortMemory: ${minShortMemory}, Candidates: ${candidates.length}`);
    }
    
    // Змішати pool перед вибором для більшої випадковості
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    setCurrent(shuffledPool.length ? shuffledPool[0] : null);
  }

  // Функція для нормалізації тексту (видаляє пробіли, приводить до нижнього регістру)
  function normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, '') // Видаляє всі пробіли, табуляції, переноси рядків
      .replace(/[^\wа-яіїєґ]/g, ''); // Видаляє всі символи крім букв і цифр
  }

  // Автоматична перевірка під час введення
  function autoCheckAnswer(inputValue: string) {
    if (!current) return;
    const normalizedInput = normalizeText(inputValue);
    const ok = acceptableAnswers.some(a => normalizeText(a) === normalizedInput);
    
    if (ok) {
      // Миттєва реакція без затримки
      processAnswer(true);
    }
  }

  function checkAnswer() {
    if (!current) return;
    const normalizedInput = normalizeText(input);
    const ok = acceptableAnswers.some(a => normalizeText(a) === normalizedInput);
    processAnswer(ok);
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
              answer: acceptableAnswers.join(", "),
              remaining: 5
            }
          ];
        }
      });
      // Заблокувати слово на 5 наступних вводів
      setBlockedWords(prev => [...prev, current.id]);
    }
    

    setInput("");
    setWordCounter(prev => prev + 1);
    applyResult(ok);
    startedAtRef.current = performance.now();
  }

  const progress = calcProgress(words);

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

            <div className="mt-4 flex items-center gap-3">
              <input
                className="input"
                placeholder="Введіть відповідь..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoCheckAnswer(e.target.value);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') checkAnswer(); }}
                autoFocus
              />
              <button className="btn btn-primary" onClick={checkAnswer}>Перевірити</button>
            </div>

            {/* Приховано підказку про можливі відповіді */}
          </>
        ) : (
          <div className="text-gray-700">
            Усі слова в наборі позначені як <b>вивчені</b> (shortMemory &gt; 15). Тепер можна повторювати всі слова!
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


