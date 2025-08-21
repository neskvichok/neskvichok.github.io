import type { QuizSet } from "@/lib/quiz-data/types";

export function SetPicker({ sets, value, onChange }: { sets: QuizSet[]; value?: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-sm text-gray-700 mb-1">Набір слів</div>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {sets.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  );
}


