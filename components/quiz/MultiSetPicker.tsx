import type { QuizSet } from "@/lib/quiz-data/types";

export function MultiSetPicker({ 
  sets, 
  selectedSetIds, 
  onChange,
  mode = "education"
}: { 
  sets: QuizSet[]; 
  selectedSetIds: string[]; 
  onChange: (setIds: string[]) => void;
  mode?: "education" | "accuracy" | "speed" | "flashcards";
}) {
  const toggleSet = (setId: string) => {
    const isSingleSetMode = mode === "accuracy" || mode === "speed" || mode === "flashcards";
    
    if (selectedSetIds.includes(setId)) {
      // Знімаємо вибір
      onChange(selectedSetIds.filter(id => id !== setId));
    } else {
      // Додаємо вибір
      if (isSingleSetMode) {
        // Для Accuracy, Speed і Flashcards тільки один набір або "Всі слова"
        if (setId === 'all-words-combined') {
          onChange([setId]);
        } else {
          // Якщо вибираємо звичайний набір, замінюємо всі вибори
          onChange([setId]);
        }
      } else {
        // Для Education дозволяємо множинний вибір
        if (setId === 'all-words-combined') {
          // "Всі слова" ексклюзивно
          onChange([setId]);
        } else {
          // Додаємо до існуючих, але видаляємо "Всі слова"
          onChange(selectedSetIds.filter(id => id !== 'all-words-combined').concat(setId));
        }
      }
    }
  };

  // Підрахувати загальну кількість слів
  const totalWords = sets.reduce((sum, set) => sum + set.words.length, 0);

  return (
    <div className="block">
      <div className="space-y-2">
        {/* Опція "Всі слова" */}
        <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 bg-blue-50 border-blue-200">
          <input
            type="checkbox"
            checked={selectedSetIds.includes('all-words-combined')}
            onChange={() => toggleSet('all-words-combined')}
            className="checkbox"
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate text-blue-800">🌍 Всі слова</div>
            <div className="text-xs text-blue-600">{totalWords} слів з {sets.length} наборів</div>
          </div>
        </label>
        
        {/* Розділювач */}
        <div className="border-t border-gray-200 my-2"></div>
        
        {/* Звичайні набори */}
        {sets.map((set) => (
          <label key={set.id} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selectedSetIds.includes(set.id)}
              onChange={() => toggleSet(set.id)}
              className="checkbox"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{set.name}</div>
              <div className="text-xs text-gray-500">{set.words.length} слів</div>
            </div>
          </label>
        ))}
      </div>
      {selectedSetIds.length === 0 && (
        <div className="text-sm text-gray-500 mt-2">Виберіть хоча б один набір</div>
      )}
    </div>
  );
}
