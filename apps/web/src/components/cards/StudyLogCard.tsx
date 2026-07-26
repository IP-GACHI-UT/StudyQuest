import { formatLogTime } from '@/utils/formatLogTime';
import { Card } from '../common/Card';

type LogItem = {
  created_at: Date;
  text: string;
};

type StudyLogCardProps = {
  logs: LogItem[];
  isLoading?: boolean;
  error?: string | null;
};

export const StudyLogCard = ({
  logs = [],
  isLoading = false,
  error = null,
}: StudyLogCardProps) => {
  const displayLogs = logs.slice(0, 4);

  return (
    <Card>
      {/* タイトル */}
      <h3 className="mb-3 text-lg font-bold">学習ログ</h3>

      {isLoading ? (
        <p className="text-sm text-gray-600">学習ログを読み込み中です…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : displayLogs.length === 0 ? (
        <p className="text-sm text-gray-500">学習ログがまだありません。</p>
      ) : (
        <div className="space-y-1">
          {displayLogs.map((log, index) => (
            <p key={index} className="text-sm text-gray-600">
              <span className="mr-2 font-medium">
                {formatLogTime(log.created_at)}
              </span>
              <span className="text-white">{log.text}</span>
            </p>
          ))}
        </div>
      )}
    </Card>
  );
};
