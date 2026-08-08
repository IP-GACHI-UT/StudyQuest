'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RecommendedQuestCard } from '@/components/cards/RecommendedQuestCard';
import { FilterButton } from '@/components/common/FilterButton';
import { CATEGORIES, type Category } from '@/constants/quest/category';
import { DIFFICULTIES, type Difficulty } from '@/constants/quest/difficulty';
import { authClient } from '@/lib/auth-client';
import type { Quest } from '@/types/quest';
import { acceptQuest } from '@/utils/acceptQuest';

// API から返されるクエストデータの型定義。
// Web 側では API の型とアプリ内表示用型を分けて扱います。
type ApiQuest = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'normal' | 'hard';
  estimatedMinutes: number;
  acceptPoint: number;
  clearPoint: number;
};

type ApiQuestsResponse = {
  quests: ApiQuest[];
};

// API の difficulty を画面表示用の日本語ラベルに変換します。
const difficultyMap: Record<ApiQuest['difficulty'], Difficulty> = {
  easy: '初級',
  normal: '中級',
  hard: '上級',
};

// API から取得したデータを、既存の Quest 型に整形します。
const mapApiQuestToQuest = (quest: ApiQuest): Quest => ({
  id: quest.id,
  title: quest.title,
  difficulty: difficultyMap[quest.difficulty],
  description: quest.description,
  category: CATEGORIES.includes(quest.category as Category)
    ? (quest.category as Category)
    : 'その他',
  duration: `${quest.estimatedMinutes}分`,
  acceptPoint: quest.acceptPoint,
  clearPoint: quest.clearPoint,
});

export const QuestList = () => {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const categoryOptions: Array<Category | 'すべて'> = ['すべて', ...CATEGORIES];
  const difficultyOptions: Array<Difficulty | 'すべて'> = [
    'すべて',
    ...DIFFICULTIES,
  ];
  const [selectedCategory, setSelectedCategory] = useState<Category | 'すべて'>(
    'すべて',
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    Difficulty | 'すべて'
  >('すべて');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [, setApiResponse] = useState<ApiQuestsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingQuestId, setAcceptingQuestId] = useState<string | null>(null);
  const [acceptMessage, setAcceptMessage] = useState<string | null>(null);

  const loadQuests = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch('/api/quests', {
        credentials: 'include',
        signal,
      });

      if (!response.ok) {
        throw new Error('APIからのクエスト取得に失敗しました。');
      }

      const data = (await response.json()) as ApiQuestsResponse;
      setApiResponse(data);
      setQuests(data.quests.map(mapApiQuestToQuest));
    } catch (fetchError) {
      if (signal?.aborted) {
        return;
      }

      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'クエスト一覧の取得中にエラーが発生しました。',
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

  // フィルターの選択状態に応じて表示するクエストを絞り込みます。
  const filteredQuests = useMemo(() => {
    return quests.filter((quest) => {
      const categoryMatch =
        selectedCategory === 'すべて' || quest.category === selectedCategory;

      const difficultyMatch =
        selectedDifficulty === 'すべて' ||
        quest.difficulty === selectedDifficulty;

      return categoryMatch && difficultyMatch;
    });
  }, [quests, selectedCategory, selectedDifficulty]);

  const handleAcceptQuest = async (questId: string) => {
    if (!session) {
      router.push('/login?next=/quests');
      return;
    }

    setAcceptingQuestId(questId);
    setAcceptMessage(null);

    try {
      await acceptQuest(questId);
      await loadQuests();
      setAcceptMessage('クエストを受注しました。');
    } catch (acceptError) {
      setAcceptMessage(
        acceptError instanceof Error
          ? acceptError.message
          : 'クエストの受注に失敗しました。',
      );
    } finally {
      setAcceptingQuestId(null);
    }
  };

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          クエストを読み込み中です…
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="font-medium">カテゴリ</p>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((category) => (
            <FilterButton
              key={category}
              label={category}
              active={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-medium">難易度</p>

        <div className="flex flex-wrap gap-2">
          {difficultyOptions.map((difficulty) => (
            <FilterButton
              key={difficulty}
              label={difficulty}
              active={selectedDifficulty === difficulty}
              onClick={() => setSelectedDifficulty(difficulty)}
            />
          ))}
        </div>
      </div>

      {acceptMessage ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          {acceptMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredQuests.map((quest) => (
          <RecommendedQuestCard
            key={quest.id}
            title={quest.title}
            difficulty={quest.difficulty}
            description={quest.description}
            category={quest.category}
            duration={quest.duration}
            acceptPoint={quest.acceptPoint}
            clearPoint={quest.clearPoint}
            isAccepting={acceptingQuestId === quest.id}
            buttonLabel={session ? 'クエスト受注' : 'ログインして受注'}
            onAccept={() => void handleAcceptQuest(quest.id)}
          />
        ))}
      </div>
    </div>
  );
};
