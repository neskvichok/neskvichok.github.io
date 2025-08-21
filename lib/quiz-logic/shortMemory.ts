import type { QuizWord } from "@/lib/quiz-data/types";

export const LEARNED_THRESHOLD = 15;

export function isLearned(word: QuizWord): boolean {
  return (word.shortMemory ?? 0) > LEARNED_THRESHOLD;
}

export function selectNextWord(words: QuizWord[]): QuizWord | null {
  if (!words.length) return null;
  
  // Розподілити ваги на основі shortMemory (менший shortMemory = більша вага)
  const weights = words.map(w => {
    const shortMemory = w.shortMemory ?? 0;
    // Вага обернено пропорційна shortMemory (слово з 0 має найбільшу вагу)
    return Math.max(1, 20 - shortMemory);
  });
  
  // Загальна вага
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  // Випадкове число
  const random = Math.random() * totalWeight;
  
  // Знайти слово на основі ваги
  let currentWeight = 0;
  for (let i = 0; i < words.length; i++) {
    currentWeight += weights[i];
    if (random <= currentWeight) {
      return words[i];
    }
  }
  
  // Fallback
  return words[0];
}

export function calcProgress(words: QuizWord[]): number {
  if (!words.length) return 0;
  const learned = words.filter(isLearned).length;
  return Math.round((learned / words.length) * 100);
}


