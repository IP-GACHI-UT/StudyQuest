import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>&copy; 2026 StudyQuest. All rights reserved.</p>
        <nav aria-label="フッターナビゲーション">
          <ul className="flex gap-5">
            <li>
              <Link href="/privacy" className="hover:text-white">
                プライバシーポリシー
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                利用規約
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
