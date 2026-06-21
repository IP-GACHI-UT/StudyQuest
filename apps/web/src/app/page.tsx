"use client";

import { BadgeCard } from "@/components/cards/BadgeCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { MyQuestCard } from "@/components/cards/MyQuestCard";
import { ProfileCard } from "@/components/cards/ProfileCard";
import QuestCard from "@/components/cards/QuestCard";
import SectionHeader from "@/components/common/SectionHeader";
import { StudyLogCard } from "@/components/cards/StudyLogCard";
import StudyTimeCard from "@/components/cards/StudyTimeCard";
import { GoalCard } from "@/components/cards/GoalCard";

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
      <QuestCard />

      <SectionHeader 
        enTitle="BOARD"
        jaTitle="今日の活動"
        description="多くの学習者が取り組んでいるクエスト"
      />
      <QuestCard />

      <GoalCard
        tag="目標"
        title="1週間で10時間学習する"
        description="毎日1時間学習することで、1週間で10時間の学習を達成します。"
        deadline="2023-12-31"
        progress={70}
        questCount={5}
      />

      <StudyTimeCard />

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