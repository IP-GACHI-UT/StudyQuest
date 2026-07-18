# API App

StudyQuestのバックエンドAPI

## 担当範囲

- API実装
- DB処理
- Presenter
- ビジネスロジック
- 学習記録・クエスト管理

## 実装方針

- HonoでAPIを実装します。
- APIパスは `/api/quests` のように `/api/...` を維持します。
- 今後のAPI追加は `apps/api/src/routes` に行います。
- Prisma Clientは `packages/db/src/prisma.ts` を使用します。
- 認証方式は、明示指示があるまで導入しません。
- 既存の仮ユーザーID取得処理を使う場合は、`apps/api` 側に置きます。
- レスポンス形式は `docs/api/openapi.yaml` と既存APIレスポンスに合わせます。

## 環境変数

```env
DATABASE_URL=
API_PORT=3001
CORS_ORIGIN=http://localhost:3000
```

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

Phase 2のテストはPostgreSQLへ接続しません。現時点ではヘルスチェックの最小テストだけを実行し、DB結合テストは後続Phaseで追加します。
