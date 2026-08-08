'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, Suspense, useEffect, useState } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { PasswordField } from '@/components/auth/PasswordField';
import { authClient } from '@/lib/auth-client';
import { getAuthErrorMessage } from '@/lib/auth-error';
import { getSafeRedirectPath } from '@/lib/safe-redirect';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const nextPath = getSafeRedirectPath(searchParams.get('next'));

  useEffect(() => {
    if (!sessionPending && session) {
      router.replace('/dashboard');
    }
  }, [router, session, sessionPending]);

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
      callbackURL: nextPath,
    });

    if (result.error) {
      setError(
        getAuthErrorMessage(
          result.error,
          'ログインに失敗しました。入力内容をご確認ください。',
        ),
      );
      setPending(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setPending(true);
    setError(null);
    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL: nextPath,
      newUserCallbackURL: '/dashboard',
    });

    if (result.error) {
      setError(
        getAuthErrorMessage(
          result.error,
          'Googleログインを開始できませんでした。',
        ),
      );
      setPending(false);
    }
  };

  return (
    <AuthCard
      eyebrow="WELCOME BACK"
      title="ログイン"
      description="続きのクエストと、これまでの学習記録に戻りましょう。"
    >
      <button
        type="button"
        onClick={() => void handleGoogleLogin()}
        disabled={pending}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Googleでログイン
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        または
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form
        method="post"
        onSubmit={(event) => void handleEmailLogin(event)}
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
        <PasswordField
          id="password"
          label="パスワード"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            パスワードを忘れた方
          </Link>
        </div>
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
          {pending ? 'ログイン中…' : 'ログイン'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        アカウントをお持ちでない方は{' '}
        <Link
          href="/signup"
          className="font-bold text-blue-700 hover:underline"
        >
          新規登録
        </Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-slate-500">読み込み中です…</p>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
