"use client";

import { BadgeCard } from "@/components/cards/BadgeCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { MyQuestCard } from "@/components/cards/MyQuestCard";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { QuestAcceptanceRateCard } from "@/components/cards/QuestAcceptanceRateCard";
import SectionHeader from "@/components/common/SectionHeader";
import { StudyLogCard } from "@/components/cards/StudyLogCard";
import { GoalCard } from "@/components/cards/GoalCard";
import { RecommendedQuestCard } from "@/components/cards/RecommendedQuestCard";
import { WeeklyStudyCard } from "@/components/cards/WeeklyStudyCard";

export default function Home() {
  return (
    <main>
      <Header />

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
        difficulty="Easy"
        description="お気に入りのライブラリやフレームワークの公式ドキュメントを読んで理解を深めましょう"
        category="プログラミング"
        duration="10分"
        acceptPoint={10}
        clearPoint={20}
        onAccept={() => alert('Accepting quest')}
      />
      <RecommendedQuestCard
        title="英単語を10個覚える"
        difficulty="Easy"
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
          { day: "月", hours: 2 },
          { day: "火", hours: 1 },
          { day: "水", hours: 3 },
          { day: "木", hours: 1 },
          { day: "金", hours: 2 },
          { day: "土", hours: 0 },
          { day: "日", hours: 0 },
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
          { id: "1", icon: "🏆", description: "初学者" },
          { id: "2", icon: "⭐", description: "エキスパート" },
          { id: "3", icon: "🔥", description: "熱心な学習者" },
        ]}
      />

      <StudyLogCard 
        logs={[
          { created_at: new Date(), text: "「公式ドキュメントを10分読む」を達成" },
          { created_at: new Date(2026, 5, 12), text: "10分の学習セッションを記録" },
          { created_at: new Date(2026, 5, 1), text: "「TypeScriptの型を復習」を達成" },
          { created_at: new Date(2025, 3, 1), text: "「技術記事を1本読む」を達成" },
        ]}
      />

      <Footer />
    </main>
  );
}