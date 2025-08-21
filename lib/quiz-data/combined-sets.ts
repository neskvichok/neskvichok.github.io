import type { QuizSet, QuizWord } from "./types";

export function combineSets(sets: QuizSet[], selectedSetIds: string[]): QuizSet | null {
  if (selectedSetIds.length === 0) return null;
  
  // Знайти всі вибрані набори
  const selectedSets = sets.filter(set => selectedSetIds.includes(set.id));
  if (selectedSets.length === 0) return null;
  
  // Об'єднати всі слова з вибраних наборів
  const allWords: QuizWord[] = [];
  const setNames: string[] = [];
  
  selectedSets.forEach(set => {
    setNames.push(set.name);
    // Додати слова з поточного набору, додавши інформацію про оригінальний набір
    allWords.push(...set.words.map(word => ({ ...word, originalSetId: set.id })));
  });
  
  // Створити об'єднаний набір з правильним UUID
  const combinedSet: QuizSet = {
    id: selectedSets.length === 1 
      ? selectedSets[0].id 
      : `combined-${selectedSetIds.join('-')}`,
    name: selectedSets.length === 1 
      ? selectedSets[0].name 
      : `Об'єднаний: ${setNames.join(', ')}`,
    words: allWords
  };
  
  return combinedSet;
}

export function createAllWordsSet(sets: QuizSet[]): QuizSet {
  // Об'єднати всі слова з усіх наборів
  const allWords: QuizWord[] = [];
  const setNames: string[] = [];
  
  sets.forEach(set => {
    setNames.push(set.name);
    // Додати слова з поточного набору, додавши інформацію про оригінальний набір
    allWords.push(...set.words.map(word => ({ ...word, originalSetId: set.id })));
  });
  
  // Створити спеціальний набір "Всі слова"
  const allWordsSet: QuizSet = {
    id: 'all-words-combined',
    name: 'Всі слова',
    words: allWords
  };
  
  return allWordsSet;
}
