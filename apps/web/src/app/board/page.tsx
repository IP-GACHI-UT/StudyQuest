import SectionHeader from '@/components/common/SectionHeader';
import { QuestBoard } from '@/components/quests/QuestBoard';

export default function BoardPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        enTitle="QUEST BOARD"
        jaTitle="クエスト掲示板"
        description="多くの学習者が取り組んでいるクエスト"
      />
      <QuestBoard />
    </div>
  );
}
