'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { QuestBoardCard } from '@/components/cards/QuestBoardCard';
import { ResourceNotice } from '@/components/common/ResourceNotice';
import { CATEGORIES, type Category } from '@/constants/quest/category';
import type { Difficulty } from '@/constants/quest/difficulty';
import { useApiResource } from '@/hooks/useApiResource';
import { AuthenticationRequiredError, currentLoginHref } from '@/lib/api';
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

export const QuestBoard = () => {
  const resource = useApiResource<{ quests: ApiBoardQuest[] }>('/board/quests');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [acceptMessage, setAcceptMessage] = useState<string | null>(null);
  const acceptLock = useRef(false);
  const quests = resource.data?.quests.map(mapBoardQuest) ?? [];

  const handleAcceptQuest = async (questId: string) => {
    if (acceptLock.current || resource.loading || resource.error) return;
    acceptLock.current = true;
    setAcceptingId(questId);
    setAcceptError(null);
    setAcceptMessage(null);
    try {
      await acceptQuest(questId);
      setAcceptedIds((current) => new Set([...current, questId]));
      setAcceptMessage('クエストを受注しました。');
      resource.reload();
    } catch (acceptError) {
      if (acceptError instanceof AuthenticationRequiredError) {
        window.location.assign(currentLoginHref());
        return;
      }
      setAcceptError(
        acceptError instanceof Error
          ? acceptError.message
          : 'クエストの受注に失敗しました。',
      );
      // 応答だけ失われた場合も、取得で最新の受注状態を確認する。
      resource.reload();
    } finally {
      acceptLock.current = false;
      setAcceptingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <ResourceNotice {...resource} />
      {acceptError ? (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
          {acceptError}
        </p>
      ) : null}
      {acceptMessage ? (
        <p role="status" className="rounded-lg bg-blue-50 p-4 text-blue-800">
          {acceptMessage}{' '}
          <Link href="/my-quest" className="underline">
            マイクエストへ
          </Link>
        </p>
      ) : null}
      {!resource.loading && !resource.error && quests.length === 0 ? (
        <p>現在、掲示板に表示するクエストはありません。</p>
      ) : null}
      {quests.map((quest) => (
        <QuestBoardCard
          key={quest.id}
          quest={{
            ...quest,
            isAccepted: quest.isAccepted || acceptedIds.has(quest.id),
          }}
          disabled={
            acceptingId !== null || resource.loading || !!resource.error
          }
          isAccepting={acceptingId === quest.id}
          onAccept={(id) => void handleAcceptQuest(id)}
        />
      ))}
    </div>
  );
};
