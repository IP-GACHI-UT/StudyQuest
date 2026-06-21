type SectionHeaderProps = {
    enTitle: string;
    jaTitle: string;
    description: string;
};

export default function SectionHeader({ enTitle, jaTitle, description }: SectionHeaderProps) {
    return (
        <div className="flex items-center gap-4">
            <div className="w-1 h-16 bg-blue-800" />
            <div>
                <p className="text-blue-400">{enTitle}</p>
                <h2 className="text-xl font-semibold text-white">{jaTitle}</h2>
                <p className="text-gray-400">{description}</p>
            </div>
        </div>
    );
}