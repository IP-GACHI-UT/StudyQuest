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

type LogItem = {
  created_at: Date;
  text: string;
};

const mapStudyLogsToLogItems = (studyLogs: ApiStudyLog[]): LogItem[] =>
  studyLogs.map((log) => ({
    created_at: new Date(log.createdAt),
    text:
      log.note && log.note.trim()
        ? log.note
        : `${log.minutes}分の学習を記録しました。`,
  }));

export default function Home() {
  const [studyLogs, setStudyLogs] = useState<LogItem[]>([]);
  const [studyLogLoading, setStudyLogLoading] = useState(true);
  const [studyLogError, setStudyLogError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStudyLogs() {
      try {
        const response = await fetch('http://localhost:3001/api/study-logs', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('学習ログの取得に失敗しました。');
        }

        const data = (await response.json()) as ApiStudyLogsResponse;
        setStudyLogs(mapStudyLogsToLogItems(data.studyLogs));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setStudyLogError(
          error instanceof Error
            ? error.message
            : '学習ログの取得中にエラーが発生しました。',
        );
      } finally {
        setStudyLogLoading(false);
      }
    }

    loadStudyLogs();

    return () => controller.abort();
  }, []);

  return (
    <main>
      <SectionHeader
        enTitle="MY QUEST"
        jaTitle="いま達成を目指しているクエスト"
        description="受注:1 / 3"
      />
      <MyQuestCard
        status="進行中"
        title="公式ドキュメントを10分読む"
        category="プログラミング"
        difficulty="easy"
        buttonLabel="学習する"
        onButtonClick={() => alert('Viewing quest details')}
      />

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
        onAccept={() => alert('Accepting quest')}
      />
      <RecommendedQuestCard
        title="英単語を10個覚える"
        difficulty="初級"
        description="毎日10個の新しい英単語を学び、記憶に定着させましょう"
        category="英語"
        duration="10分"
        acceptPoint={10}
        clearPoint={20}
        onAccept={() => alert('Accepting quest')}
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

      <ProfileCard
        userName="学習者"
        level={5}
        totalPoints={1000}
        totalXp={500}
        totalStudyTime="2時間 30分"
        icon={<div className="h-full w-full bg-gray-300" />}
        onProfileClick={() => alert('Viewing profile')}
      />

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
