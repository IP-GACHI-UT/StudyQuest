type CardProps = {
    title: string;
    children: React.ReactNode;
};

export default function Card({ title, children }: CardProps) {
    return (
        <div className="bg-blue-800 shadow-md rounded-lg p-6 mb-4">
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            <div>{children}</div>
        </div>
    );
}