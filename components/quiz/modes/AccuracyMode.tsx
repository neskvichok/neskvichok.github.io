"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { QuizSet, QuizWord } from "@/lib/quiz-data/types";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { createClient } from "@/lib/supabase-client";

export function AccuracyMode({ setDef }: { setDef: QuizSet }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [words, setWords] = useState<QuizWord[]>([]);
  const [current, setCurrent] = useState<QuizWord | null>(null);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(4 * 60); // 4 хвилини в секундах
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [skippedWords, setSkippedWords] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [completedWords, setCompletedWords] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    // Вибір випадкових 20 слів з набору
    const shuffled = [...setDef.words].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, 20);
    setWords(selectedWords);
    setCurrent(selectedWords[0] || null);
  }, [setDef]);

  useEffect(() => {
    if (isStarted && !isFinished && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isStarted, isFinished, timeLeft]);

  const finishGame = () => {
    setIsFinished(true);
    setEndTime(performance.now());
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // Зберегти результати
    saveResults();
  };

  const saveResults = async () => {
    if (!userId || !startTime || !endTime) return;
    
    const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;
    const timeSpent = (endTime - startTime) / 1000; // в секундах
    
    // Для об'єднаних наборів зберігаємо результат для першого набору
    const targetSetId = setDef.id.startsWith('combined-') 
      ? setDef.id.replace('combined-', '').split('-')[0] 
      : setDef.id;
    
    const supabase = createClient();
    await supabase.from("accuracy_results").upsert({
      uid: userId,
      set_id: targetSetId,
      accuracy: Math.round(accuracy * 100) / 100,
      time_spent: Math.round(timeSpent * 100) / 100,
      correct_answers: correctAnswers,
      total_attempts: totalAttempts,
      errors: errors,
      words_completed: currentWordIndex,
      created_at: new Date().toISOString()
    });
  };

  const startGame = () => {
    setIsStarted(true);
    setStartTime(performance.now());
  };

  const acceptableAnswers = useMemo(() => {
    if (!current) return [] as string[];
    return Array.isArray(current.answer) ? current.answer : [current.answer];
  }, [current]);

  function normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^\wа-яіїєґ]/g, '');
  }

  function checkAnswer() {
    if (!current || !isStarted || isFinished) return;
    
    const normalizedInput = normalizeText(input);
    const ok = acceptableAnswers.some(a => normalizeText(a) === normalizedInput);
    
    // Додати логування для дебагу
    console.log('CheckAnswer:', {
      input: input,
      normalizedInput: normalizedInput,
      acceptableAnswers: acceptableAnswers,
      normalizedAnswers: acceptableAnswers.map(a => normalizeText(a)),
      ok: ok
    });
    
    setTotalAttempts(prev => prev + 1);
    
    if (ok) {
      setCorrectAnswers(prev => prev + 1);
      // Позначити слово як завершене
      setCompletedWords(prev => new Set([...prev, current.id]));
      
      // Перевірити чи всі слова завершені
      if (completedWords.size + 1 >= words.length) {
        finishGame();
      } else {
        // Знайти наступне незавершене слово
        const nextWord = words.find(w => !completedWords.has(w.id) && w.id !== current.id);
        if (nextWord) {
          setCurrent(nextWord);
        } else {
          finishGame();
        }
      }
    } else {
      setErrors(prev => prev + 1);
    }
    
    setInput("");
  }

  function skipWord() {
    if (!current || !isStarted || isFinished) return;
    
    setTotalAttempts(prev => prev + 1);
    setSkippedWords(prev => prev + 1);
    
    // Знайти наступне незавершене слово
    const nextWord = words.find(w => !completedWords.has(w.id) && w.id !== current.id);
    if (nextWord) {
      setCurrent(nextWord);
    } else {
      finishGame();
    }
    
    setInput("");
  }

  function autoCheckAnswer(inputValue: string) {
    if (!current || !isStarted || isFinished) return;
    const normalizedInput = normalizeText(inputValue);
    const ok = acceptableAnswers.some(a => normalizeText(a) === normalizedInput);
    
    // Додати логування для дебагу
    console.log('AutoCheckAnswer:', {
      inputValue: inputValue,
      normalizedInput: normalizedInput,
      acceptableAnswers: acceptableAnswers,
      normalizedAnswers: acceptableAnswers.map(a => normalizeText(a)),
      ok: ok
    });
    
    if (ok) {
      // Викликати checkAnswer з правильним inputValue
      const normalizedInputForCheck = normalizeText(inputValue);
      const okForCheck = acceptableAnswers.some(a => normalizeText(a) === normalizedInputForCheck);
      
      setTotalAttempts(prev => prev + 1);
      
      if (okForCheck) {
        setCorrectAnswers(prev => prev + 1);
        // Позначити слово як завершене
        setCompletedWords(prev => new Set([...prev, current.id]));
        
        // Перевірити чи всі слова завершені
        if (completedWords.size + 1 >= words.length) {
          finishGame();
        } else {
          // Знайти наступне незавершене слово
          const nextWord = words.find(w => !completedWords.has(w.id) && w.id !== current.id);
          if (nextWord) {
            setCurrent(nextWord);
          } else {
            finishGame();
          }
        }
      } else {
        setErrors(prev => prev + 1);
      }
      
      setInput("");
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;
  const progress = (completedWords.size / words.length) * 100;

  if (!isStarted) {
    return (
      <div className="grid gap-6">
        <div className="card p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Режим «Точність»</h2>
          <div className="text-gray-600 mb-6">
            <p className="mb-2">• Вам дається 20 слів</p>
            <p className="mb-2">• Час: 4 хвилини</p>
            <p className="mb-2">• Мета: ввести всі слова правильно</p>
            <p>• Рахується точність та кількість помилок</p>
          </div>
          <button 
            className="btn btn-primary text-lg px-8 py-3"
            onClick={startGame}
          >
            Почати
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="grid gap-6">
        <div className="card p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Результати</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{Math.round(accuracy)}%</div>
              <div className="text-sm text-green-700">Точність</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{correctAnswers}/{words.length}</div>
              <div className="text-sm text-blue-700">Правильних</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{errors}</div>
              <div className="text-sm text-red-700">Помилок</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{skippedWords}</div>
              <div className="text-sm text-yellow-700">Пропущено</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{formatTime(4 * 60 - timeLeft)}</div>
              <div className="text-sm text-gray-700">Час</div>
            </div>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Спробувати ще раз
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Таймер та прогрес */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-2xl font-mono font-bold">
          {formatTime(timeLeft)}
        </div>
        <div className="flex-1">
          <ProgressBar value={progress} />
        </div>
        <div className="text-sm text-gray-600">
          {completedWords.size} / {words.length}
        </div>
      </div>

      {/* Статистика */}
      <div className="flex items-center gap-4 text-sm">
        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
          Правильно: {correctAnswers}
        </div>
        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full">
          Помилок: {errors}
        </div>
        <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
          Пропущено: {skippedWords}
        </div>
        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
          Точність: {Math.round(accuracy)}%
        </div>
      </div>

      {/* Поточне слово */}
      <div className="card p-6">
        {current ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm text-gray-500">Слово {currentWordIndex + 1}</div>
            </div>
            <div className="text-2xl md:text-3xl font-semibold mb-4">{current.hint}</div>

            <div className="flex items-center gap-3">
              <input
                className="input flex-1"
                placeholder="Введіть відповідь..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoCheckAnswer(e.target.value);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') checkAnswer(); }}
                autoFocus
              />
              <button className="btn btn-primary" onClick={checkAnswer}>
                Перевірити
              </button>
              <button className="btn btn-outline" onClick={skipWord}>
                Пропустити
              </button>
            </div>
          </>
        ) : (
          <div className="text-gray-700">Завантаження...</div>
        )}
      </div>
    </div>
  );
}
