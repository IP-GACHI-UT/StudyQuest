type AuthError = {
  code?: string;
  message?: string;
};

const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD:
    'メールアドレスまたはパスワードが正しくありません。',
  EMAIL_NOT_VERIFIED:
    'メールアドレスの確認が完了していません。確認メールをご確認ください。',
  USER_ALREADY_EXISTS: '登録を受け付けました。確認メールをご確認ください。',
  PASSWORD_TOO_SHORT: 'パスワードは15文字以上で入力してください。',
  PASSWORD_TOO_LONG: 'パスワードは128文字以内で入力してください。',
  PASSWORD_COMPROMISED:
    '漏えいが確認されたパスワードは使用できません。別のパスワードを設定してください。',
  INVALID_TOKEN:
    'リンクが無効または期限切れです。もう一度手続きを行ってください。',
  TOO_MANY_REQUESTS: '試行回数が上限に達しました。時間をおいてお試しください。',
};

export function getAuthErrorMessage(
  error: AuthError | null | undefined,
  fallback: string,
) {
  if (error?.code && messages[error.code]) {
    return messages[error.code];
  }

  return error?.message || fallback;
}
