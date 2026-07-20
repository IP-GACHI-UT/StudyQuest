'use client';

import { useEffect, useMemo, useState } from 'react';
import { RecommendedQuestCard } from '@/components/cards/RecommendedQuestCard';
import { FilterButton } from '@/components/common/FilterButton';
import { CATEGORIES, type Category } from '@/constants/quest/category';
import { DIFFICULTIES, type Difficulty } from '@/constants/quest/difficulty';
import type { Quest } from '@/types/quest';

// API から返されるクエストデータの型定義。
// Web 側では API の型とアプリ内表示用型を分けて扱います。
type ApiQuest = {
  id: number;
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
  const [apiResponse, setApiResponse] = useState<ApiQuestsResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadQuests() {
      try {
        // 開発用に API を直接叩いてクエストを取得します。
        const response = await fetch('http://localhost:3001/api/quests', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('APIからのクエスト取得に失敗しました。');
        }

        const data = (await response.json()) as ApiQuestsResponse;
        setApiResponse(data);
        setQuests(data.quests.map(mapApiQuestToQuest));
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'クエスト一覧の取得中にエラーが発生しました。',
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadQuests();

    return () => controller.abort();
  }, []);

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
            onAccept={() => alert('Accepting quest')}
          />
        ))}
      </div>
    </div>
  );
};
