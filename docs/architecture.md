# StudyQuest アーキテクチャ方針

## アプリ構成

- `apps/web`: フロントエンドアプリ。Next.jsで画面を実装します。
- `apps/api`: バックエンドAPIアプリ。HonoでAPIを実装します。
- `packages/db`: Prisma Client共有パッケージを置きます。
- `docs/api/openapi.yaml`: API仕様の正本です。

## API配置方針

- API実装は `apps/api` に統一します。
- `apps/web/src/app/api` に新規API処理を追加しません。
- APIパスは `apps/api` 側でも `/api/quests` のように `/api` prefix を維持します。
- DB処理、Presenter、ビジネスロジックは `apps/api` 側に置きます。
- Prisma Clientは `packages/db/src/prisma.ts` から使用します。

## API移行時の制約（初期基準版）

- 認証方式は今回導入しません。
- 既存の仮ユーザーID取得処理がある場合は `apps/api` に移します。
- レスポンス形式は変えません。
- DB schema変更とmigrationは行いません。
- フロント画面は修正しません。
- OpenAPIのpathやレスポンス形式は、実装場所の移行だけでは変更しません。

## ローカル想定

STEP 04のNetlify候補は[netlify.md](netlify.md)を正とする。apps/apiのNode Functions入口が既存HonoへRequest/Responseを渡し、context.ipを認証へ渡す。Webは配置モードでrewriteを外し、サーバー認証はAPP_ORIGINへ接続する。外部配置は未確認。

- `apps/web`: `http://localhost:3000`
- `apps/api`: `http://localhost:3001`

APIは `API_HOST` の既定値 `127.0.0.1` でローカルだけを待ち受ける。STEP 03ではブラウザーの `/api/*` をNext.jsからHonoへrewriteし、サーバー側の接続先は `API_INTERNAL_URL`、許可originは `APP_ORIGIN` とする。配置時の待受・HTTPS・秘密値はSTEP 04で別途確認する。

STEP 03は上記のAPI移行とは別の認証タスクとして、既存認証PRのDB migration・画面・Better Authを統合する。`/dashboard`、`/board`、`/my-quest`、`/study/{questId}` は保護レイアウトでセッションを照合し、すべてのユーザー別APIもHonoの `requireAuth` で照合する。固定ユーザーIDやクライアント指定のIDは本人判定に使わない。認証の正本は [authentication.md](authentication.md)。

STEP 02の学習記録は、任意のUUID v4 `requestId` を `study-` 付きの既存主キーに保存する。同じキー・内容の再送は確定した記録を返す。クエストごとに `user_quests` 行をトランザクション内でロックして、同時保存による達成閾値の見落としを防ぐ。DB構造は追加しない。週間集計は日本時間の月曜00:00から翌月曜00:00未満。

STEP 05のβ集計は[beta-metrics.md](beta-metrics.md)を正とする。既存users/user_quests/study_logsのサーバー時刻から、指定した協力者だけを読み取り専用で集計する。学習本文・メール・個別IDを出力せず、新規API/DBテーブルや外部計測サービスは追加しない。掲示板の今日集計も日本時間00:00以上、翌日00:00未満に揃える。

STEP 06の[契約案](ai-quests.md)は未実装。生成・採用のplanned契約はOpenAPI、DBモデルの追加案は同文書に記録する。個人用Questを共通一覧・掲示板へ混ぜず、Honoのsessionと所有者を照合する。採用後の進行・学習・活動の既存責務を維持する。今回のschema・実行中API・画面は変更しない。
