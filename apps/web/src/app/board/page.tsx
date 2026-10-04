import SectionHeader from '@/components/common/SectionHeader';
import { QuestBoard } from '@/components/quests/QuestBoard';

export default function BoardPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        enTitle="QUEST BOARD"
        jaTitle="クエスト掲示板"
        description="クエストごとの今日の受注・達成と、累計の達成率"
      />
      <QuestBoard />
    </div>
  );
}
