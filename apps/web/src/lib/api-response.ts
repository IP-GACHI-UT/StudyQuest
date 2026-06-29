/**
 * APIレスポンスの型定義
 */
type ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

/**
 * JSON形式のレスポンスを生成する
 * @param body レスポンス本体
 * @param status ステータスコード
 * @returns Response
 */
export function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/**
 * エラー時に返却するレスポンスを生成する
 * @param code エラーコード
 * @param message エラーメッセージ
 * @param status ステータスコード
 * @param details エラー詳細
 * @returns Response
 */
export function errorResponse(
  code: string,
  message: string,
  status = 500,
  details?: unknown,
) {
  const body: ErrorBody = {
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  };

  return Response.json(body, { status });
}
