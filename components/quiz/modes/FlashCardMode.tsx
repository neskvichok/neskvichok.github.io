"use client";
import { useState, useEffect, useRef } from "react";
import type { QuizSet, QuizWord } from "@/lib/quiz-data/types";
import { saveWordProgress } from "@/lib/quiz-logic/persistence";

interface FlashCardModeProps {
  setDef: QuizSet;
  onGameStateChange?: (isActive: boolean) => void;
}

export function FlashCardMode({ setDef, onGameStateChange }: FlashCardModeProps) {
  const [words, setWords] = useState<QuizWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [knownWords, setKnownWords] = useState<Set<string>>(new Set());
  const [unknownWords, setUnknownWords] = useState<Set<string>>(new Set());
  const [reviewWords, setReviewWords] = useState<Set<string>>(new Set());
  
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord = words[currentIndex];
  const totalWords = words.length;
  const progress = totalWords > 0 ? ((currentIndex + 1) / totalWords) * 100 : 0;

  useEffect(() => {
    if (setDef?.words) {
      setWords([...setDef.words]);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsStarted(false);
      setIsFinished(false);
      setCorrectCount(0);
      setIncorrectCount(0);
      setSkippedCount(0);
      setStartTime(null);
      setEndTime(null);
      setKnownWords(new Set());
      setUnknownWords(new Set());
      setReviewWords(new Set());
    }
  }, [setDef]);

  const startSession = () => {
    setIsStarted(true);
    setStartTime(Date.now());
    onGameStateChange?.(true);
  };

  const finishSession = () => {
    setIsFinished(true);
    setEndTime(Date.now());
    onGameStateChange?.(false);
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const markAsKnown = async () => {
    if (!currentWord) return;
    
    setKnownWords(prev => new Set([...prev, currentWord.id]));
    setCorrectCount(prev => prev + 1);
    
    // Зберігаємо прогрес
    await saveWordProgress(null, currentWord.originalSetId || setDef.id, currentWord.id, { shortMemory: 20 }); // Високий прогрес для відомих слів
    
    nextWord();
  };

  const markAsUnknown = async () => {
    if (!currentWord) return;
    
    setUnknownWords(prev => new Set([...prev, currentWord.id]));
    setIncorrectCount(prev => prev + 1);
    
    // Зберігаємо прогрес
    await saveWordProgress(null, currentWord.originalSetId || setDef.id, currentWord.id, { shortMemory: 1 }); // Низький прогрес для невідомих слів
    
    nextWord();
  };

  const markForReview = async () => {
    if (!currentWord) return;
    
    setReviewWords(prev => new Set([...prev, currentWord.id]));
    setSkippedCount(prev => prev + 1);
    
    // Зберігаємо прогрес
    await saveWordProgress(null, currentWord.originalSetId || setDef.id, currentWord.id, { shortMemory: 5 }); // Середній прогрес для повторення
    
    nextWord();
  };

  const nextWord = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      finishSession();
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsStarted(false);
    setIsFinished(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setSkippedCount(0);
    setStartTime(null);
    setEndTime(null);
    setKnownWords(new Set());
    setUnknownWords(new Set());
    setReviewWords(new Set());
    onGameStateChange?.(false);
  };

  const getTimeSpent = () => {
    if (!startTime) return 0;
    const end = endTime || Date.now();
    return Math.floor((end - startTime) / 1000);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}хв ${secs}с` : `${secs}с`;
  };

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
            <li>• Оцініть свої знання: "Знаю", "Не знаю", "Повторити"</li>
            <li>• Переходьте до наступного слова</li>
          </ul>
        </div>

        <div className="mb-6">
          <p className="text-lg">
            <strong>{totalWords}</strong> слів для вивчення
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

  if (isFinished) {
    const timeSpent = getTimeSpent();
    const accuracy = totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 0;

    return (
      <div className="text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">🎉 Сесія завершена!</h2>
          <p className="text-gray-600">Ви пройшли всі флеш-картки в цьому наборі.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{correctCount}</div>
            <div className="text-sm text-green-700">Знаю</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{incorrectCount}</div>
            <div className="text-sm text-red-700">Не знаю</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{skippedCount}</div>
            <div className="text-sm text-yellow-700">Повторити</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{formatTime(timeSpent)}</div>
            <div className="text-sm text-blue-700">Час</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-lg">
            <strong>Точність:</strong> {accuracy}%
          </div>
        </div>

        <div className="space-x-4">
          <button 
            onClick={resetSession}
            className="btn btn-primary"
          >
            Повторити
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Прогрес */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            Слово {currentIndex + 1} з {totalWords}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Флеш-картка */}
      <div className="mb-8">
        <div 
          className="bg-white border-2 border-gray-200 rounded-lg p-4 md:p-8 min-h-[150px] md:min-h-[200px] flex items-center justify-center cursor-pointer transition-all duration-300 hover:border-blue-300"
          onClick={flipCard}
        >
          <div className="text-center">
            {!isFlipped ? (
              <div>
                <div className="text-sm text-gray-500 mb-2">Слово/Фраза</div>
                <div className="text-lg md:text-2xl font-bold text-gray-800">
                  {currentWord?.hint}
                </div>
                <div className="text-sm text-gray-400 mt-4">
                  Натисніть, щоб показати відповідь
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm text-gray-500 mb-2">Відповідь</div>
                <div className="text-lg md:text-xl font-semibold text-gray-800">
                  {Array.isArray(currentWord?.answer) ? currentWord.answer.join(", ") : currentWord?.answer}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
          <button 
            onClick={markAsKnown}
            className="btn btn-success text-sm md:text-base py-3 md:py-2"
          >
            ✅ Знаю
          </button>
          <button 
            onClick={markAsUnknown}
            className="btn btn-error text-sm md:text-base py-3 md:py-2"
          >
            ❌ Не знаю
          </button>
          <button 
            onClick={markForReview}
            className="btn btn-warning text-sm md:text-base py-3 md:py-2"
          >
            🔄 Повторити
          </button>
        </div>
      )}

      {/* Кнопка показати/приховати відповідь */}
      {!isFlipped && (
        <div className="text-center">
          <button 
            onClick={flipCard}
            className="btn btn-primary text-sm md:text-base py-3 md:py-2"
          >
            Показати відповідь
          </button>
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="font-semibold text-green-600">{correctCount}</div>
          <div className="text-green-700">Знаю</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="font-semibold text-red-600">{incorrectCount}</div>
          <div className="text-red-700">Не знаю</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="font-semibold text-yellow-600">{skippedCount}</div>
          <div className="text-yellow-700">Повторити</div>
        </div>
      </div>
    </div>
  );
}
