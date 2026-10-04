'use client';

import { Card } from '@/components/common/Card';
import { Tag } from '@/components/common/Tag';
import type { Quest } from '@/types/quest';

type QuestBoardCardProps = {
  quest: Quest;
  onAccept?: (id: string) => void;
};

export const QuestBoardCard = ({ quest, onAccept }: QuestBoardCardProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Tag label={quest.category} color="blue" />
        </div>

        <div>
          {quest.isAccepted ? (
            <span className="inline-flex items-center rounded-full border border-gray-600 bg-gray-800 px-3 py-1 text-sm text-gray-200">
              受注済み
            </span>
          ) : (
            <button
              type="button"
              className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-sm text-white"
              onClick={() => onAccept?.(quest.id)}
            >
              受注
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl font-bold leading-tight text-white">
            {quest.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {quest.description}
          </p>
        </div>

        <div className="text-sm text-muted-foreground">{quest.duration}</div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground">今日の受注</p>
          <p className="font-semibold text-blue-300">
            {quest.acceptedToday ?? 0}人
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">達成人数</p>
          <p className="font-semibold text-green-300">
            {quest.completedToday ?? 0}人
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">達成率</p>
          <p className="font-semibold text-green-300">
            {quest.completionRate ?? 0}%
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center -space-x-2">
          <div className="h-7 w-7 rounded-full bg-gray-500 ring-2 ring-gray-700" />
          <div className="h-7 w-7 rounded-full bg-gray-600 ring-2 ring-gray-700" />
          <div className="h-7 w-7 rounded-full bg-gray-400 ring-2 ring-gray-700" />
          <span className="ml-2 text-xs text-muted-foreground">
            匿名の学習者が取り組み中
          </span>
        </div>
      </div>
    </Card>
  );
};
