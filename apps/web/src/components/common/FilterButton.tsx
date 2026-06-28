type FilterButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export const FilterButton = ({
  label,
  active,
  onClick,
}: FilterButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        rounded-full
        border
        px-4
        py-2
        text-sm
        transition-colors
        ${
          active
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }
      `}
    >
      {label}
    </button>
  );
};