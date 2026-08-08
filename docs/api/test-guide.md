# API確認手順

## 1. このドキュメントの目的

このドキュメントは、StudyQuestで実装済みのAPIを手元で確認するための手順書です。

主な確認方法は、Visual Studio Code拡張のThunder Clientです。補助として、ターミナルから同じAPIを確認できるcurl例も載せます。

新しいAPIが追加されたときは、末尾のテンプレートをコピーして追記してください。

## 2. 前提

- コマンドはリポジトリルートで実行します。
- `.env` が必要です。
- `.env` の `DATABASE_URL` は、ローカルPostgreSQLを向いている必要があります。
- APIは `apps/api` のHonoアプリとして起動します。
- APIのBase URLは `http://localhost:3001` です。
- API確認では、Web側の `http://localhost:3000` ではなく `http://localhost:3001` を使います。

## 3. API確認前の準備

初回、または依存関係やDBを作り直したときは、次の順に準備します。

```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma migrate dev
pnpm db:seed
pnpm dev:api
```

Windows PowerShellで `.env` を作る場合は、次のコマンドも使えます。

```powershell
Copy-Item .env.example .env
```

`pnpm dev:api` を実行すると、APIサーバーが `http://localhost:3001` で起動します。このターミナルは起動したままにして、別の画面からThunder Clientやcurlで確認します。

## 4. Thunder Client共通設定

Thunder Clientでは、次の設定で確認します。

- Base URL: `http://localhost:3001`
- Header: `Content-Type: application/json`
- Bodyが必要なAPIでは、Bodyの種類をJSONにします。
- 認証はまだ本実装ではありません。開発用ユーザー `dev-user-001` が使われる前提です。

Thunder ClientのURL欄には、Base URLを含めた完全なURLを入力しても問題ありません。例: `http://localhost:3001/api/quests`

Windows PowerShellで `curl` が別のコマンドとして動く場合は、例の `curl` を `curl.exe` に置き換えてください。

## 5. 起動確認API

これはAPIサーバーが起動しているか確認するためのAPIです。Issue #14で確認する「実装済みAPI4つ」には含めません。

- Method: `GET`
- URL: `http://localhost:3001/api/health`

期待レスポンス:

```json
{
  "status": "ok"
}
```

curl例:

```bash
curl http://localhost:3001/api/health
```

## 6. 実装済みAPI5つの確認手順

### A. クエスト一覧取得

- Method: `GET`
- URL: `http://localhost:3001/api/quests`
- 目的: 受注できるクエスト一覧を取得します。

Thunder Clientでの確認手順:

1. Methodを `GET` にします。
2. URLに `http://localhost:3001/api/quests` を入力します。
3. `Send` を押します。

正常系の期待内容:

- ステータスコード `200` が返ります。
- `quests` 配列が返ります。
- `pnpm db:seed` で登録されたクエストが表示されます。
- 例として `dev-quest-html-001` などの固定IDのクエストが含まれます。

エラー系:

- DBに接続できない場合などは、ステータスコード `500` が返ります。

curl例:

```bash
curl http://localhost:3001/api/quests
```

### B. クエスト受注

- Method: `POST`
- URL例: `http://localhost:3001/api/quests/dev-quest-html-001/accept`
- 目的: 指定したクエストを開発用ユーザーのマイクエストに追加します。

Thunder Clientでの確認手順:

1. Methodを `POST` にします。
2. URLに `http://localhost:3001/api/quests/dev-quest-html-001/accept` を入力します。
3. Headerに `Content-Type: application/json` を指定します。
4. Bodyは不要です。
5. `Send` を押します。

正常系の期待内容:

- ステータスコード `201` が返ります。
- `userQuest` が返ります。
- `userQuest.quest` に受注したクエスト情報が含まれます。

エラー系:

- 存在しない `questId` を指定すると、ステータスコード `404` が返ります。
- 同じクエストを2回受注すると、ステータスコード `409` が返ります。

curl例:

```bash
curl -X POST http://localhost:3001/api/quests/dev-quest-html-001/accept \
  -H "Content-Type: application/json"
```

存在しない `questId` の確認例:

```bash
curl -X POST http://localhost:3001/api/quests/not-found-quest/accept \
  -H "Content-Type: application/json"
```

2回受注の確認は、正常系のcurl例を同じDB状態で2回実行します。1回目は `201`、2回目は `409` が返ります。

### C. マイクエスト取得

- Method: `GET`
- URL: `http://localhost:3001/api/my-quests`
- 目的: 開発用ユーザーが受注しているクエスト一覧を取得します。

Thunder Clientでの確認手順:

1. 先に「B. クエスト受注」でクエストを受注します。
2. Methodを `GET` にします。
3. URLに `http://localhost:3001/api/my-quests` を入力します。
4. `Send` を押します。

正常系の期待内容:

- ステータスコード `200` が返ります。
- `userQuests` 配列が返ります。
- 受注済みクエストが表示されます。
- 各要素の `quest` にクエスト情報が含まれます。

エラー系:

- DBに接続できない場合などは、ステータスコード `500` が返ります。

curl例:

```bash
curl http://localhost:3001/api/my-quests
```

### D. 学習記録作成

- Method: `POST`
- URL: `http://localhost:3001/api/study-logs`
- 目的: 受注済みクエストに学習時間とメモを記録します。

Body例:

```json
{
  "questId": "dev-quest-html-001",
  "minutes": 10,
  "note": "HTMLの基本タグを復習した",
  "studiedAt": "2026-07-10T10:00:00.000Z"
}
```

Thunder Clientでの確認手順:

1. 先に「B. クエスト受注」で `dev-quest-html-001` を受注します。
2. Methodを `POST` にします。
3. URLに `http://localhost:3001/api/study-logs` を入力します。
4. Headerに `Content-Type: application/json` を指定します。
5. Bodyの種類をJSONにして、Body例のJSONを入力します。
6. `Send` を押します。

正常系の期待内容:

- ステータスコード `201` が返ります。
- `studyLog` が返ります。
- `studyLog.questId` が送信した `questId` と一致します。
- `studyLog.minutes` が送信した `minutes` と一致します。

エラー系:

- 未受注の `questId` を指定すると、ステータスコード `400` が返ります。
- `minutes` に0以下を指定すると、ステータスコード `400` が返ります。
- JSONとして不正なBodyを送ると、ステータスコード `400` が返ります。

curl例:

```bash
curl -X POST http://localhost:3001/api/study-logs \
  -H "Content-Type: application/json" \
  -d '{
    "questId": "dev-quest-html-001",
    "minutes": 10,
    "note": "HTMLの基本タグを復習した",
    "studiedAt": "2026-07-10T10:00:00.000Z"
  }'
```

未受注の `questId` の確認例:

```bash
curl -X POST http://localhost:3001/api/study-logs \
  -H "Content-Type: application/json" \
  -d '{
    "questId": "dev-quest-css-001",
    "minutes": 10,
    "note": "未受注クエストの確認",
    "studiedAt": "2026-07-10T10:00:00.000Z"
  }'
```

`minutes` が0以下の確認例:

```bash
curl -X POST http://localhost:3001/api/study-logs \
  -H "Content-Type: application/json" \
  -d '{
    "questId": "dev-quest-html-001",
    "minutes": 0,
    "note": "minutesのエラー確認",
    "studiedAt": "2026-07-10T10:00:00.000Z"
  }'
```

JSONとして不正なBodyの確認例:

```bash
curl -X POST http://localhost:3001/api/study-logs \
  -H "Content-Type: application/json" \
  -d '{ "questId": "dev-quest-html-001", "minutes": 10'
```

### E. 掲示板用クエスト一覧取得

- Method: `GET`
- URL: `http://localhost:3001/api/board/quests`
- 目的: 掲示板に表示するクエストごとの全体集計と、開発用ユーザーの受注状態を取得します。

Thunder Clientでの確認手順:

1. Methodを `GET` にします。
2. URLに `http://localhost:3001/api/board/quests` を入力します。
3. `Send` を押します。

正常系の期待内容:

- ステータスコード `200` が返ります。
- `quests` 配列が返ります。
- 各要素の `quest` にクエスト情報が含まれます。
- `statistics` に `acceptedToday`、`completedToday`、`completionRate` が含まれます。
- `currentUser.isAccepted` は、開発用ユーザーが受注済みの場合だけ `true` になります。
- 他ユーザーの受注数を表す `acceptedToday` が1以上でも、開発用ユーザーが未受注なら `currentUser.isAccepted` は `false` です。

主要項目だけを抜粋したレスポンス例:

```json
{
  "quests": [
    {
      "quest": {
        "id": "dev-quest-html-001",
        "title": "HTMLの基本を学ぶ"
      },
      "statistics": {
        "acceptedToday": 1,
        "completedToday": 0,
        "completionRate": 50
      },
      "currentUser": {
        "isAccepted": true
      }
    }
  ]
}
```

curl例:

```bash
curl http://localhost:3001/api/board/quests
```

## 7. よくある失敗

- APIサーバーが起動していない場合、接続エラーになります。`pnpm dev:api` を実行してください。
- `localhost:3000` に送っている場合、Web側に送信しています。API確認では `http://localhost:3001` を使います。
- DBが起動していない場合、APIがDBに接続できません。ローカルPostgreSQLを起動してください。
- `.env` の `DATABASE_URL` が間違っている場合、APIやPrismaコマンドがDBに接続できません。
- seedを実行していない場合、`dev-quest-html-001` などの固定IDのクエストが存在しません。`pnpm db:seed` を実行してください。
- 同じクエストをすでに受注済みの場合、クエスト受注APIは `409` を返します。別のクエストIDで試すか、ローカルDBの状態をリセットしてください。

## 8. 新規API追加時の追記テンプレート

```md
## API名

- Method:
- URL:
- 目的:
- 前提:
- Thunder Clientでの確認手順:
- 正常系:
- エラー系:
- curl例:
- 備考:
```
