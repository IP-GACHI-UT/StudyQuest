import { Card } from '@/components/common/Card';

type QuestAcceptanceRateCardProps = {
  title: string;
  category: string;

  acceptedCount: number;
  completedCount: number;
};

export const QuestAcceptanceRateCard = ({
  title,
  category,
  acceptedCount,
  completedCount,
}: QuestAcceptanceRateCardProps) => {
  const completionRate =
    acceptedCount === 0
      ? 0
      : Math.round((completedCount / acceptedCount) * 100);

  return (
    <Card>
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-lg">{title}</h3>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm">
          {category}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-6 text-sm">
        <div>
          <span className="text-gray-500">受注人数</span>
          <span className="ml-2 font-semibold">{acceptedCount}人</span>
        </div>

        <div>
          <span className="text-gray-500">達成人数</span>
          <span className="ml-2 font-semibold">{completedCount}人</span>
        </div>

        <div>
          <span className="text-gray-500">達成率</span>
          <span className="ml-2 font-semibold">{completionRate}%</span>
        </div>
      </div>
    </Card>
  );
};
