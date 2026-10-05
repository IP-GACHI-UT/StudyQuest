# StudyQuest

StudyQuestは、学習を小さなクエストとして受注し、継続を促すWebアプリです。

**開発の入口:** [公開・価値検証ロードマップ](docs/roadmap.md) / [HTML進捗表](docs/progress/index.html) / [進捗の更新方法](docs/progress/README.md)。`pnpm progress:serve`で`http://127.0.0.1:4318/`に表示できます。HTML単体でも閲覧できます。

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
- Netlify候補の入口・配置設定・検証: [docs/netlify.md](docs/netlify.md)
- 認証設計・外部サービス設定: `docs/authentication.md`
- 配置候補・費用上限・公開残件: `docs/release.md`
- バックアップ・別DB復元: `docs/backup.md`
- 無料βの公開案内原稿: `docs/beta-notice.md`
- 無料βの計測・集計コマンド: `docs/beta-metrics.md`
- STEP 06の生成・採用契約案（未提供）: [docs/ai-quests.md](docs/ai-quests.md)

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

基本体験は `/signup` → Mailpitでメール確認 → `/quests` → `/my-quest` → `/study/{questId}` → `/dashboard` で確認します。タイマー終了後は端数を1分へ切り上げ、時間とメモを確認して保存します。保存失敗時はその画面を保ったまま「保存を再試行」で同じ内容を送れます。セッション期限切れの場合は「別タブで再ログイン」から同じアカウントへログインして戻ります。画面を離れると未保存のタイマー・入力は失われます。

APIの待受は `API_HOST`（既定 `127.0.0.1`）と `API_PORT`、Webのoriginは `APP_ORIGIN` で指定します。ブラウザーは同じoriginの `/api/*` を使い、Next.jsがHonoへrewriteします。接続先を変える場合は `apps/web/.env.local` に `API_INTERNAL_URL=http://localhost:3001` を設定するか、Web起動・ビルド時の環境変数として渡してください。Next.jsはリポジトリルートの `.env` をWebの設定として読みません。`NEXT_PUBLIC_API_URL` と `CORS_ORIGIN` は使用しません。本人のデータはセッションのUser IDから取得します。

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
