"use client";

import { useMemo, useState } from "react";
import { FilterButton } from "@/components/common/FilterButton";
import { RecommendedQuestCard } from '@/components/cards/RecommendedQuestCard';
import type { Quest } from "@/types/quest";
import { CATEGORIES, Category } from "@/constants/quest/category";
import { DIFFICULTIES, Difficulty } from "@/constants/quest/difficulty";

const quests: Quest[] = [
  {
    id: 1,
    title: "Reactを30分勉強",
    difficulty: "初級",
    description: "ReactのuseStateとuseEffectを学習する",
    category: "フロントエンド",
    duration: "30分",
    acceptPoint: 50,
    clearPoint: 100,
  },
  {
    id: 2,
    title: "SQL問題を5問解く",
    difficulty: "中級",
    description: "SELECT・JOIN問題を解く",
    category: "データベース",
    duration: "45分",
    acceptPoint: 80,
    clearPoint: 150,
  },
    {
    id: 3,
    title: "SQLでJOIN問題を解く",
    difficulty: "中級",
    description: "INNER JOIN・LEFT JOINを使った問題を5問解く",
    category: "データベース",
    duration: "45分",
    acceptPoint: 70,
    clearPoint: 140,
  },
  {
    id: 4,
    title: "二分探索を実装する",
    difficulty: "上級",
    description: "二分探索アルゴリズムを理解し実装する",
    category: "アルゴリズム",
    duration: "60分",
    acceptPoint: 100,
    clearPoint: 200,
  },
  {
    id: 5,
    title: "Gitでコンフリクトを解消する",
    difficulty: "初級",
    description: "ブランチをマージし、コンフリクトを解決する",
    category: "その他",
    duration: "20分",
    acceptPoint: 40,
    clearPoint: 80,
  },
  {
    id: 6,
    title: "Next.jsで一覧画面を作る",
    difficulty: "上級",
    description: "App Routerを使ってクエスト一覧画面を実装する",
    category: "フロントエンド",
    duration: "90分",
    acceptPoint: 120,
    clearPoint: 250,
  },
];

export const QuestList = () => {
  const categoryOptions: Array<Category | "すべて"> = ["すべて", ...CATEGORIES];
  const difficultyOptions: Array<Difficulty | "すべて"> = ["すべて", ...DIFFICULTIES];
  const [selectedCategory, setSelectedCategory] =
  useState<Category | "すべて">("すべて");
  const [selectedDifficulty, setSelectedDifficulty] =
  useState<Difficulty | "すべて">("すべて");

  const filteredQuests = useMemo(() => {
    return quests.filter((quest) => {
      const categoryMatch =
        selectedCategory === "すべて" ||
        quest.category === selectedCategory;

      const difficultyMatch =
        selectedDifficulty === "すべて" ||
        quest.difficulty === selectedDifficulty;

      return categoryMatch && difficultyMatch;
    });
  }, [selectedCategory, selectedDifficulty]);

  return (
    <div className="space-y-6">
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