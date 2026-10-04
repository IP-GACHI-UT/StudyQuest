'use client';

import { useEffect, useMemo, useState } from 'react';
import { MyQuestCard } from '@/components/cards/MyQuestCard';
import SectionHeader from '@/components/common/SectionHeader';

type ApiMyQuest = {
  id: string;
  status: string;
  acceptedAt: string;
  completedAt: string | null;
  quest: {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    estimatedMinutes: number;
    acceptPoint: number;
    clearPoint: number;
    xpReward: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

type ApiMyQuestsResponse = {
  userQuests: ApiMyQuest[];
};

const mapQuestStatusToDisplay = (
  status: string,
): '進行中' | '達成済み' | 'キャンセル済み' => {
  switch (status) {
    case 'completed':
      return '達成済み';
    case 'canceled':
      return 'キャンセル済み';
    default:
      return '進行中';
  }
};

const mapStatusToButtonLabel = (status: string): string => {
  switch (status) {
    case 'completed':
      return '結果を見る';
    case 'canceled':
      return '再開する';
    default:
      return '学習する';
  }
};

export default function MyQuestPage() {
  const [myQuests, setMyQuests] = useState<ApiMyQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadMyQuests = async () => {
      try {
        setError(null);
        setIsLoading(true);

        const response = await fetch('http://localhost:3001/api/my-quests', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('マイクエストの取得に失敗しました。');
        }

        const data = (await response.json()) as ApiMyQuestsResponse;
        setMyQuests(data.userQuests);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'マイクエストの取得中にエラーが発生しました。',
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadMyQuests();

    return () => controller.abort();
  }, []);

  const stats = useMemo(() => {
    return myQuests.reduce(
      (acc, quest) => {
        switch (quest.status) {
          case 'completed':
            acc.completed += 1;
            break;
          case 'canceled':
            acc.canceled += 1;
            break;
          default:
            acc.active += 1;
            break;
        }

        return acc;
      },
      {
        active: 0,
        completed: 0,
        canceled: 0,
      },
    );
  }, [myQuests]);

  return (
    <main className="space-y-6">
      <SectionHeader
        enTitle="MY QUEST"
        jaTitle="受注中のクエスト"
        description={`現在の受注数: ${myQuests.length} / 3`}
      />

      {isLoading ? (
        <p className="py-4 text-sm text-gray-500">読み込み中...</p>
      ) : error ? (
        <p className="py-4 text-sm text-red-500">{error}</p>
      ) : myQuests.length === 0 ? (
        <p className="py-4 text-sm text-gray-500">
          受注中のクエストはまだありません。
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {myQuests.map((quest) => (
            <MyQuestCard
              key={quest.id}
              status={mapQuestStatusToDisplay(quest.status)}
              title={quest.quest.title}
              category={quest.quest.category}
              difficulty={quest.quest.difficulty}
              buttonLabel={mapStatusToButtonLabel(quest.status)}
              onButtonClick={() => {
                window.alert('詳細画面はまだ準備中です。');
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
