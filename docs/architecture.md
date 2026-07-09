# StudyQuest アーキテクチャ方針

## アプリ構成

- `apps/web`: フロントエンドアプリ。Next.jsで画面を実装します。
- `apps/api`: バックエンドAPIアプリ。HonoでAPIを実装します。
- `packages/db`: Prisma Client共有パッケージを置きます。
- `docs/api/openapi.yaml`: API仕様の正本です。

## API配置方針

- API実装は `apps/api` に統一します。
- `apps/web/src/app/api` に新規API処理を追加しません。
- APIパスは `apps/api` 側でも `/api/quests` のように `/api` prefix を維持します。
- DB処理、Presenter、ビジネスロジックは `apps/api` 側に置きます。
- Prisma Clientは `packages/db/src/prisma.ts` から使用します。

## 移行時の制約

- 認証方式は今回導入しません。
- 既存の仮ユーザーID取得処理がある場合は `apps/api` に移します。
- レスポンス形式は変えません。
- DB schema変更とmigrationは行いません。
- フロント画面は修正しません。
- OpenAPIのpathやレスポンス形式は、実装場所の移行だけでは変更しません。

## ローカル想定

- `apps/web`: `http://localhost:3000`
- `apps/api`: `http://localhost:3001`
