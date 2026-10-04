'use client';
import Link from 'next/link';
import { MyQuestCard } from '@/components/cards/MyQuestCard';
import { ResourceNotice } from '@/components/common/ResourceNotice';
import SectionHeader from '@/components/common/SectionHeader';
import { useApiResource } from '@/hooks/useApiResource';
import { difficultyLabel, statusLabel, type UserQuest } from '@/lib/api';

export default function MyQuestPage() {
  const resource = useApiResource<{ userQuests: UserQuest[] }>('/my-quests');
  const quests = resource.data?.userQuests ?? [];
  const activeCount = quests.filter(
    (quest) => quest.status === 'in_progress',
  ).length;
  return (
    <div className="space-y-6">
      <SectionHeader
        enTitle="MY QUEST"
        jaTitle="マイクエスト"
        description={`進行中: ${activeCount}件 / 受注履歴: ${quests.length}件`}
      />
      <ResourceNotice {...resource} />
      {!resource.loading &&
        !resource.error &&
        (quests.length === 0 ? (
          <p>
            受注中のクエストはまだありません。
            <Link href="/quests" className="ml-2 text-blue-600 underline">
              クエストを探す
            </Link>
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {quests.map((item) => (
              <MyQuestCard
                key={item.id}
                status={statusLabel[item.status]}
                title={item.quest.title}
                category={item.quest.category}
                difficulty={difficultyLabel[item.quest.difficulty]}
                buttonLabel={
                  item.status === 'in_progress' ? '学習する' : '学習記録を見る'
                }
                href={`/study/${encodeURIComponent(item.quest.id)}`}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
