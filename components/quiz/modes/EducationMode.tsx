"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { QuizSet, QuizWord } from "@/lib/quiz-data/types";
import { getSetProgress, saveWordProgress, getSetStats, saveSetStats } from "@/lib/quiz-logic/persistence";
import { selectNextWord, isLearned, calcProgress } from "@/lib/quiz-logic/shortMemory";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { createClient } from "@/lib/supabase-client";

export function EducationMode({ setDef }: { setDef: QuizSet }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [words, setWords] = useState<QuizWord[]>(() => setDef.words.map(w => ({ ...w, shortMemory: 0 })));
  const [current, setCurrent] = useState<QuizWord | null>(null);
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [askedHistoryIds, setAskedHistoryIds] = useState<string[]>([]);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const startedAtRef = useRef(performance.now());

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [progress, stats] = await Promise.all([
        getSetProgress(userId, setDef.id),
        getSetStats(userId, setDef.id),
      ]);
      const merged = setDef.words.map(w => ({
        ...w,
        shortMemory: (progress as any)[w.id]?.shortMemory ?? 0,
      }));
      if (!mounted) return;
      setWords(merged);
      setAttempts(stats.attempts ?? 0);
      setCorrect(stats.correct ?? 0);
      // При первинному виборі також врахуємо історію (порожня на старті)
      const selectable = merged.filter(w => !isLearned(w) && !askedHistoryIds.includes(w.id));
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
      return { ...w, shortMemory: ok ? (w.shortMemory ?? 0) + 1 : 0 };
    });
    setWords(nextWords);

    if (current) {
      await saveWordProgress(userId, setDef.id, current.id, {
        shortMemory: nextWords.find(w => w.id === current.id)?.shortMemory ?? 0,
      });
    }

    // Оновити історію (відкласти поточне слово мінімум на 5 наступних)
    const newHistory = current ? [...askedHistoryIds, current.id].slice(-5) : askedHistoryIds;
    setAskedHistoryIds(newHistory);

    // Кандидати без вивчених і без тих, що у недавній історії
    let pool = nextWords.filter(w => !isLearned(w) && !newHistory.includes(w.id));
    if (pool.length === 0) {
      // Якщо вибору немає, дозволимо з історії (щоб не зациклитись)
      pool = nextWords.filter(w => !isLearned(w));
    }
    setCurrent(pool.length ? selectNextWord(pool) : null);
  }

  function checkAnswer() {
    if (!current) return;
    const ans = input.trim().toLowerCase();
    const ok = acceptableAnswers.some(a => a.trim().toLowerCase() === ans);
    setLastFeedback(ok ? null : `Правильна відповідь: ${acceptableAnswers.join(", ")}`);
    setAttempts(a => {
      const next = a + 1;
      saveSetStats(userId, setDef.id, { attempts: next, correct: ok ? (correct + 1) : correct });
      return next;
    });
    setCorrect(c => {
      const next = c + (ok ? 1 : 0);
      saveSetStats(userId, setDef.id, { attempts: attempts + 1, correct: next });
      return next;
    });
    setInput("");
    applyResult(ok);
    startedAtRef.current = performance.now();
  }

  const progress = calcProgress(words);

  return (
    <div className="grid gap-6">
      {lastFeedback && (
        <div className="text-sm text-red-600">{lastFeedback}</div>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="badge">Attempts: {attempts}</div>
        <div className="badge">Correct: {correct}</div>
        <div className="ml-auto w-full md:w-64">
          <ProgressBar value={progress} />
        </div>
      </div>

      <div className="card p-6">
        {current ? (
          <>
            <div className="text-sm text-gray-500 mb-1">Підказка</div>
            <div className="text-2xl md:text-3xl font-semibold">{current.hint}</div>

            <div className="mt-4 flex items-center gap-3">
              <input
                className="input"
                placeholder="Введіть відповідь..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') checkAnswer(); }}
                autoFocus
              />
              <button className="btn btn-primary" onClick={checkAnswer}>Перевірити</button>
            </div>

            {/* Приховано підказку про можливі відповіді */}
          </>
        ) : (
          <div className="text-gray-700">
            Усі слова в наборі позначені як <b>вивчені</b> (shortMemory &gt; 15). Обери інший набір або зменш поріг.
          </div>
        )}
      </div>
    </div>
  );
}


