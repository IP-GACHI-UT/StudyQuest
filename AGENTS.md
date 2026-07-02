# AGENTS.md

## このファイルの目的

このファイルは、CodexなどのAIコーディングエージェントに対して、StudyQuestリポジトリで作業するときのルールを伝えるためのものです。

人間の開発者も、作業前にこの内容を確認してください。

## プロジェクト概要

StudyQuestは、学習を小さなクエストとして受注し、学習継続を促進するWebアプリです。

MVPでは、主に以下を扱います。

* クエスト一覧表示
* クエスト受注
* マイクエスト表示
* 学習記録
* 週間学習状況
* 活動ログ
* バッジ

## 技術スタック

* Next.js
* TypeScript
* pnpm
* Prisma ORM
* PostgreSQL
* OpenAPI / Swagger

## ディレクトリ構成

* `apps/web`: Next.jsアプリです。画面とRoute HandlerによるAPIを含みます。
* `apps/web/src/app/api`: Next.js App RouterのRoute Handlerを配置します。
* `apps/web/src/lib`: Prisma Client、認証ヘルパー、APIレスポンス、Presenterなどの共通処理を配置します。
* `docs`: 仕様・設計・開発ルールを配置します。
* `docs/api/openapi.yaml`: API仕様の正本です。
* `prisma/schema.prisma`: Prismaモデル定義の正本です。
* `prisma/migrations`: DB migrationを配置します。migrationはタスクで明示された場合のみ追加・変更してください。
* `.env.example`: 環境変数の見本です。
* `.env` / `.env.local`: ローカルの秘密情報です。絶対にコミットしないでください。

## パッケージ管理

パッケージ管理には pnpm を使用してください。

npm / yarn は使用しないでください。

pnpmのバージョンは `package.json` の `packageManager` に従ってください。

依存関係を追加するときは、pnpmを使用してください。

```bash
pnpm add <package-name>
pnpm add -D <package-name>
```

`pnpm-lock.yaml` は手動編集しないでください。
依存関係を変更した場合は、pnpmにより自動更新された `pnpm-lock.yaml` をコミットしてください。

## 改行コード

このリポジトリでは、改行コードを CRLF に統一してください。

新規作成・編集するファイルは、可能な限り CRLF で保存してください。

LF と CRLF の混在を避けてください。

改行コードだけを理由に、タスクと関係ない既存ファイルを大量に変更しないでください。

PR作成前に、可能な範囲で改行コードの不要な差分が出ていないか確認してください。

## よく使うコマンド

```bash
pnpm install
pnpm dev:web
pnpm biome:check
pnpm lint:web
pnpm typecheck:web
pnpm build:web
pnpm check:web
```

Prisma関連ファイルを変更した場合は、可能な範囲で以下を実行してください。

```bash
pnpm prisma validate
pnpm prisma generate
```

## 環境変数

Prismaを使うには `DATABASE_URL` が必要です。

ローカル開発では、`.env.example` をコピーして `.env` を作成してください。

```bash
cp .env.example .env
```

`.env` には実際のDB接続情報が入るため、絶対にコミットしないでください。

## API実装ルール

APIは Next.js App Router の Route Handler で実装してください。

APIファイルは以下に配置してください。

```text
apps/web/src/app/api/**/route.ts
```

HTTPメソッドごとに、以下のように関数をexportしてください。

```ts
export async function GET() {}
export async function POST() {}
```

APIレスポンスは、`apps/web/src/lib/api-response.ts` の共通関数を使ってください。

Prismaから取得したデータをAPIレスポンスとして返す場合は、原則として `apps/web/src/lib/api-presenters.ts` のPresenterを使ってください。
DBモデルをそのまま返すのではなく、APIとして返してよい項目だけを明示してください。

APIのレスポンス形式を変更した場合は、実装・Presenter・`docs/api/openapi.yaml` の3つが一致しているか確認してください。

## OpenAPIルール

`docs/api/openapi.yaml` はAPI仕様の正本です。

APIを追加・変更した場合は、原則として `docs/api/openapi.yaml` も更新してください。

実装状況は以下のように管理してください。

* `implemented`: 実装済み
* `planned`: 仕様のみで未実装

OpenAPIから生成したHTMLは、タスクで明示されない限り追加しないでください。
API仕様の正本は `openapi.yaml` とします。

## Prismaルール

`prisma/schema.prisma` はPrismaモデル定義の正本です。

Prisma Clientの生成物は手動編集しないでください。

`prisma/schema.prisma` を変更した場合は、migrationが必要か必ず判断してください。

migrationを作成するかどうかは、タスクの指示に従ってください。
migrationを含めない場合は、PR本文に「migrationは次PRで対応」などの理由を明記してください。

migrationを作成する場合は、以下のようなコマンドを使用してください。

```bash
pnpm prisma migrate dev --name <migration-name>
```

本番向けのmigrationコマンドは、タスクで明示されない限り実行しないでください。

## 認証について

現時点では認証の本実装は未完了です。

既存の仮ユーザーID取得処理は、後で本物の認証処理に差し替えやすい形を維持してください。

タスクで明示されない限り、認証方式を勝手に導入しないでください。

## 作業範囲

タスクに関係ないリファクタリングや大規模な構成変更は行わないでください。

必要だと判断した場合は、PR本文に理由を明記してください。

## コミットしてはいけないもの

以下はコミットしないでください。

* `.env`
* `.env.local`
* 実際のDB接続情報
* APIキー
* アクセストークン
* パスワード
* `node_modules`
* ローカルのビルド成果物

## コミットメッセージ

コミットメッセージは、以下の形式を保ってください。

```text
prefix: 内容を日本語で記述
```

例:

```text
docs: DB運用手順を追加
feat: 週間学習状況APIを追加
fix: クエスト受注時のエラー処理を修正
```

`prefix` には、変更内容に合う短い英単語を使用してください。

例: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `ci`, `build`

内容部分は、日本語で分かりやすく記述してください。

## PR作成時のルール

PR本文には、できるだけ以下を書いてください。

* 変更概要
* 変更した主なファイル
* 実行した確認コマンド
* 失敗したコマンドがある場合は、その理由
* 対象外にした作業
* 次のPRで行うべき作業

migrationやseedを含めない場合は、その旨をPR本文に明記してください。

## 作業完了前の確認

可能な範囲で以下を実行してください。

```bash
pnpm biome:check
pnpm lint:web
pnpm typecheck:web
pnpm build:web
```

Prisma関連ファイルを変更した場合は、以下も確認してください。

```bash
pnpm prisma validate
pnpm prisma generate
```

環境変数やDBが未設定でコマンドを実行できない場合は、その理由をPR本文または作業報告に明記してください。