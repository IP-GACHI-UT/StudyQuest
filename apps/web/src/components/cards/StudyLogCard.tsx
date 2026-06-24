import { formatLogTime } from '@/utils/formatLogTime';
import { Card } from '../common/Card';

type LogItem = {
  created_at: Date;
  text: string;
};

type StudyLogCardProps = {
  logs: LogItem[];
};

export const StudyLogCard = ({ logs = [] }: StudyLogCardProps) => {
  return (
    <Card>
      {/* タイトル */}
      <h3 className="mb-3 text-lg font-bold">学習ログ</h3>

      {/* ログ一覧 */}
      <div className="space-y-1">
        {logs.slice(0, 4).map((log, index) => (
          <p key={index} className="text-sm text-gray-600">
            <span className="mr-2 font-medium">
              {formatLogTime(log.created_at)}
            </span>
            <span className="text-white">{log.text}</span>
          </p>
        ))}
      </div>
    </Card>
  );
};
