type CardProps = {
    children: React.ReactNode;
    className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
    return (
        <div className={`bg-gray-700 shadow-md rounded-lg p-6 mb-4 ${className || ''}`}>
            <div>{children}</div>
        </div>
    );
}