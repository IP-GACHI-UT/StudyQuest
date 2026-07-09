# AGENTS.md

## 目的

このファイルは、AIコーディングエージェントがStudyQuestリポジトリで安全に作業するための共通ルールです。
READMEは人間向け、AGENTS.mdはエージェント向けの作業指示として扱ってください。
他のエージェント設定ファイルと矛盾する場合は、原則としてAGENTS.mdを優先してください。

## プロジェクト概要

StudyQuestは、学習を小さなクエストとして受注し、学習継続を促進するWebアプリです。
MVPで扱う主な機能は、クエスト一覧、クエスト受注、マイクエスト、学習記録、週間学習状況、活動ログ、バッジです。
MVP外の機能や大きな仕様変更は、指示がない限り追加しないでください。

## 技術スタック

- Next.js App Router
- Hono
- TypeScript
- pnpm
- Prisma ORM
- PostgreSQL
- OpenAPI / Swagger

パッケージ管理は必ずpnpmを使用してください。npm / yarn は使用しないでください。

## 主要ディレクトリ

| パス | 役割 |
| --- | --- |
| `apps/web` | フロントエンドアプリ。画面を実装する |
| `apps/api` | バックエンドAPIアプリ。HonoでAPIを実装する |
| `apps/api/src/routes` | APIルートを配置する |
| `packages/db/src/prisma.ts` | Prisma Client共有処理 |
| `docs` | 仕様・設計・開発ルール |
| `docs/api/openapi.yaml` | API仕様の正本 |
| `prisma/schema.prisma` | Prismaモデル定義の正本 |
| `prisma/migrations` | DB migration。必要な場合のみPRに含める |
| `prisma/seed.js` | 開発用seed |
| `.env.example` | 環境変数の見本 |

`.env` / `.env.local` / `apps/web/.env.local` は絶対にコミットしないでください。

## 作業開始時の必須ルール

- 原則としてリポジトリルートで作業してください。
- 変更前に `git status --short` を確認してください。
- 既存の変更・未追跡ファイルは、ユーザーまたは他メンバーの作業かもしれません。タスクに関係ないファイルを勝手に編集・削除・stageしないでください。
- タスクに関係ないリファクタリング、大規模な構成変更、依存関係追加は避けてください。
- 必要性がある場合は、PR本文または作業報告に理由を明記してください。

## StudyQuestの設計方針

- 集計値は原則として `study_logs` から算出してください。
- ユーザーごとのクエスト進行状況は `user_quests` で管理してください。
- 掲示板表示に使う活動は `activity_logs` で管理してください。
- APIレスポンスにPrismaモデルをそのまま返さず、返してよい項目をPresenterで明示してください。
- フロントエンドから渡されたユーザーIDだけを信用して、他人のデータを操作できる実装にしないでください。
- 認証の本実装は未完了です。タスクで明示されない限り、認証方式を勝手に導入しないでください。
- 既存の仮ユーザーID取得処理は、後から本物の認証処理に差し替えやすい形を保ってください。

## API実装ルール

- APIは `apps/api` にHonoで実装してください。
- 新規API処理を `apps/web/src/app/api` に追加しないでください。
- APIパスは `apps/api` 側でも `/api/quests` のように `/api` prefix を維持してください。
- DB処理、Presenter、ビジネスロジックは `apps/api` 側に置いてください。
- Prisma Clientは `packages/db/src/prisma.ts` から使用してください。
- 既存の仮ユーザーID取得処理を使う場合は `apps/api` 側に置いてください。
- 認証方式は、タスクで明示されない限り導入しないでください。
- フロント画面の修正は、API移行作業に含めないでください。
- APIレスポンス形式は、タスクで明示されない限り変更しないでください。
- APIの仕様やレスポンス形式を変更した場合は、実装、Presenter、`docs/api/openapi.yaml` の整合性を確認してください。

## OpenAPIルール

- `docs/api/openapi.yaml` はAPI仕様の正本です。
- APIを追加・変更した場合は、原則として `docs/api/openapi.yaml` も更新してください。
- 実装状況は `implemented` / `planned` で管理してください。
- OpenAPIから生成したHTMLは、タスクで明示されない限り追加しないでください。

## Prisma / DBルール

- `prisma/schema.prisma` はPrismaモデル定義の正本です。
- Prisma Clientの生成物は手動編集しないでください。
- アプリコードから使うPrisma Client共有処理は `packages/db/src/prisma.ts` に置いてください。
- `prisma/schema.prisma` を変更した場合は、migrationが必要か必ず判断してください。
- DB schema変更とmigrationは、明示指示がない限り行わないでください。
- DB構造変更を行うIssueではない場合、`prisma/migrations/` をPRに含めないでください。
- migrationを含めない場合は、PR本文または作業報告に理由を明記してください。
- 本番向けのmigrationコマンドは、タスクで明示されない限り実行しないでください。

migrationを作成する場合:

```bash
pnpm prisma migrate dev --name <migration-name>
```

## seedルール

- seedは開発用データ投入のためのものです。
- seedは複数回実行しても重複しないようにしてください。
- 固定IDによる `upsert` など、再実行に強い実装を優先してください。
- seed確認で投入したDBデータ、DB dump、ローカルDBファイルはコミットしないでください。

seedを変更した場合は、ローカルDBを起動したうえで以下を2回実行してください。

```bash
pnpm db:seed
pnpm db:seed
```

## よく使うコマンド

```bash
pnpm install
pnpm dev:web
pnpm format:check
pnpm biome:check
pnpm lint:web
pnpm typecheck:web
pnpm build:web
pnpm check:web
```

Prisma関連ファイルを変更した場合:

```bash
pnpm prisma:validate
pnpm prisma:generate
```

`pnpm check:web` に `format:check` が含まれていない場合は、別途 `pnpm format:check` も実行してください。

## 非TTY環境でpnpmが失敗する場合

Codexなどの非TTY環境では、pnpmが以下のようなエラーで止まることがあります。

```text
ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY
```

この場合は、同じコマンドを `CI=true` 付きで再実行してください。例: `$env:CI="true"; pnpm typecheck:web`。
`CI=true` で実行した場合は、最終報告やPR本文にその旨を明記してください。
pnpm経由でどうしても実行できない場合のみ、ローカルCLIの直接実行を代替として使ってください。その場合も、通常のpnpmコマンドが成功したとは書かないでください。

## 作業完了前の確認

作業完了前に、まず以下を確認してください。

```bash
git status --short
```

通常の実装・修正では、可能な限り以下を実行してください。

```bash
pnpm format:check
pnpm biome:check
pnpm lint:web
pnpm typecheck:web
pnpm build:web
```

または、Web全体の確認として以下を実行してください。

```bash
pnpm check:web
```

ただし、部分的な確認だけで完了扱いにしないでください。

悪い例:

- `node --check prisma/seed.js` だけで完了扱いにする
- 変更した1ファイルだけにlintをかけて完了扱いにする
- `pnpm prisma:validate` だけで、Webのlint/typecheck/buildを確認しない
- 手動API確認だけで、format/lint/typecheck/buildを確認しない

追加確認:

| 変更内容 | 追加で実行するコマンド |
| --- | --- |
| Prisma関連ファイル変更 | `pnpm prisma:validate` / `pnpm prisma:generate` |
| DB構造変更 | `pnpm prisma migrate dev` |
| seed変更 | `pnpm db:seed` を2回 |

必要に応じて関連APIでも確認してください。例: `(Invoke-RestMethod http://localhost:3000/api/quests).quests.Count`。
環境変数やDBが未設定で実行できないコマンドがある場合は、理由と代替確認を明記してください。
実行できなかったコマンドがある場合、CI相当の確認が完了したとは表現しないでください。

## ステージングルール

ファイルをstageする前に、必ず以下を実行してください。

```bash
git status --short
```

stageするファイルを明示してから `git add <file>` してください。
`git add .` は、ローカル生成物や秘密情報を巻き込む可能性があるため、原則として使用しないでください。

stage後も以下で対象を確認してください。

```bash
git status --short
git diff --cached --stat
```

PRに含めるべきでないファイルがstageされていた場合は、必ずunstageしてください。

```bash
git restore --staged <file-or-directory>
```

## コミットしてはいけないもの

- `.env`
- `.env.local`
- `apps/web/.env.local`
- 実際のDB接続情報
- APIキー
- アクセストークン
- パスワード
- `node_modules`
- `.pnpm-store/`
- ローカルのビルド成果物
- ローカルDBファイル
- ローカルdumpファイル

`prisma/migrations/` は、DB構造変更Issueで明示的に必要な場合のみコミットしてください。

## 改行コード

このリポジトリでは、改行コードをCRLFに統一してください。
新規作成・編集するファイルは、可能な限りCRLFで保存してください。
改行コードだけを理由に、タスクと関係ない既存ファイルを大量に変更しないでください。

## コミットメッセージ

コミットメッセージは以下の形式にしてください。

```text
prefix: 内容を日本語で記述
```

例: `docs: DB運用手順を追加` / `feat: 週間学習状況APIを追加` / `fix: クエスト受注時のエラー処理を修正`。
`prefix` には、`feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `ci`, `build` などを使用してください。

## PR作成時の報告テンプレート

```text
## 変更概要
-

## 変更した主なファイル
-

## 確認コマンド
- [ ] pnpm format:check
- [ ] pnpm biome:check
- [ ] pnpm lint:web
- [ ] pnpm typecheck:web
- [ ] pnpm build:web

## 実行できなかった確認
- なし / 理由を記載

## 補足
- migrationを含めたか、含めない場合は理由
- seedを変更したか、変更した場合は2回実行できたか
- `.env*`、`.pnpm-store/`、不要な `prisma/migrations/` が含まれていないか
- `git status --short` の結果
```

## AGENTS.mdの運用ルール

- AGENTS.mdは長くしすぎないでください。目安として300行を大きく超える場合は、詳細ルールを `docs/` やサブディレクトリの `AGENTS.md` に分割してください。
- API、DB、テストなどの詳細仕様は、AGENTS.mdに全文を詰め込まず、正本ドキュメントへの参照にしてください。
- 依存関係、ディレクトリ構成、確認コマンドを変えた場合は、AGENTS.mdの更新が必要か確認してください。
- ツール固有の特殊構文は、共通のAGENTS.mdには書かないでください。必要な場合は、そのツール専用ファイルに分離してください。
