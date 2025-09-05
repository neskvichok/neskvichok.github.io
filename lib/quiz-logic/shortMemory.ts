import type { QuizWord } from "@/lib/quiz-data/types";

export const LEARNED_THRESHOLD = 5;

export function isLearned(word: QuizWord): boolean {
  return (word.shortMemory ?? 0) > LEARNED_THRESHOLD;
}

export function selectNextWord(words: QuizWord[]): QuizWord | null {
  if (!words.length) return null;
  
  // Знайти найменше значення shortMemory
  const minShortMemory = Math.min(...words.map(w => w.shortMemory ?? 0));
  
  // Знайти слова з найменшим shortMemory
  const candidates = words.filter(w => (w.shortMemory ?? 0) === minShortMemory);
  
  // Якщо є тільки одне слово з найменшим shortMemory, повернути його
  if (candidates.length === 1) {
    return candidates[0];
  }
  
  // Якщо є кілька слів з найменшим shortMemory, вибрати випадково серед них
  // Але також включити слова з другим найменшим значенням (якщо воно не набагато більше)
  const secondMinShortMemory = Math.min(...words
    .filter(w => (w.shortMemory ?? 0) > minShortMemory)
    .map(w => w.shortMemory ?? 0));
  
  // Якщо різниця між найменшим і другим найменшим невелика (≤ 1), включити обидва
  const finalCandidates = secondMinShortMemory - minShortMemory <= 1
    ? words.filter(w => (w.shortMemory ?? 0) <= secondMinShortMemory)
    : candidates;
  
  // Випадково вибрати з фінальних кандидатів
  return finalCandidates[Math.floor(Math.random() * finalCandidates.length)];
}

export function calcProgress(words: QuizWord[]): number {
  if (!words.length) return 0;
  const learned = words.filter(isLearned).length;
  return Math.round((learned / words.length) * 100);
}


