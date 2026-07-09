# StudyQuest

StudyQuestは、学習を小さなクエストとして受注し、継続を促すWebアプリです。

## ディレクトリ構成

- `apps/web`: フロントエンドアプリ。Next.jsで画面を実装する
- `apps/api`: バックエンドAPIアプリ。HonoでAPIを実装する
- `packages/db`: Prisma Client共有パッケージ
- `docs`: 仕様・設計・開発ルール
- `docs/api/openapi.yaml`: API仕様の正本
- `prisma`: Prisma schemaとDB migrationを管理する

## 開発ルール

詳しくは `CONTRIBUTING.md` を参照してください。

## 仕様書

- MVP仕様: `docs/mvp.md`
- 画面仕様: 別資料を参照
- API仕様: `docs/api/openapi.yaml`
- API仕様の見方: `docs/api/README.md`
- DBモデル定義: `prisma/schema.prisma`
- DB・Prisma運用手順: `docs/db.md`
- アーキテクチャ方針: `docs/architecture.md`

## ローカル想定

- フロントエンド: `http://localhost:3000`
- バックエンドAPI: `http://localhost:3001`
- APIパス: `apps/api` 側でも `/api/quests` のように `/api` prefix を維持する

## セットアップ

```bash
pnpm install
cp .env.example .env
pnpm dev:web
```

`.env` を作成したら、`DATABASE_URL` をローカルのPostgreSQL接続先に合わせて変更してください。
`.env` や `.env.local` には実際の接続情報や秘密情報が入るため、コミットしないでください。

`.env.example` の `DATABASE_URL` は、PrismaがPostgreSQLへ接続するためのURLです。
`USER` はDBユーザー名、`PASSWORD` はDBパスワード、`localhost:5432` はDBホストとポート、`studyquest` は接続先データベース名を表します。
