'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { authClient } from '@/lib/auth-client';
import { getAuthErrorMessage } from '@/lib/auth-error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleResend = async () => {
    setPending(true);
    setMessage(null);
    setError(null);
    const result = await authClient.sendVerificationEmail({
      email,
      callbackURL: '/dashboard',
    });

    if (result.error) {
      setError(
        getAuthErrorMessage(result.error, '確認メールを送信できませんでした。'),
      );
    } else {
      setMessage('確認メールを送信しました。受信トレイをご確認ください。');
    }
    setPending(false);
  };

  return (
    <AuthCard
      eyebrow="CHECK YOUR EMAIL"
      title="メールをご確認ください"
      description="確認リンクを開くと登録が完了し、自動的にダッシュボードへログインします。リンクは1時間有効です。"
    >
      <div>
        <label
          htmlFor="verify-email"
          className="block text-sm font-bold text-slate-700"
        >
          メールアドレス
        </label>
        <input
          id="verify-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      {message ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          aria-live="polite"
          className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void handleResend()}
        disabled={pending || !email}
        className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {pending ? '送信中…' : '確認メールを再送する'}
      </button>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-bold text-blue-700 hover:underline">
          ログイン画面へ戻る
        </Link>
      </p>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-slate-500">読み込み中です…</p>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
