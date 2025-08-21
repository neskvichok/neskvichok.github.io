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
      onChange(selectedSetIds.filter(id => id !== setId));
    } else {
      onChange([...selectedSetIds, setId]);
    }
  };

  return (
    <div className="block">
      <div className="space-y-2">
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
