'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { authClient } from '@/lib/auth-client';
import { getAuthErrorMessage } from '@/lib/auth-error';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    });

    if (result.error) {
      setError(
        getAuthErrorMessage(
          result.error,
          '再設定メールを送信できませんでした。',
        ),
      );
    } else {
      setMessage(
        '入力されたメールアドレスが登録されている場合、パスワード再設定メールを送信しました。',
      );
    }
    setPending(false);
  };

  return (
    <AuthCard
      eyebrow="RESET PASSWORD"
      title="パスワードをお忘れですか？"
      description="登録したメールアドレスへ、1時間有効な再設定リンクを送信します。"
    >
      <form
        method="post"
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-bold text-slate-700"
          >
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        {message ? (
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
          >
            {message}
          </p>
        ) : null}
        {error ? (
          <p
            role="alert"
            aria-live="polite"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {pending ? '送信中…' : '再設定メールを送る'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-bold text-blue-700 hover:underline">
          ログイン画面へ戻る
        </Link>
      </p>
    </AuthCard>
  );
}
