'use client';

import { LogOut, Menu, UserRound, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

const publicNavigation = [
  { label: 'ホーム', href: '/' },
  { label: 'クエスト', href: '/quests' },
];

const authenticatedNavigation = [
  { label: 'ダッシュボード', href: '/dashboard' },
  { label: 'クエスト', href: '/quests' },
  { label: '掲示板', href: '/board' },
];

export default function Header() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isOpen, setIsOpen] = useState(false);
  const navigation = session ? authenticatedNavigation : publicNavigation;

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          setIsOpen(false);
          router.push('/');
          router.refresh();
        },
      },
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-18 w-full max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0" onClick={() => setIsOpen(false)}>
          <span className="block text-xl font-black tracking-tight text-slate-900">
            StudyQuest
          </span>
          <span className="block text-xs text-slate-500">
            Small quests. Quiet progress.
          </span>
        </Link>

        <nav aria-label="メインナビゲーション" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm font-semibold text-slate-600 transition hover:text-blue-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isPending ? (
            <span className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
          ) : session ? (
            <>
              <span className="flex max-w-40 items-center gap-2 truncate text-sm font-semibold text-slate-700">
                <UserRound aria-hidden="true" size={18} />
                {session.user.name}
              </span>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              >
                <LogOut aria-hidden="true" size={16} />
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                ログイン
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                無料で始める
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className="rounded-lg border border-slate-200 p-2 text-slate-700 md:hidden"
        >
          {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {isOpen ? (
        <nav
          aria-label="モバイルナビゲーション"
          className="border-t border-slate-200 bg-white px-4 py-4 md:hidden"
        >
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-lg px-3 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3">
            {session ? (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="rounded-lg border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700"
              >
                ログアウト
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-3 text-center font-semibold text-slate-700"
                >
                  ログイン
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg bg-blue-600 px-4 py-3 text-center font-bold text-white"
                >
                  無料で始める
                </Link>
              </>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
