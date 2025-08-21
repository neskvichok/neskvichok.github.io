export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>Прогрес</span>
        <span>{value}%</span>
      </div>
      <div className="progress">
        <div className="progress-bar" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}


