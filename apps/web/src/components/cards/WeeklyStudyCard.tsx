import { formatStudyMinutes } from '@/lib/api';
import { WeeklyStudyChart } from '../charts/WeeklyStudyChart';
import { Card } from '../common/Card';

type WeeklyStudyCardProps = {
  studyMinutes: number;
  completedQuests: number;
  earnedXp: number;
  streakDays: number;

  chartData: {
    day: string;
    hours: number;
  }[];
};

export const WeeklyStudyCard = ({
  studyMinutes,
  completedQuests,
  earnedXp,
  streakDays,
  chartData,
}: WeeklyStudyCardProps) => {
  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-lg font-bold">今週の学習状況</h2>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-300">学習時間</span>

          <span className="font-medium">
            {formatStudyMinutes(studyMinutes)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-300">達成クエスト</span>

          <span className="font-medium">{completedQuests}件</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-300">獲得XP</span>

          <span className="font-medium">{earnedXp.toLocaleString()} XP</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-300">今週の最長連続学習日数</span>

          <span className="font-medium">{streakDays}日</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-300">
        日本時間・月曜始まり。グラフの単位は時間です。
      </p>

      <div className="mt-6">
        <WeeklyStudyChart data={chartData} />
      </div>
    </Card>
  );
};
