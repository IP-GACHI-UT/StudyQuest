import { User } from 'lucide-react';
import { NavigationMenu } from './Header/NavigationMenu';

type HeaderProps = {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  weeklyPoint: number;
};

export default function Header({
  level,
  currentXp,
  nextLevelXp,
  weeklyPoint,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-gray-800 text-white p-4">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-8">
        {/* Logo */}
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">StudyQuest</h1>
          <p className="text-xs text-gray-500">Small quests. Quiet progress.</p>
        </div>

        {/* Navigation */}
        <NavigationMenu />

        {/* User Info */}
        <div className="flex items-center gap-8">
          {/* Level & XP */}
          <div className="min-w-48">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold">Lv.{level}</span>
              <span className="text-gray-500">
                {currentXp} / {nextLevelXp} XP
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-4/5 rounded-full bg-blue-500" />
            </div>
          </div>

          {/* Weekly Points */}
          <div className="text-right">
            <p className="text-xs text-gray-500">This Week</p>
            <p className="font-semibold">{weeklyPoint.toLocaleString()} Pt</p>
          </div>

          {/* Profile Icon */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border bg-gray-50 hover:bg-gray-100"
          >
            <div className="h-16 w-16 overflow-hidden rounded-full">
              <User size={20} />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
