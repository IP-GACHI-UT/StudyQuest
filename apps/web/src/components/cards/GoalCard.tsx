'use client';

import { ProgressBar } from '@/components/common/ProgressBar';
import { Card } from '../common/Card';

type GoalCardProps = {
  tag: string;
  title: string;
  description: string;
  deadline: string;
  progress: number;
  questCount: number;
};

export const GoalCard = ({
  tag,
  title,
  description,
  deadline,
  progress,
  questCount,
}: GoalCardProps) => {
  return (
    <Card>
      {/* タグ */}
      <div>
        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
          {tag}
        </span>
      </div>

      {/* 目標 */}
      <h3 className="text-lg font-bold">{title}</h3>

      {/* 詳細 */}
      <p className="text-sm text-gray-600">{description}</p>

      {/* 期限 */}
      <p className="text-sm text-gray-500">期限: {deadline}</p>

      {/* ProgressBar */}
      <ProgressBar label="進捗" value={progress} />

      {/* 下部 */}
      <div className="flex items-center justify-between">
        <span className="text-sm">関連クエスト: {questCount}</span>
      </div>
    </Card>
  );
};
