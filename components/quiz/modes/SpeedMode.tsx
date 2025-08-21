"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { QuizSet, QuizWord } from "@/lib/quiz-data/types";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { createClient } from "@/lib/supabase-client";

export function SpeedMode({ setDef }: { setDef: QuizSet }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [allWords, setAllWords] = useState<QuizWord[]>([]);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState<QuizWord | null>(null);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(4 * 60); // 4 хвилини в секундах
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [skippedWords, setSkippedWords] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    // Перемішати всі слова
    const shuffled = [...setDef.words].sort(() => Math.random() - 0.5);
    setAllWords(shuffled);
    setCurrent(shuffled[0] || null);
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
    const wordsPerMinute = timeSpent > 0 ? (correctAnswers / timeSpent) * 60 : 0;
    
    // Для об'єднаних наборів зберігаємо результат для першого набору
    const targetSetId = setDef.id.startsWith('combined-') 
      ? setDef.id.replace('combined-', '').split('-')[0] 
      : setDef.id;
    
    const supabase = createClient();
    await supabase.from("speed_results").upsert({
      uid: userId,
      set_id: targetSetId,
      words_per_minute: Math.round(wordsPerMinute * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      time_spent: Math.round(timeSpent * 100) / 100,
      correct_answers: correctAnswers,
      total_attempts: totalAttempts,
      errors: errors,
      created_at: new Date().toISOString()
    });
  };

  const startGame = () => {
    setIsStarted(true);
    setStartTime(performance.now());
  };

  const getNextWord = () => {
    const availableWords = allWords.filter(word => !usedWords.has(word.id));
    if (availableWords.length === 0) {
      // Якщо всі слова використані, перемішати знову
      const shuffled = [...setDef.words].sort(() => Math.random() - 0.5);
      setAllWords(shuffled);
      setUsedWords(new Set());
      return shuffled[0] || null;
    }
    return availableWords[0] || null;
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
    
    setTotalAttempts(prev => prev + 1);
    
    if (ok) {
      setCorrectAnswers(prev => prev + 1);
      // Позначити слово як використане
      setUsedWords(prev => new Set([...prev, current.id]));
      // Отримати наступне слово
      const nextWord = getNextWord();
      setCurrent(nextWord);
    } else {
      setErrors(prev => prev + 1);
    }
    
    setInput("");
  }

  function skipWord() {
    if (!current || !isStarted || isFinished) return;
    
    setTotalAttempts(prev => prev + 1);
    setSkippedWords(prev => prev + 1);
    
    // Отримати наступне слово
    const nextWord = getNextWord();
    setCurrent(nextWord);
    
    setInput("");
  }

  function autoCheckAnswer(inputValue: string) {
    if (!current || !isStarted || isFinished) return;
    const normalizedInput = normalizeText(inputValue);
    const ok = acceptableAnswers.some(a => normalizeText(a) === normalizedInput);
    
    if (ok) {
      checkAnswer();
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;
  const timeSpent = startTime && endTime ? (endTime - startTime) / 1000 : 0;
  const wordsPerMinute = timeSpent > 0 ? (correctAnswers / timeSpent) * 60 : 0;

  if (!isStarted) {
    return (
      <div className="grid gap-6">
        <div className="card p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Режим «Швидкість»</h2>
          <div className="text-gray-600 mb-6">
            <p className="mb-2">• Випадкові слова без повторень</p>
            <p className="mb-2">• Час: 4 хвилини</p>
            <p className="mb-2">• Мета: ввести якнайбільше слів</p>
            <p>• Рахується швидкість (слова/хвилина)</p>
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
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{Math.round(wordsPerMinute)}</div>
              <div className="text-sm text-blue-700">Слів/хв</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
              <div className="text-sm text-green-700">Правильних</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{Math.round(accuracy)}%</div>
              <div className="text-sm text-yellow-700">Точність</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{errors}</div>
              <div className="text-sm text-red-700">Помилок</div>
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
      {/* Таймер та статистика */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-2xl font-mono font-bold">
          {formatTime(timeLeft)}
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-1">Прогрес</div>
          <ProgressBar value={(correctAnswers / Math.max(correctAnswers + 1, 1)) * 100} />
        </div>
        <div className="text-sm text-gray-600">
          Слов: {correctAnswers}
        </div>
      </div>

      {/* Статистика */}
      <div className="flex items-center gap-4 text-sm">
        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
          Швидкість: {Math.round(wordsPerMinute)} сл/хв
        </div>
        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
          Правильно: {correctAnswers}
        </div>
        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full">
          Помилок: {errors}
        </div>
        <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
          Пропущено: {skippedWords}
        </div>
        <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
          Точність: {Math.round(accuracy)}%
        </div>
      </div>

      {/* Поточне слово */}
      <div className="card p-6">
        {current ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm text-gray-500">Слово #{correctAnswers + 1}</div>
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
