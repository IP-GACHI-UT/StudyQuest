import Card from "./Card";

export default function MyQuestCard() {
    return (
        <Card title="My Quests">
            <p className="text-gray-700">You have no active quests. Start a new quest to earn rewards!</p>
        </Card>
    );
}