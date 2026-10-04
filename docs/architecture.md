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

## 移行時の制約

- 認証方式は今回導入しません。
- 既存の仮ユーザーID取得処理がある場合は `apps/api` に移します。
- レスポンス形式は変えません。
- DB schema変更とmigrationは行いません。
- フロント画面は修正しません。
- OpenAPIのpathやレスポンス形式は、実装場所の移行だけでは変更しません。

## ローカル想定

- `apps/web`: `http://localhost:3000`
- `apps/api`: `http://localhost:3001`

APIは `API_HOST` の既定値 `127.0.0.1` でローカルだけを待ち受ける。Webの接続先は `NEXT_PUBLIC_API_URL`、APIの許可originは `CORS_ORIGIN` とする。配置時の待受・HTTPS・秘密値はSTEP 04で別途確認する。

STEP 02の学習記録は、任意のUUID v4 `requestId` を `study-` 付きの既存主キーに保存する。同じキー・内容の再送は確定した記録を返す。クエストごとに `user_quests` 行をトランザクション内でロックして、同時保存による達成閾値の見落としを防ぐ。DB構造は追加しない。週間集計は日本時間の月曜00:00から翌月曜00:00未満。
