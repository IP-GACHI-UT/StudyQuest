'use client';

import { Card } from '@/components/common/Card';
import { Tag } from '@/components/common/Tag';
import type { Quest } from '@/types/quest';

type QuestBoardCardProps = {
  quest: Quest;
  onAccept?: (id: string) => void;
  disabled?: boolean;
  isAccepting?: boolean;
};

export const QuestBoardCard = ({
  quest,
  onAccept,
  disabled = false,
  isAccepting = false,
}: QuestBoardCardProps) => {
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
              className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled || !onAccept}
              onClick={() => onAccept?.(quest.id)}
            >
              {isAccepting ? '受注中…' : '受注'}
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

        <div className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
          {quest.duration}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground">今日の受注</p>
          <p className="font-semibold text-blue-300">
            {quest.acceptedToday ?? 0}人
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">今日の達成</p>
          <p className="font-semibold text-green-300">
            {quest.completedToday ?? 0}人
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">累計達成率</p>
          <p className="font-semibold text-green-300">
            {quest.completionRate ?? 0}%
          </p>
        </div>
      </div>
    </Card>
  );
};
