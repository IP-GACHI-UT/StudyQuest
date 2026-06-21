type TagProps = {
    label: string;
    color: "blue" | "green" | "yellow" | "red";
};

export function Tag({ label, color }: TagProps) {
    const colorClasses = {
        blue: "bg-blue-100 text-blue-800",
        green: "bg-green-100 text-green-800",
        yellow: "bg-yellow-100 text-yellow-800",
        red: "bg-red-100 text-red-800",
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
            {label}
        </span>
    );
}