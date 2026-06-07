# Web App

StudyQuestのフロントエンドアプリです。

## 使用技術

* Next.js
* TypeScript
* Tailwind CSS
* pnpm workspace
* ESLint
* Biome

## 起動方法

リポジトリルートで以下を実行します。

```bash
pnpm dev:web
```

## コマンドの使い分け

| 目的           | コマンド                 |
| ------------ | -------------------- |
| 開発サーバーを起動する  | `pnpm dev:web`       |
| PR前にまとめて確認する | `pnpm check:web`     |
| 自動修正する       | `pnpm biome:write`   |
| Biomeの確認だけする | `pnpm biome:check`   |
| 型エラーだけ確認する   | `pnpm typecheck:web` |
| 本番ビルドを確認する   | `pnpm build:web`     |
| ESLintだけ確認する | `pnpm lint:web`      |

## 各コマンド

すべてリポジトリルートで実行します。

```bash
pnpm dev:web
```

フロントエンドの開発サーバーを起動します。
画面を確認しながら開発するときに使用します。

```bash
pnpm lint:web
```

ESLintでコードをチェックします。
Next.js / React / TypeScriptの書き方に問題がないか確認します。

```bash
pnpm typecheck:web
```

TypeScriptの型エラーを確認します。

```bash
pnpm build:web
```

本番ビルドが成功するか確認します。
PRを出す前に確認しておくと安全です。

```bash
pnpm biome:check
```

Biomeでコード整形・基本的なlint・import整理の確認をします。
自動修正は行いません。

```bash
pnpm biome:write
```

Biomeで自動修正できる箇所を修正します。
フォーマット崩れやimport順を直したいときに使用します。

```bash
pnpm format
```

Biomeでコード整形のみを実行します。

```bash
pnpm format:check
```

コード整形が必要な箇所がないか確認します。
自動修正は行いません。

```bash
pnpm check:web
```

フロントエンドの確認をまとめて実行します。
PRを出す前は基本的にこのコマンドを実行してください。

## VSCode利用者向け

このリポジトリでは、Biome拡張機能の利用を推奨しています。
VSCodeでリポジトリを開くと、推奨拡張機能として表示されます。

Biome拡張機能を入れると、保存時に自動でコード整形されます。

## 担当範囲

* 画面実装
* UIコンポーネント作成
* API連携
* レスポンシブ対応
