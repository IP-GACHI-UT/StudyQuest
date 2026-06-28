type ProgressBarProps = {
  label: string;
  value: number;
};

export const ProgressBar = ({ label, value }: ProgressBarProps) => {
  const percent = Math.max(0, Math.min(100, value));

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-sm">{percent}%</span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
