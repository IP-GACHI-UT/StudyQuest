"use client";

import BadgeCard from "@/components/BadgeCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { MyQuestCard } from "@/components/MyQuestCard";
import ProfileCard from "@/components/ProfileCard";
import QuestCard from "@/components/QuestCard";
import SectionHeader from "@/components/SectionHeader";
import { StudyLogCard } from "@/components/StudyLogCard";
import StudyTimeCard from "@/components/StudyTimeCard";
import TargetCard from "@/components/TargetCard";

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

      <TargetCard />

      <StudyTimeCard />

      <ProfileCard />

      <BadgeCard />

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