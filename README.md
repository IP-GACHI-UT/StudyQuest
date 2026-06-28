# StudyQuest

StudyQuestは、学習を小さなクエストとして受注し、継続を促すWebアプリです。

## ディレクトリ構成

- `apps/web`: フロントエンド
- `apps/api`: バックエンドAPI
- `docs`: 仕様・設計・開発ルール

## 開発ルール

詳しくは `CONTRIBUTING.md` を参照してください。

## 仕様書

- MVP仕様: `docs/mvp.md`
- 画面仕様: 別資料を参照
- API仕様: 今後作成予定
- DB設計: 今後作成予定

## セットアップ

```bash
pnpm install
cp .env.example .env
pnpm dev:game
```

`.env` を作成したら、`DATABASE_URL` をローカルのPostgreSQL接続先に合わせて変更してください。
`.env` や `.env.local` には実際の接続情報や秘密情報が入るため、コミットしないでください。

`.env.example` の `DATABASE_URL` は、PrismaがPostgreSQLへ接続するためのURLです。
`USER` はDBユーザー名、`PASSWORD` はDBパスワード、`localhost:5432` はDBホストとポート、`studyquest` は接続先データベース名を表します。
