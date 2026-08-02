'use client';

import { QuestBoardCard } from '@/components/cards/QuestBoardCard';
import type { Quest } from '@/types/quest';
import { acceptQuest } from '@/utils/acceptQuest';

const quests: Quest[] = [
  {
    id: 1,
    title: 'Reactを30分勉強',
    difficulty: '初級',
    description: 'ReactのuseStateとuseEffectを学習する',
    category: 'フロントエンド',
    duration: '30分',
    acceptPoint: 50,
    clearPoint: 100,
    acceptedToday: 12,
    completedToday: 8,
    completionRate: 67,
  },
  {
    id: 2,
    title: 'SQL問題を5問解く',
    difficulty: '中級',
    description: 'SELECT・JOIN問題を解く',
    category: 'データベース',
    duration: '45分',
    acceptPoint: 80,
    clearPoint: 150,
    acceptedToday: 0,
    completedToday: 5,
    completionRate: 56,
  },
  {
    id: 3,
    title: 'TypeScriptの型を整理する',
    difficulty: '初級',
    description: 'ユニオン型・ジェネリクスの演習問題を解く',
    category: 'フロントエンド',
    duration: '40分',
    acceptPoint: 60,
    clearPoint: 120,
    acceptedToday: 3,
    completedToday: 1,
    completionRate: 33,
  },
  {
    id: 4,
    title: 'アルゴリズム問題を1問解く',
    difficulty: '上級',
    description: '配列・木・グラフの基礎アルゴリズム問題に取り組む',
    category: 'アルゴリズム',
    duration: '60分',
    acceptPoint: 120,
    clearPoint: 240,
    acceptedToday: 1,
    completedToday: 0,
    completionRate: 0,
  },
];

export const QuestBoard = () => {
  const handleAcceptQuest = async (questId: number) => {
    try {
      await acceptQuest(questId);
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
      {quests.map((quest) => (
        <QuestBoardCard
          key={quest.id}
          quest={quest}
          onAccept={() => void handleAcceptQuest(quest.id)}
        />
      ))}
    </div>
  );
};
