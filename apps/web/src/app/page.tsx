import BadgeCard from "@/components/BadgeCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MyQuestCard from "@/components/MyQuestCard";
import ProfileCard from "@/components/ProfileCard";
import QuestCard from "@/components/QuestCard";
import StudyLogCard from "@/components/StudyLogCard";
import StudyTimeCard from "@/components/StudyTimeCard";
import TargetCard from "@/components/TargetCard";

export default function Home() {
  return (
    <main>
      <Header />

      <MyQuestCard />

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