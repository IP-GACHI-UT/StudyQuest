'use client';

import { useEffect, useState } from 'react';
import { QuestBoardCard } from '@/components/cards/QuestBoardCard';
import { CATEGORIES, type Category } from '@/constants/quest/category';
import type { Difficulty } from '@/constants/quest/difficulty';
import type { Quest } from '@/types/quest';
import { acceptQuest } from '@/utils/acceptQuest';

type ApiBoardQuest = {
  quest: {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: 'easy' | 'normal' | 'hard';
    estimatedMinutes: number;
    acceptPoint: number;
    clearPoint: number;
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

const difficultyMap: Record<ApiBoardQuest['quest']['difficulty'], Difficulty> =
  {
    easy: '初級',
    normal: '中級',
    hard: '上級',
  };

function mapBoardQuest(item: ApiBoardQuest): Quest {
  return {
    id: item.quest.id,
    title: item.quest.title,
    description: item.quest.description,
    category: CATEGORIES.includes(item.quest.category as Category)
      ? (item.quest.category as Category)
      : 'その他',
    difficulty: difficultyMap[item.quest.difficulty],
    duration: `${item.quest.estimatedMinutes}分`,
    acceptPoint: item.quest.acceptPoint,
    clearPoint: item.quest.clearPoint,
    acceptedToday: item.statistics.acceptedToday,
    completedToday: item.statistics.completedToday,
    completionRate: item.statistics.completionRate,
    isAccepted: item.currentUser.isAccepted,
  };
}

async function fetchBoardQuests(): Promise<Quest[]> {
  const response = await fetch('/api/board/quests', {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('掲示板を取得できませんでした。');
  }
  const data = (await response.json()) as { quests: ApiBoardQuest[] };
  return data.quests.map(mapBoardQuest);
}

function getLoadErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : '掲示板を取得できませんでした。';
}

export const QuestBoard = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void fetchBoardQuests().then(
      (nextQuests) => {
        if (active) {
          setQuests(nextQuests);
          setLoading(false);
        }
      },
      (loadError: unknown) => {
        if (active) {
          setError(getLoadErrorMessage(loadError));
          setLoading(false);
        }
      },
    );

    return () => {
      active = false;
    };
  }, []);

  const handleAcceptQuest = async (questId: string) => {
    try {
      setLoading(true);
      setError(null);
      await acceptQuest(questId);
      setQuests(await fetchBoardQuests());
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : 'クエストの受注に失敗しました。',
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <p className="py-8 text-center text-slate-500">掲示板を読み込み中です…</p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
      ) : null}
      {quests.map((quest) => (
        <QuestBoardCard
          key={quest.id}
          quest={quest}
          onAccept={(id) => void handleAcceptQuest(id)}
        />
      ))}
    </div>
  );
};
