'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { type FormEvent, Suspense, useState } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { PasswordField } from '@/components/auth/PasswordField';
import { authClient } from '@/lib/auth-client';
import { getAuthErrorMessage } from '@/lib/auth-error';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const linkError = searchParams.get('error');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    !token || linkError
      ? 'リンクが無効または期限切れです。再度メールを送信してください。'
      : null,
  );
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }
    if (password !== confirmation) {
      setError('確認用パスワードが一致しません。');
      return;
    }

    setPending(true);
    setError(null);
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    if (result.error) {
      setError(
        getAuthErrorMessage(
          result.error,
          'パスワードを再設定できませんでした。',
        ),
      );
    } else {
      setMessage(
        'パスワードを変更しました。新しいパスワードでログインしてください。',
      );
      setPassword('');
      setConfirmation('');
    }
    setPending(false);
  };

  return (
    <AuthCard
      eyebrow="NEW PASSWORD"
      title="新しいパスワードを設定"
      description="ほかのサービスでは使用していない、十分に長いパスワードを設定してください。"
    >
      {message ? (
        <div>
          <p
            role="status"
            className="rounded-lg bg-green-50 p-4 text-sm leading-6 text-green-700"
          >
            {message}
          </p>
          <Link
            href="/login"
            className="mt-5 block rounded-xl bg-blue-600 px-4 py-3 text-center font-bold text-white hover:bg-blue-700"
          >
            ログインする
          </Link>
        </div>
      ) : (
        <form
          method="post"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-5"
        >
          <PasswordField
            id="new-password"
            label="新しいパスワード"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            hint="15～128文字で入力してください。"
          />
          <PasswordField
            id="password-confirmation"
            label="新しいパスワード（確認）"
            value={confirmation}
            onChange={setConfirmation}
            autoComplete="new-password"
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
            disabled={pending || !token}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {pending ? '変更中…' : 'パスワードを変更する'}
          </button>
          {!token ? (
            <Link
              href="/forgot-password"
              className="block text-center text-sm font-bold text-blue-700 hover:underline"
            >
              再設定メールをもう一度送る
            </Link>
          ) : null}
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-slate-500">読み込み中です…</p>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
