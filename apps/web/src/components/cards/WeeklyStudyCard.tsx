import { WeeklyStudyChart } from '../charts/WeeklyStudyChart';
import { Card } from '../common/Card';
import { ProgressBar } from '../common/ProgressBar';

type WeeklyStudyCardProps = {
  studyHours: number;
  completedQuests: number;
  earnedXp: number;
  streakDays: number;

  weeklyGoalHours: number;

  chartData: {
    day: string;
    hours: number;
  }[];
};

export const WeeklyStudyCard = ({
  studyHours,
  completedQuests,
  earnedXp,
  streakDays,
  weeklyGoalHours,
  chartData,
}: WeeklyStudyCardProps) => {
  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-lg font-bold">今週の学習状況</h2>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">学習時間</span>

          <span className="font-medium">{studyHours}時間</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-500">達成クエスト</span>

          <span className="font-medium">{completedQuests}件</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-500">獲得XP</span>

          <span className="font-medium">{earnedXp.toLocaleString()} XP</span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-500">連続学習日数</span>

          <span className="font-medium">{streakDays}日</span>
        </div>
      </div>

      <div className="mt-6">
        <ProgressBar
          label="週間目標時間"
          value={Math.round((studyHours / weeklyGoalHours) * 100)}
        />
      </div>

      <div className="mt-6">
        <WeeklyStudyChart data={chartData} />
      </div>
    </Card>
  );
};
