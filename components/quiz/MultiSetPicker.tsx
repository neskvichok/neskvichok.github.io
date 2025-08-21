import type { QuizSet } from "@/lib/quiz-data/types";

export function MultiSetPicker({ 
  sets, 
  selectedSetIds, 
  onChange 
}: { 
  sets: QuizSet[]; 
  selectedSetIds: string[]; 
  onChange: (setIds: string[]) => void 
}) {
  const toggleSet = (setId: string) => {
    if (selectedSetIds.includes(setId)) {
      // Якщо знімаємо вибір з "Всі слова", просто видаляємо його
      if (setId === 'all-words-combined') {
        onChange(selectedSetIds.filter(id => id !== setId));
      } else {
        // Якщо знімаємо вибір з звичайного набору, видаляємо його
        onChange(selectedSetIds.filter(id => id !== setId));
      }
    } else {
      // Якщо вибираємо "Всі слова", очищаємо всі інші вибори
      if (setId === 'all-words-combined') {
        onChange([setId]);
      } else {
        // Якщо вибираємо звичайний набір, видаляємо "Всі слова" і додаємо цей
        onChange(selectedSetIds.filter(id => id !== 'all-words-combined').concat(setId));
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
