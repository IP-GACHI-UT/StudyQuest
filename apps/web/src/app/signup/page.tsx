'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { PasswordField } from '@/components/auth/PasswordField';
import { authClient } from '@/lib/auth-client';
import { getAuthErrorMessage } from '@/lib/auth-error';

export default function SignupPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!sessionPending && session) {
      router.replace('/dashboard');
    }
  }, [router, session, sessionPending]);

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await authClient.signUp.email({
      name: name.trim(),
      email,
      password,
      callbackURL: '/dashboard',
    });

    if (result.error) {
      setError(
        getAuthErrorMessage(
          result.error,
          '登録に失敗しました。入力内容をご確認ください。',
        ),
      );
      setPending(false);
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  const handleGoogleSignup = async () => {
    setPending(true);
    setError(null);
    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard',
      newUserCallbackURL: '/dashboard',
    });

    if (result.error) {
      setError(
        getAuthErrorMessage(result.error, 'Google登録を開始できませんでした。'),
      );
      setPending(false);
    }
  };

  return (
    <AuthCard
      eyebrow="START YOUR QUEST"
      title="新規登録"
      description="アカウントを作成して、学習の積み重ねを自分の記録として残しましょう。"
    >
      <button
        type="button"
        onClick={() => void handleGoogleSignup()}
        disabled={pending}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Googleで登録
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        または
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form
        method="post"
        onSubmit={(event) => void handleSignup(event)}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-bold text-slate-700"
          >
            表示名
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            minLength={1}
            maxLength={80}
            required
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
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
        <PasswordField
          id="password"
          label="パスワード"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint="15～128文字。長いフレーズを推奨します。文字種の組み合わせは必須ではありません。"
        />
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
          {pending ? '登録中…' : 'メールアドレスで登録'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/login" className="font-bold text-blue-700 hover:underline">
          ログイン
        </Link>
      </p>
    </AuthCard>
  );
}
