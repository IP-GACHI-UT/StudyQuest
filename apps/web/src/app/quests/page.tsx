import SectionHeader from '@/components/common/SectionHeader';
import { QuestList } from '@/components/quests/QuestList';

export default function QuestsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        enTitle="QUEST BOARD"
        jaTitle="クエスト一覧"
        description="挑戦したいクエストを選びましょう"
      />
      <QuestList />
    </div>
  );
}
