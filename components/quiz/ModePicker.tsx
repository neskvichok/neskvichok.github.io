export function ModePicker({ modes, value, onChange }: { modes: Record<string, { name: string; status?: string }>; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-sm text-gray-700 mb-1">Режим</div>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.entries(modes).map(([key, meta]) => (
          <option key={key} value={key}>
            {meta.name} {meta.status !== 'ready' ? '(soon)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}


