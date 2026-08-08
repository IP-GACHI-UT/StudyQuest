# API App

StudyQuestのバックエンドAPI

## 担当範囲

- API実装
- DB処理
- Presenter
- ビジネスロジック
- 学習記録・クエスト管理
- Better Authによる認証・session・メール送信

## 実装方針

- HonoでAPIを実装します。
- APIパスは `/api/quests` のように `/api/...` を維持します。
- 今後のAPI追加は `apps/api/src/routes` に行います。
- Prisma Clientは `packages/db/src/prisma.ts` を使用します。
- Better Authは `/api/auth/*` にマウントし、ユーザー別APIでは検証済みsessionのUser IDを使用します。
- レスポンス形式は `docs/api/openapi.yaml` と既存APIレスポンスに合わせます。

## 環境変数

```env
DATABASE_URL=
API_PORT=3001
APP_ORIGIN=http://localhost:3000
BETTER_AUTH_SECRET=
SMTP_HOST=localhost
SMTP_PORT=1025
```

全項目とGoogle OAuth、Resendの設定は `docs/authentication.md` を参照してください。

## APIテスト

1回だけテストを実行:

```bash
pnpm test:api
```

`apps/api`だけを対象に実行:

```bash
pnpm --filter @studyquest/api test
```

watch modeで実行:

```bash
pnpm --filter @studyquest/api test:watch
```

`pnpm test:api`はPostgreSQLへ接続せず、ヘルスチェックの最小テストだけを実行します。DB結合テストは、次の専用コマンドで分けて実行します。

## DB結合テスト

Docker Desktopを起動し、リポジトリルートでテスト専用PostgreSQLを起動します。

```bash
docker compose up -d --wait db-test
pnpm test:api:db
```

`pnpm test:api:db`は、テスト専用DBへmigrationを適用し、Prisma Schemaとの差分がないことを確認してから、
- クエスト取得
- 重複受注防止
- 学習時間のバリデーション
- クエスト達成報酬の二重加算防止
- メール確認前のログイン拒否
- パスワード再設定時のsession失効
- ユーザー間のデータ分離

に関するDB結合テストを実行します。開発用seedは使用しません。

テスト終了後は、テスト専用DBだけを停止します。

```bash
docker compose stop db-test
```

空DBからmigrationを適用できることを確認する場合は、開発用DBの名前付きVolumeを共有しない`db-test`コンテナを、匿名Volumeを含めて削除し、空のDBとして再作成します。

```bash
docker compose stop db-test
docker compose rm -f -v db-test
docker compose up -d --wait db-test
pnpm test:api:db
```

DBテストは、既定で`127.0.0.1:5433`の`studyquest_test`だけを使用します。`TEST_DATABASE_URL`を指定する場合も、ローカルの5433番ポート、DB名とユーザー名が`studyquest_test`、Schemaが`public`でなければ実行を拒否します。既存の`DATABASE_URL`はDBテスト用URLとして使用しません。

開発用DBのデータを削除しないため、DBテストの準備や終了に`docker compose down -v`や`prisma migrate reset`は使用しないでください。

### GitHub Actions

`develop`または`main`を対象とするPull Requestでは、GitHub Actionsの`api-db`ジョブがPostgreSQL 16を起動し、`pnpm test:api:db`を実行します。

migrationまたはDB結合テストに失敗した場合、`api-db`ジョブも失敗します。
