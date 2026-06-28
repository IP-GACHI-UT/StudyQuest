import { Card } from '../common/Card';

type BadgeItem = {
  id: string;
  icon: React.ReactNode;
  description: string;
};

type BadgeCardProps = {
  title: string;
  badges: BadgeItem[];
};

export const BadgeCard = ({ title, badges = [] }: BadgeCardProps) => {
  return (
    <Card>
      <h3 className="mb-4 text-lg font-bold">{title}</h3>

      <div className="flex justify-between gap-4">
        {badges.map((badge) => (
          <div key={badge.id} className="flex flex-1 flex-col items-center">
            <div className="mb-2 text-4xl">{badge.icon}</div>

            <p className="text-center text-sm">{badge.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
