import BadgeCard from "@/components/BadgeCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MyQuestCard from "@/components/MyQuestCard";
import ProfileCard from "@/components/ProfileCard";
import QuestCard from "@/components/QuestCard";
import SectionHeader from "@/components/SectionHeader";
import StudyLogCard from "@/components/StudyLogCard";
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
      <MyQuestCard />

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

      <StudyLogCard />

      <Footer />
    </main>
  );
}