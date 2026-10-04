type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-gray-700 text-white shadow-md rounded-lg p-6 mb-4 ${className || ''}`}
    >
      <div>{children}</div>
    </div>
  );
}
