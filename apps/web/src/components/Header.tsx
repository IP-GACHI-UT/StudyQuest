import Link from 'next/link';
import { NavigationMenu } from './Header/NavigationMenu';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-gray-800 text-white p-4">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex flex-col">
          <span className="text-xl font-bold">StudyQuest</span>
          <span className="text-xs text-gray-300">
            Small quests. Quiet progress.
          </span>
        </Link>
        <NavigationMenu />
      </div>
    </header>
  );
}
