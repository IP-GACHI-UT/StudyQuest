# API設計書

このドキュメントは、StudyQuest MVPでフロントエンドとバックエンドが合意するAPI仕様をまとめるものです。

詳細なリクエスト・レスポンスは実装時に追記します。まずは、画面実装に必要なAPIの全体像を確認することを目的とします。

## 1. 共通方針

- 認証が必要なAPIでは、フロントから `user_id` を送らない。
- ログイン中ユーザーは、サーバー側で認証情報から取得する。
- レスポンスはJSONで返す。
- エラー時もフロントが扱いやすい形式のJSONを返す。

## 2. 共通エラーレスポンス

```json
{
  "error": {
    "code": "QUEST_ALREADY_IN_PROGRESS",
    "message": "このクエストはすでに受注中です。"
  }
}
```

## 3. 認証API

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| POST | `/api/auth/register` | メール + パスワードでユーザー登録 | 不要 |
| POST | `/api/auth/login` | メール + パスワードでログイン | 不要 |
| POST | `/api/auth/google` | Googleログイン | 不要 |
| POST | `/api/auth/logout` | ログアウト | 必要 |
| GET | `/api/me` | ログイン中ユーザー情報を取得 | 必要 |

## 4. 目標API

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| GET | `/api/me/goals/current` | 現在の目標を取得 | 必要 |
| POST | `/api/me/goals` | 目標を作成 | 必要 |
| PATCH | `/api/me/goals/{goalId}` | 目標を更新 | 必要 |

## 5. クエストAPI

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| GET | `/api/quests` | クエスト一覧を取得 | 必要 |
| GET | `/api/quests/{questId}` | クエスト詳細を取得 | 必要 |
| POST | `/api/quests/{questId}/accept` | クエストを受注 | 必要 |

### クエスト一覧のクエリ例

```text
GET /api/quests?category=programming&difficulty=easy
```

## 6. マイクエストAPI

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| GET | `/api/me/quests` | 自分の受注クエスト一覧を取得 | 必要 |
| GET | `/api/me/quests/{userQuestId}` | 自分の受注クエスト詳細を取得 | 必要 |
| PATCH | `/api/me/quests/{userQuestId}/complete` | クエストを達成にする | 必要 |
| PATCH | `/api/me/quests/{userQuestId}/cancel` | クエストをキャンセルする | 必要 |

## 7. 学習記録API

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| POST | `/api/study-logs` | 学習記録を作成 | 必要 |
| GET | `/api/me/study-logs` | 自分の学習記録を取得 | 必要 |
| GET | `/api/me/study-summary` | 週間学習状況を取得 | 必要 |

### 学習記録作成リクエスト例

```json
{
  "userQuestId": "uuid-or-null",
  "studyDate": "2026-06-14",
  "studiedMinutes": 30,
  "inputType": "manual",
  "startedAt": null,
  "endedAt": null,
  "memo": "Javaの配列を勉強した"
}
```

## 8. 掲示板API

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| GET | `/api/board` | 公開されている活動ログを取得 | 必要 |
| GET | `/api/me/event-settings` | 自分のイベント公開設定を取得 | 必要 |
| PATCH | `/api/me/event-settings` | 自分のイベント公開設定を更新 | 必要 |

## 9. プロフィールAPI

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| GET | `/api/me/profile` | 自分のプロフィールを取得 | 必要 |
| GET | `/api/users/{userId}/profile` | 他ユーザーの公開プロフィールを取得 | 必要 |
| GET | `/api/me/badges` | 自分の獲得バッジを取得 | 必要 |

## 10. ホーム画面API

| メソッド | パス | 説明 | 認証 |
|---|---|---|---|
| GET | `/api/me/dashboard` | ホーム画面に必要な情報をまとめて取得 | 必要 |

### dashboardで返す主な情報

- 現在の目標
- ユーザーのレベル・経験値・ポイント
- 進行中のマイクエスト
- 今週の学習時間
- 最近の活動ログ
- 獲得済みバッジの一部

## 11. 優先して実装するAPI

最初から全部作らず、以下の順番で実装する。

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `GET /api/me`
4. `GET /api/quests`
5. `POST /api/quests/{questId}/accept`
6. `GET /api/me/quests`
7. `POST /api/study-logs`
8. `PATCH /api/me/quests/{userQuestId}/complete`
9. `GET /api/me/dashboard`
10. `GET /api/board`
