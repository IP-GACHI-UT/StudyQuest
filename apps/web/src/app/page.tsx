'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { BadgeCard } from '@/components/cards/BadgeCard';
import { MyQuestCard } from '@/components/cards/MyQuestCard';
import { ProfileCard } from '@/components/cards/ProfileCard';
import { RecommendedQuestCard } from '@/components/cards/RecommendedQuestCard';
import { StudyLogCard } from '@/components/cards/StudyLogCard';
import { WeeklyStudyCard } from '@/components/cards/WeeklyStudyCard';
import { ResourceNotice } from '@/components/common/ResourceNotice';
import SectionHeader from '@/components/common/SectionHeader';
import { useApiResource } from '@/hooks/useApiResource';
import {
  type ApiQuest,
  categoryLabel,
  difficultyLabel,
  formatStudyMinutes,
  type Profile,
  type StudyLog,
  statusLabel,
  type UserQuest,
  type WeeklySummary,
} from '@/lib/api';
import { acceptQuest } from '@/utils/acceptQuest';

export default function Home() {
  const myQuests = useApiResource<{ userQuests: UserQuest[] }>('/my-quests');
  const quests = useApiResource<{ quests: ApiQuest[] }>('/quests');
  const logs = useApiResource<{ studyLogs: StudyLog[] }>('/study-logs');
  const weekly = useApiResource<{ summary: WeeklySummary }>(
    '/study-summary/weekly',
  );
  const profile = useApiResource<{ profile: Profile }>('/profile');
  const accepting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const active =
    myQuests.data?.userQuests.filter((item) => item.status === 'in_progress') ??
    [];
  const acceptedIds = new Set(
    myQuests.data?.userQuests.map((item) => item.quest.id),
  );
  const recommended =
    quests.data?.quests
      .filter((item) => !acceptedIds.has(item.id))
      .slice(0, 2) ?? [];
  async function accept(id: string) {
    if (accepting.current) return;
    accepting.current = true;
    setBusy(true);
    setMessage(null);
    try {
      await acceptQuest(id);
      myQuests.reload();
      profile.reload();
      setMessage(
        'クエストを受注しました。マイクエストから学習を始められます。',
      );
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : '受注に失敗しました。',
      );
    } finally {
      accepting.current = false;
      setBusy(false);
    }
  }
  const summary = weekly.data?.summary;
  const person = profile.data?.profile;
  return (
    <div className="space-y-6">
      <SectionHeader
        enTitle="MY QUEST"
        jaTitle="いま達成を目指しているクエスト"
        description={`進行中: ${active.length}件`}
      />
      <ResourceNotice {...myQuests} />
      {!myQuests.loading &&
        !myQuests.error &&
        (active[0] ? (
          <MyQuestCard
            status={statusLabel[active[0].status]}
            title={active[0].quest.title}
            category={active[0].quest.category}
            difficulty={difficultyLabel[active[0].quest.difficulty]}
            buttonLabel="学習する"
            href={`/study/${encodeURIComponent(active[0].quest.id)}`}
          />
        ) : (
          <p>受注中のクエストはありません。</p>
        ))}
      <Link href="/my-quest" className="inline-block text-blue-600 underline">
        マイクエストをすべて見る
      </Link>
      <SectionHeader
        enTitle="RECOMMENDED"
        jaTitle="おすすめクエスト"
        description="未受注のクエストから選べます"
      />
      <ResourceNotice {...quests} />
      {message && (
        <p role="status">
          {message}{' '}
          <Link href="/my-quest" className="text-blue-600 underline">
            マイクエストへ
          </Link>
        </p>
      )}
      {!quests.loading &&
        !quests.error &&
        !myQuests.loading &&
        !myQuests.error &&
        (recommended.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {recommended.map((quest) => (
              <RecommendedQuestCard
                key={quest.id}
                title={quest.title}
                difficulty={difficultyLabel[quest.difficulty]}
                description={quest.description}
                category={categoryLabel(quest.category)}
                duration={`${quest.estimatedMinutes}分`}
                acceptPoint={quest.acceptPoint}
                clearPoint={quest.clearPoint}
                isAccepting={busy}
                onAccept={() => void accept(quest.id)}
              />
            ))}
          </div>
        ) : (
          <p>新しく受注できるクエストはありません。</p>
        ))}
      <ResourceNotice {...weekly} />
      {!weekly.loading && !weekly.error && summary && (
        <WeeklyStudyCard
          studyMinutes={summary.studyMinutes}
          completedQuests={summary.completedQuestCount}
          earnedXp={summary.earnedXp}
          streakDays={summary.streakDays}
          chartData={summary.dailyStudyMinutes.map((day, index) => ({
            day: ['月', '火', '水', '木', '金', '土', '日'][index],
            hours: day.minutes / 60,
          }))}
        />
      )}
      <ResourceNotice {...profile} />
      {!profile.loading && !profile.error && person && (
        <>
          <ProfileCard
            userName={person.displayName}
            level={person.level}
            totalPoints={person.totalPoints}
            totalXp={person.totalXp}
            totalStudyTime={formatStudyMinutes(person.totalStudyMinutes)}
            icon={<div className="h-full w-full bg-gray-300" />}
          />
          {person.badges.length ? (
            <BadgeCard
              title="最近のバッジ"
              badges={person.badges.map((badge) => ({
                id: badge.id,
                icon: badge.icon ?? '🏅',
                description: `${badge.name}: ${badge.description}`,
              }))}
            />
          ) : (
            <p className="text-sm text-gray-500">
              獲得したバッジはまだありません。
            </p>
          )}
        </>
      )}
      <StudyLogCard
        logs={
          logs.data?.studyLogs.map((log) => ({
            created_at: new Date(log.studiedAt),
            text: `${log.minutes}分${log.note ? `・${log.note}` : ''}`,
          })) ?? []
        }
        isLoading={logs.loading}
        error={logs.error}
      />
      {logs.error && (
        <button
          type="button"
          onClick={logs.reload}
          className="rounded border px-4 py-2"
        >
          学習ログを再試行
        </button>
      )}
    </div>
  );
}
