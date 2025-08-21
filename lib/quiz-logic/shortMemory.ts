import type { QuizWord } from "@/lib/quiz-data/types";

export const LEARNED_THRESHOLD = 15;

export function isLearned(word: QuizWord): boolean {
  return (word.shortMemory ?? 0) > LEARNED_THRESHOLD;
}

export function selectNextWord(words: QuizWord[]): QuizWord | null {
  if (!words.length) return null;
  const min = Math.min(...words.map(w => w.shortMemory ?? 0));
  const candidates = words.filter(w => (w.shortMemory ?? 0) === min);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

export function calcProgress(words: QuizWord[]): number {
  if (!words.length) return 0;
  const learned = words.filter(isLearned).length;
  return Math.round((learned / words.length) * 100);
}


