'use client';

import { useCallback, useEffect, useState } from 'react';
import { QuestBoardCard } from '@/components/cards/QuestBoardCard';
import { CATEGORIES, type Category } from '@/constants/quest/category';
import type { Difficulty } from '@/constants/quest/difficulty';
import type { Quest } from '@/types/quest';
import { acceptQuest } from '@/utils/acceptQuest';

type ApiQuestBoardItem = {
  quest: {
    id: number;
    title: string;
    description: string;
    category: string;
    difficulty: 'easy' | 'normal' | 'hard';
    estimatedMinutes: number;
    acceptPoint: number;
    clearPoint: number;
    xpReward: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  statistics: {
    acceptedToday: number;
    completedToday: number;
    completionRate: number;
  };
  currentUser: {
    isAccepted: boolean;
  };
};

type ApiQuestBoardResponse = {
  quests: ApiQuestBoardItem[];
};

const difficultyMap: Record<ApiQuestBoardItem['quest']['difficulty'], Difficulty> = {
  easy: '初級',
  normal: '中級',
  hard: '上級',
};

const mapApiQuestBoardItemToQuest = (item: ApiQuestBoardItem): Quest => ({
  id: item.quest.id,
  title: item.quest.title,
  difficulty: difficultyMap[item.quest.difficulty],
  description: item.quest.description,
  category: CATEGORIES.includes(item.quest.category as Category)
    ? (item.quest.category as Category)
    : 'その他',
  duration: `${item.quest.estimatedMinutes}分`,
  acceptPoint: item.quest.acceptPoint,
  clearPoint: item.quest.clearPoint,
  acceptedToday: item.statistics.acceptedToday,
  completedToday: item.statistics.completedToday,
  completionRate: item.statistics.completionRate,
  isAccepted: item.currentUser.isAccepted,
});

export const QuestBoard = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuests = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch('http://localhost:3001/api/board/quests', {
        signal,
      });

      if (!response.ok) {
        throw new Error('掲示板のクエスト取得に失敗しました。');
      }

      const data = (await response.json()) as ApiQuestBoardResponse;
      setQuests(data.quests.map(mapApiQuestBoardItemToQuest));
    } catch (fetchError) {
      if (signal?.aborted) {
        return;
      }

      setError(
        fetchError instanceof Error
          ? fetchError.message
          : '掲示板のクエスト一覧の取得中にエラーが発生しました。',
      );
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    queueMicrotask(() => {
      void loadQuests(controller.signal);
    });

    return () => {
      controller.abort();
    };
  }, [loadQuests]);

  const handleAcceptQuest = async (questId: number) => {
    try {
      await acceptQuest(questId);
      await loadQuests();
      alert('クエストを受注しました。');
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'クエストの受注に失敗しました。',
      );
    }
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          クエストを読み込み中です…
        </div>
      ) : null}

      {!error && !isLoading &&
        quests.map((quest) => (
          <QuestBoardCard
            key={quest.id}
            quest={quest}
            onAccept={() => void handleAcceptQuest(quest.id)}
          />
        ))}
    </div>
  );
};
