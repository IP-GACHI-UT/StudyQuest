'use client';

import { useEffect, useState } from 'react';
import { BadgeCard } from '@/components/cards/BadgeCard';
import { GoalCard } from '@/components/cards/GoalCard';
import { MyQuestCard } from '@/components/cards/MyQuestCard';
import { ProfileCard } from '@/components/cards/ProfileCard';
import { QuestAcceptanceRateCard } from '@/components/cards/QuestAcceptanceRateCard';
import { RecommendedQuestCard } from '@/components/cards/RecommendedQuestCard';
import { StudyLogCard } from '@/components/cards/StudyLogCard';
import { WeeklyStudyCard } from '@/components/cards/WeeklyStudyCard';
import SectionHeader from '@/components/common/SectionHeader';
import { acceptQuest } from '@/utils/acceptQuest';

type ApiStudyLog = {
  id: string;
  userId: string;
  questId: string;
  minutes: number;
  note?: string | null;
  studiedAt: string;
  createdAt: string;
};

type ApiStudyLogsResponse = {
  studyLogs: ApiStudyLog[];
};

type ApiProfile = {
  id: string;
  displayName: string;
  level: number;
  totalPoints: number;
  totalXp: number;
  totalStudyMinutes: number;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string;
  }>;
};

type ApiProfileResponse = {
  profile: ApiProfile;
};

type LogItem = {
  created_at: Date;
  text: string;
};

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

const mapStudyLogsToLogItems = (studyLogs: ApiStudyLog[]): LogItem[] =>
  studyLogs.map((log) => ({
    created_at: new Date(log.createdAt),
    text: log.note?.trim()
      ? log.note
      : `${log.minutes}分の学習を記録しました。`,
  }));

const formatMinutesToStudyTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}分`;
  }

  if (remainingMinutes === 0) {
    return `${hours}時間`;
  }

  return `${hours}時間 ${remainingMinutes}分`;
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

export default function Home() {
  const [studyLogs, setStudyLogs] = useState<LogItem[]>([]);
  const [studyLogLoading, setStudyLogLoading] = useState(true);
  const [studyLogError, setStudyLogError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [myQuests, setMyQuests] = useState<ApiMyQuest[]>([]);
  const [myQuestsLoading, setMyQuestsLoading] = useState(true);
  const [myQuestsError, setMyQuestsError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboardData() {
      try {
        const [profileResult, studyLogsResult, myQuestsResult] =
          await Promise.allSettled([
            fetch('http://localhost:3001/api/profile', {
              signal: controller.signal,
            }),
            fetch('http://localhost:3001/api/study-logs', {
              signal: controller.signal,
            }),
            fetch('http://localhost:3001/api/my-quests', {
              signal: controller.signal,
            }),
          ]);

        if (profileResult.status === 'fulfilled' && profileResult.value.ok) {
          const profileData =
            (await profileResult.value.json()) as ApiProfileResponse;
          setProfile(profileData.profile);
          setProfileError(null);
        } else {
          setProfileError('プロフィールの取得に失敗しました。');
        }

        if (studyLogsResult.status === 'fulfilled' && studyLogsResult.value.ok) {
          const studyLogsData =
            (await studyLogsResult.value.json()) as ApiStudyLogsResponse;
          setStudyLogs(mapStudyLogsToLogItems(studyLogsData.studyLogs));
          setStudyLogError(null);
        } else {
          setStudyLogError('学習ログの取得に失敗しました。');
        }

        if (myQuestsResult.status === 'fulfilled' && myQuestsResult.value.ok) {
          const myQuestsData =
            (await myQuestsResult.value.json()) as ApiMyQuestsResponse;
          setMyQuests(myQuestsData.userQuests);
          setMyQuestsError(null);
        } else {
          setMyQuestsError('マイクエストの取得に失敗しました。');
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'データ取得中にエラーが発生しました。';

        setProfileError(message);
        setStudyLogError(message);
        setMyQuestsError(message);
      } finally {
        if (!controller.signal.aborted) {
          setStudyLogLoading(false);
          setProfileLoading(false);
          setMyQuestsLoading(false);
        }
      }
    }

    void loadDashboardData();

    return () => controller.abort();
  }, []);

  const featuredQuest = myQuests[0];

  return (
    <main>
      <SectionHeader
        enTitle="MY QUEST"
        jaTitle="いま達成を目指しているクエスト"
        description={`受注:${myQuests.length}`}
      />
      {myQuestsLoading ? (
        <p className="py-4 text-sm text-gray-500">読み込み中...</p>
      ) : myQuestsError ? (
        <p className="py-4 text-sm text-red-500">{myQuestsError}</p>
      ) : featuredQuest ? (
        <MyQuestCard
          status={mapQuestStatusToDisplay(featuredQuest.status)}
          title={featuredQuest.quest.title}
          category={featuredQuest.quest.category}
          difficulty={featuredQuest.quest.difficulty}
          buttonLabel={
            featuredQuest.status === 'completed'
              ? '結果を見る'
              : featuredQuest.status === 'canceled'
                ? '再開する'
                : '学習する'
          }
          onButtonClick={() => alert('Viewing quest details')}
        />
      ) : (
        <p className="py-4 text-sm text-gray-500">
          受注中のクエストはありません。
        </p>
      )}

      <SectionHeader
        enTitle="RECOMMENDED"
        jaTitle="おすすめクエスト"
        description="今日受け取れるクエスト"
      />
      <RecommendedQuestCard
        title="公式ドキュメントを10分読む"
        difficulty="初級"
        description="お気に入りのライブラリやフレームワークの公式ドキュメントを読んで理解を深めましょう"
        category="アルゴリズム"
        duration="10分"
        acceptPoint={10}
        clearPoint={20}
        onAccept={() => {
          void acceptQuest('1').catch((error) => {
            alert(
              error instanceof Error ? error.message : '受注に失敗しました',
            );
          });
        }}
      />
      <RecommendedQuestCard
        title="英単語を10個覚える"
        difficulty="初級"
        description="毎日10個の新しい英単語を学び、記憶に定着させましょう"
        category="英語"
        duration="10分"
        acceptPoint={10}
        clearPoint={20}
        onAccept={() => {
          void acceptQuest('2').catch((error) => {
            alert(
              error instanceof Error ? error.message : '受注に失敗しました',
            );
          });
        }}
      />

      <SectionHeader
        enTitle="BOARD"
        jaTitle="今日の活動"
        description="多くの学習者が取り組んでいるクエスト"
      />
      <QuestAcceptanceRateCard
        title="公式ドキュメントを10分読む"
        category="プログラミング"
        acceptedCount={15}
        completedCount={10}
      />

      <GoalCard
        tag="目標"
        title="1週間で10時間学習する"
        description="毎日1時間学習することで、1週間で10時間の学習を達成します。"
        deadline="2023-12-31"
        progress={70}
        questCount={5}
      />

      <WeeklyStudyCard
        studyHours={7}
        weeklyGoalHours={10}
        completedQuests={3}
        earnedXp={500}
        streakDays={5}
        chartData={[
          { day: '月', hours: 2 },
          { day: '火', hours: 1 },
          { day: '水', hours: 3 },
          { day: '木', hours: 1 },
          { day: '金', hours: 2 },
          { day: '土', hours: 0 },
          { day: '日', hours: 0 },
        ]}
      />

      <div>
        {profileError ? (
          <p className="mb-4 text-sm text-red-500">{profileError}</p>
        ) : null}
        <ProfileCard
          userName={
            profile?.displayName ?? (profileLoading ? '読み込み中' : '学習者')
          }
          level={profile?.level ?? 0}
          totalPoints={profile?.totalPoints ?? 0}
          totalXp={profile?.totalXp ?? 0}
          totalStudyTime={formatMinutesToStudyTime(
            profile?.totalStudyMinutes ?? 0,
          )}
          icon={<div className="h-full w-full bg-gray-300" />}
          onProfileClick={() => alert('Viewing profile')}
        />
      </div>

      <BadgeCard
        title="最近のバッジ"
        badges={[
          { id: '1', icon: '🏆', description: '初学者' },
          { id: '2', icon: '⭐', description: 'エキスパート' },
          { id: '3', icon: '🔥', description: '熱心な学習者' },
        ]}
      />

      <StudyLogCard
        logs={studyLogs}
        isLoading={studyLogLoading}
        error={studyLogError}
      />
    </main>
  );
}
