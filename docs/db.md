# DB・Prisma運用手順

このドキュメントでは、StudyQuest のローカルDBと Prisma migration の運用手順をまとめます。

## 前提

- DBは PostgreSQL を使用します。
- Prisma schema の正本は `prisma/schema.prisma` です。
- Prisma migration はリポジトリルートで実行します。
- `.env` に `DATABASE_URL` を設定してから Prisma コマンドを実行します。
- `.env` や `.env.local` は秘密情報を含むため、コミットしません。
- Prisma 7 構成では `prisma.config.ts` が `.env` の `DATABASE_URL` を読み込みます。
- `prisma/schema.prisma` の `datasource db` には接続URLを書きません。

## 初回セットアップ

依存関係をインストールします。

```bash
pnpm install
```

`.env` を作成します。

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS / Linux / Git Bash:

```bash
cp .env.example .env
```

作成した `.env` の `DATABASE_URL` をローカルの PostgreSQL に合わせて変更します。

## Prisma Client生成

Prisma Client は `prisma/schema.prisma` をもとに生成します。

```bash
pnpm prisma:generate
```

次の場合は Prisma Client を生成してください。

- 初回セットアップ後
- `prisma/schema.prisma` を変更した後
- `pnpm install` 後に Prisma Client が見つからない場合

## ローカルDBへのmigration反映

既存の migration をローカルDBへ反映するときは、以下を実行します。

```bash
pnpm prisma migrate dev
```

このコマンドは、開発環境で migration を反映するためのコマンドです。
チームメンバーが既存の migration を取り込んだ後は、このコマンドでローカルDBを更新します。

`prisma/migrations` が存在しない状態では、ローカルDBを migration だけで再現できません。
初回 migration が必要な場合は、DB変更を扱うIssue/PRで migration を作成してください。

## seed実行手順

初回セットアップで migration を反映した後、またはDBリセット後に、開発用データが必要な場合はリポジトリルートで seed を実行します。
実行前に `.env` の `DATABASE_URL` がローカルの PostgreSQL を指していることを確認してください。
共有DB、本番DB、検証DBには実行しないでください。

初回セットアップ後の実行例:

```bash
pnpm install
pnpm prisma:generate
pnpm prisma migrate dev
pnpm db:seed
```

DBリセット後に開発用データだけ入れ直す場合:

```bash
pnpm db:seed
```

seed では以下の開発用データを作成します。

- 開発用ユーザー `dev-user-001`
- 開発用クエスト8件

開発用データは固定IDで upsert するため、複数回実行しても同じデータが重複して作成されません。

## migration作成手順

DB構造を変更するIssueでは、`prisma/schema.prisma` を変更してから migration を作成します。

1. `prisma/schema.prisma` を変更する。
2. Prisma schema を検証する。

```bash
pnpm prisma:validate
```

3. migration を作成し、ローカルDBへ反映する。

```bash
pnpm prisma migrate dev --name add_badge_condition
```

4. Prisma Client を生成する。

```bash
pnpm prisma:generate
```

5. `prisma/schema.prisma` と作成された `prisma/migrations/**` を同じPRに含める。

migration 名には、変更内容が分かる英小文字・数字・アンダースコアの名前を入れます。
上の `add_badge_condition` は例なので、実際の変更内容に合わせて変更してください。

## DBリセット時の注意

ローカルDBを作り直す必要がある場合は、以下を実行します。

```bash
pnpm prisma migrate reset
```

このコマンドは対象DBのデータを削除し、migration を最初から適用し直します。
実行前に必ず以下を確認してください。

- `.env` の `DATABASE_URL` がローカルDBを指している。
- 共有DB、本番DB、検証DBを指していない。
- 消えて困るローカルデータがない。
- リセット後に開発用データが必要な場合は `pnpm db:seed` を実行する。

Prisma が reset を求める表示を出した場合も、すぐに実行せず、`DATABASE_URL` と削除対象のDBを確認してください。

## DB変更PRで確認すること

DB構造を変更したPRでは、少なくとも以下を確認します。

```bash
pnpm prisma:validate
pnpm prisma:generate
```

migration を作成した場合は、ローカルDBへ反映できることも確認します。

```bash
pnpm prisma migrate dev
```

PR本文には、実行した確認コマンドと、migration または seed を含めなかった場合の理由を書きます。
