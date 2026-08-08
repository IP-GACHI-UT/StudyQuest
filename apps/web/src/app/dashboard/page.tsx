'use client';

import { BookOpenCheck, Clock3, Flame, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

type DashboardData = {
  profile: {
    displayName: string;
    level: number;
    totalPoints: number;
    totalXp: number;
    totalStudyMinutes: number;
  };
  quests: Array<{
    id: string;
    status: string;
    quest: { title: string; category: string; estimatedMinutes: number };
  }>;
  summary: {
    studyMinutes: number;
    completedQuestCount: number;
    earnedXp: number;
    streakDays: number;
  };
};

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const responses = await Promise.all([
          fetch('/api/profile', {
            credentials: 'include',
            signal: controller.signal,
          }),
          fetch('/api/my-quests', {
            credentials: 'include',
            signal: controller.signal,
          }),
          fetch('/api/study-summary/weekly', {
            credentials: 'include',
            signal: controller.signal,
          }),
        ]);

        if (responses.some((response) => !response.ok)) {
          throw new Error('ダッシュボードの取得に失敗しました。');
        }

        const [profileResponse, questsResponse, summaryResponse] =
          await Promise.all(responses.map((response) => response.json()));

        setData({
          profile: profileResponse.profile,
          quests: questsResponse.userQuests,
          summary: summaryResponse.summary,
        });
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'ダッシュボードの取得に失敗しました。',
          );
        }
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"
        role="alert"
      >
        <h1 className="font-bold">データを読み込めませんでした</h1>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <p className="py-16 text-center text-slate-500">
        ダッシュボードを読み込み中です…
      </p>
    );
  }

  const stats = [
    {
      label: '今週の学習',
      value: `${data.summary.studyMinutes}分`,
      icon: Clock3,
    },
    {
      label: '完了クエスト',
      value: `${data.summary.completedQuestCount}件`,
      icon: BookOpenCheck,
    },
    { label: '連続学習', value: `${data.summary.streakDays}日`, icon: Flame },
    { label: '獲得XP', value: `${data.summary.earnedXp} XP`, icon: Sparkles },
  ];

  return (
    <div className="space-y-9">
      <section className="rounded-3xl bg-slate-950 px-6 py-10 text-white sm:px-10">
        <p className="text-sm font-semibold text-blue-300">DASHBOARD</p>
        <h1 className="mt-2 text-3xl font-black">
          {data.profile.displayName || session?.user.name}
          さん、今日も一歩進めましょう。
        </h1>
        <p className="mt-3 text-slate-300">
          Lv.{data.profile.level} ・ {data.profile.totalPoints.toLocaleString()}{' '}
          Pt ・ {data.profile.totalXp.toLocaleString()} XP
        </p>
      </section>

      <section aria-labelledby="weekly-heading">
        <h2 id="weekly-heading" className="text-2xl font-black text-slate-900">
          今週の学習状況
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <article
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <Icon aria-hidden="true" className="text-blue-600" size={22} />
              <p className="mt-4 text-sm font-semibold text-slate-500">
                {label}
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="my-quests-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-widest text-blue-600">
              MY QUESTS
            </p>
            <h2
              id="my-quests-heading"
              className="mt-1 text-2xl font-black text-slate-900"
            >
              受注中のクエスト
            </h2>
          </div>
          <Link
            href="/quests"
            className="text-sm font-bold text-blue-700 hover:text-blue-800"
          >
            クエストを探す
          </Link>
        </div>

        {data.quests.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-slate-600">受注中のクエストはありません。</p>
            <Link
              href="/quests"
              className="mt-4 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 font-bold text-white"
            >
              最初のクエストを選ぶ
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {data.quests.slice(0, 4).map((userQuest) => (
              <article
                key={userQuest.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-xs font-bold text-blue-700">
                  {userQuest.quest.category}
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  {userQuest.quest.title}
                </h3>
                <p className="mt-3 text-sm text-slate-500">
                  目安 {userQuest.quest.estimatedMinutes}分 ・{' '}
                  {userQuest.status === 'completed' ? '達成済み' : '進行中'}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
