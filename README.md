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
- 認証設計・外部サービス設定: `docs/authentication.md`

## ローカル想定

- フロントエンド: `http://localhost:3000`
- バックエンドAPI: `http://localhost:3001`
- APIパス: `apps/api` 側でも `/api/quests` のように `/api` prefix を維持する

## セットアップ

事前に Docker Desktop などをインストールし、`docker compose` が使える状態にしてください。
DBと開発用メールサーバーMailpitをDocker Composeで起動し、Next.js / Hono APIは従来どおりpnpmで起動します。

```bash
pnpm install
cp .env.example .env
docker compose up -d db mailpit
pnpm prisma:generate
pnpm prisma migrate dev
pnpm db:seed
pnpm dev:api
pnpm dev:web
```

`pnpm dev:api` と `pnpm dev:web` は、それぞれ別のターミナルで実行してください。

Windows PowerShell で `.env` をコピーする場合:

```powershell
Copy-Item .env.example .env
```

`.env.example` の `DATABASE_URL` は、`compose.yml` のローカル開発用PostgreSQLに接続する固定値です。
`.env` や `.env.local` には実際の接続情報や秘密情報が入るため、コミットしないでください。

補足:

- `docker compose up -d db` はPostgreSQLを起動するだけです。
- Mailpitのメール確認画面は `http://localhost:8025` です。
- テーブル作成は `pnpm prisma migrate dev` で行います。
- 開発用データ投入は `pnpm db:seed` で行います。
- アプリ本体はDockerではなく、`pnpm dev:api` / `pnpm dev:web` で起動します。

メール登録、Google OAuth、パスワード再設定に必要な環境変数と外部サービス設定は `docs/authentication.md` を参照してください。
