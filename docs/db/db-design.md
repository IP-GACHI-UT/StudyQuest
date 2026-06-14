# DB設計書

## 1. 目的

このドキュメントは、StudyQuest MVP 時点のDB設計をまとめるものです。

MVPでは、ユーザーがクエストを受注し、学習記録を残し、目標・達成状況・週間学習状況・掲示板・バッジ・経験値・レベルに反映できることを目的とします。

## 2. 設計方針

- ユーザーIDはフロントから送られた値を信用せず、認証情報からサーバー側で取得する。
- クエスト受注履歴は `user_quests` に1受注1レコードで保存する。
- 学習記録は `study_logs` に1記録1レコードで保存する。
- 週間学習時間、今日の受注数、今日の達成数などは原則として元データから集計する。
- クエストやバッジは原則として物理削除せず、`is_active` で非表示にする。
- 掲示板に表示するイベントは `activity_logs` に保存する。
- イベントを掲示板に公開するかどうかは、ユーザーごとの設定で制御する。
- MVPでは経験値・レベル・ポイントを実装する。

## 3. 仕様決定事項

| 項目 | 方針 |
|---|---|
| ログイン方式 | メール + パスワード、Googleログイン |
| クエストの再受注 | 達成後も再受注可 |
| 学習記録 | タイマー入力、手動入力の両方に対応 |
| 学習記録とクエスト | クエストに紐づかない学習記録も許可 |
| 掲示板イベント | 受注、達成、学習記録、バッジ獲得を扱う |
| 掲示板公開設定 | ユーザーがイベント種別ごとに公開/非公開を設定できる |
| バッジ判定 | MVPで表示するバッジは原則自動付与対象 |
| 経験値・レベル | MVPで実装する |

## 4. テーブル一覧

| テーブル名 | 用途 |
|---|---|
| `users` | ユーザー基本情報 |
| `auth_accounts` | メールログイン・Googleログイン情報 |
| `user_goals` | ユーザーの学習目標 |
| `quests` | クエストのマスタ情報 |
| `user_quests` | ユーザーが受注したクエスト履歴 |
| `study_logs` | 学習記録 |
| `badges` | バッジのマスタ情報 |
| `user_badges` | ユーザーが獲得したバッジ |
| `activity_logs` | 掲示板・活動履歴に表示するイベント |
| `user_event_settings` | 掲示板へのイベント公開設定 |
| `user_progress` | 経験値・レベル・ポイント・連続学習日数 |

## 5. テーブル定義

### 5.1 users

ユーザーの基本情報を管理するテーブルです。

| カラム名 | 型 | NULL | 制約・補足 |
|---|---|---:|---|
| `id` | UUID | NO | 主キー |
| `name` | VARCHAR(50) | NO | 表示名 |
| `email` | VARCHAR(255) | NO | 連絡先メールアドレス。一意 |
| `avatar_url` | TEXT | YES | プロフィール画像URL |
| `created_at` | TIMESTAMP | NO | 作成日時 |
| `updated_at` | TIMESTAMP | NO | 更新日時 |

#### 補足

- ログイン情報は `auth_accounts` で管理する。
- `users` はアプリ内で使うユーザー情報を持つ。

---

### 5.2 auth_accounts

ユーザーのログイン方法を管理するテーブルです。

| カラム名 | 型 | NULL | 制約・補足 |
|---|---|---:|---|
| `id` | UUID | NO | 主キー |
| `user_id` | UUID | NO | `users.id` への外部キー |
| `provider` | VARCHAR(20) | NO | `email`, `google` |
| `provider_user_id` | VARCHAR(255) | YES | Googleログイン時の外部ID。メールログインではNULL可 |
| `email` | VARCHAR(255) | NO | ログインに使うメールアドレス |
| `password_hash` | VARCHAR(255) | YES | メールログイン時のみ使用。GoogleログインではNULL可 |
| `created_at` | TIMESTAMP | NO | 作成日時 |
| `updated_at` | TIMESTAMP | NO | 更新日時 |

#### 制約

- `provider`, `provider_user_id` の組み合わせは一意にする。
- メールログインの場合、`password_hash` は必須。
- パスワードは平文保存しない。

---

### 5.3 user_goals

ユーザーの学習目標を管理するテーブルです。

| カラム名 | 型 | NULL | 制約・補足 |
|---|---|---:|---|
| `id` | UUID | NO | 主キー |
| `user_id` | UUID | NO | `users.id` への外部キー |
| `title` | VARCHAR(100) | NO | 目標名 |
| `description` | TEXT | YES | 目標の説明 |
| `category` | VARCHAR(50) | YES | 目標カテゴリ |
| `target_date` | DATE | YES | 目標期限 |
| `status` | VARCHAR(20) | NO | `active`, `completed`, `archived` |
| `created_at` | TIMESTAMP | NO | 作成日時 |
| `updated_at` | TIMESTAMP | NO | 更新日時 |

#### 補足

- MVPでは、まずアクティブな目標を表示できればよい。
- 目標の進捗率は、関連するクエストや学習記録から計算する方針。

---

### 5.4 quests

クエストのマスタ情報を管理するテーブルです。

| カラム名 | 型 | NULL | 制約・補足 |
|---|---|---:|---|
| `id` | UUID | NO | 主キー |
| `title` | VARCHAR(100) | NO | クエスト名 |
| `description` | TEXT | NO | クエスト説明 |
| `category` | VARCHAR(50) | NO | 例: `english`, `reading`, `programming`, `certification`, `other` |
| `difficulty` | VARCHAR(20) | NO | `easy`, `normal`, `hard` |
| `estimated_minutes` | INTEGER | YES | 想定学習時間 |
| `target_type` | VARCHAR(50) | NO | 達成条件の種類 |
| `target_value` | INTEGER | YES | 達成に必要な値 |
| `accept_points` | INTEGER | NO | 受注時ポイント。初期値0 |
| `complete_points` | INTEGER | NO | 達成時ポイント。初期値0 |
| `reward_exp` | INTEGER | NO | 達成時経験値。初期値0 |
| `is_active` | BOOLEAN | NO | 表示対象かどうか |
| `created_at` | TIMESTAMP | NO | 作成日時 |
| `updated_at` | TIMESTAMP | NO | 更新日時 |

#### target_type の候補

| 値 | 意味 |
|---|---|
| `study_minutes` | 学習時間で達成判定する |
| `study_count` | 学習記録回数で達成判定する |
| `manual` | 手動で達成判定する |

---

### 5.5 user_quests

ユーザーがクエストを受注した履歴を管理するテーブルです。

| カラム名 | 型 | NULL | 制約・補足 |
|---|---|---:|---|
| `id` | UUID | NO | 主キー |
| `user_id` | UUID | NO | `users.id` への外部キー |
| `quest_id` | UUID | NO | `quests.id` への外部キー |
| `status` | VARCHAR(20) | NO | `in_progress`, `completed`, `cancelled` |
| `accepted_at` | TIMESTAMP | NO | 受注日時 |
| `completed_at` | TIMESTAMP | YES | 達成日時 |
| `cancelled_at` | TIMESTAMP | YES | キャンセル日時 |
| `earned_points` | INTEGER | NO | この受注で獲得したポイント。初期値0 |
| `earned_exp` | INTEGER | NO | この受注で獲得した経験値。初期値0 |
| `created_at` | TIMESTAMP | NO | 作成日時 |
| `updated_at` | TIMESTAMP | NO | 更新日時 |

#### 補足

- 1回の受注につき1レコードを作成する。
- 達成後またはキャンセル後は、同じクエストを再受注できる。
- 同じユーザーが同じクエストを同時に複数進行中にすることは禁止する。
- 受注回数や達成回数は、このテーブルを集計して算出する。

---

### 5.6 study_logs

学習記録を管理するテーブルです。

| カラム名 | 型 | NULL | 制約・補足 |
|---|---|---:|---|
| `id` | UUID | NO | 主キー |
| `user_id` | UUID | NO | `users.id` への外部キー |
| `user_quest_id` | UUID | YES | `user_quests.id` への外部キー。クエストに紐づかない記録も許可 |
| `study_date` | DATE | NO | 学習日 |
| `studied_minutes` | INTEGER | NO | 0より大きい |
| `input_type` | VARCHAR(20) | NO | `timer`, `manual` |
| `started_at` | TIMESTAMP | YES | タイマー記録の場合に使用 |
| `ended_at` | TIMESTAMP | YES | タイマー記録の場合に使用 |
| `memo` | TEXT | YES | 学習メモ |
| `created_at` | TIMESTAMP | NO | 作成日時 |

#### 補足

- タイマー入力と手動入力の両方に対応する。
- 手動入力では開始時刻・終了時刻が分からない場合があるため、`started_at` と `ended_at` はNULL可とする。
- 週間学習時間、累計学習時間、連続学習日数は `study_logs` を元に算出する。

---

### 5.7 badges

バッジのマスタ情報を管理するテーブルです。

| カラム名 | 型 | NULL | 制約・補足 |
|---|---|---:|---|
| `id` | UUID | NO | 主キー |
| `code` | VARCHAR(100) | NO | プログラム上の識別子。一意 |
| `name` | VARCHAR(100) | NO | バッジ名 |
| `description` | TEXT | NO | 説明 |
| `icon_url` | TEXT | YES | アイコン画像URL |
| `condition_type` | VARCHAR(50) | NO | 獲得条件の種類 |
| `condition_value` | INTEGER | YES | 獲得に必要な値 |
| `is_active` | BOOLEAN | NO | 表示対象かどうか |
| `created_at` | TIMESTAMP | NO | 作成日時 |
| `updated_at` | TIMESTAMP | NO | 更新日時 |

#### condition_type の候補

| 値 | 意味 |
|---|---|
| `first_quest_completed` | 初回クエスト達成 |
| `completed_quest_count` | 達成クエスト数 |
| `total_study_minutes` | 累計学習時間 |
| `study_days` | 学習日数 |
| `streak_days` | 連続学習日数 |

---

### 5.8 user_badges

ユーザーが獲得したバッジを管理するテーブルです。

| カラム名 | 型 | NULL | 制約・補足 |
|---|---|---:|---|
| `id` | UUID | NO | 主キー |
| `user_id` | UUID | NO | `users.id` への外部キー |
| `badge_id` | UUID | NO | `badges.id` への外部キー |
| `awarded_at` | TIMESTAMP | NO | 獲得日時 |

#### 制約

- `user_id` と `badge_id` の組み合わせは一意にする。
- 同じユーザーが同じバッジを二重獲得しないようにする。

---

### 5.9 activity_logs

掲示板や活動履歴に表示するイベントを管理するテーブルです。

| カラム名 | 型 | NULL | 制約・補足 |
|---|---|---:|---|
| `id` | UUID | NO | 主キー |
| `user_id` | UUID | NO | `users.id` への外部キー |
| `event_type` | VARCHAR(50) | NO | イベント種別 |
| `user_quest_id` | UUID | YES | `user_quests.id` への外部キー |
| `study_log_id` | UUID | YES | `study_logs.id` への外部キー |
| `badge_id` | UUID | YES | `badges.id` への外部キー |
| `message` | TEXT | NO | 表示用メッセージ |
| `visibility` | VARCHAR(20) | NO | `public`, `private` |
| `created_at` | TIMESTAMP | NO | 作成日時 |

#### event_type の候補

| 値 | 意味 |
|---|---|
| `quest_accepted` | クエスト受注 |
| `quest_completed` | クエスト達成 |
| `study_logged` | 学習記録作成 |
| `badge_awarded` | バッジ獲得 |

---

### 5.10 user_event_settings

ユーザーごとの掲示板公開設定を管理するテーブルです。

| カラム名 | 型 | NULL | 制約・補足 |
|---|---|---:|---|
| `id` | UUID | NO | 主キー |
| `user_id` | UUID | NO | `users.id` への外部キー |
| `event_type` | VARCHAR(50) | NO | 公開設定対象のイベント |
| `is_public` | BOOLEAN | NO | 掲示板に公開するか |
| `created_at` | TIMESTAMP | NO | 作成日時 |
| `updated_at` | TIMESTAMP | NO | 更新日時 |

#### 制約

- `user_id` と `event_type` の組み合わせは一意にする。

---

### 5.11 user_progress

ユーザーの経験値・レベル・ポイント・連続学習日数を管理するテーブルです。

| カラム名 | 型 | NULL | 制約・補足 |
|---|---|---:|---|
| `user_id` | UUID | NO | `users.id` への外部キー。主キーでも可 |
| `level` | INTEGER | NO | 現在レベル |
| `total_exp` | INTEGER | NO | 累計経験値 |
| `total_points` | INTEGER | NO | 累計ポイント |
| `current_streak_days` | INTEGER | NO | 現在の連続学習日数 |
| `longest_streak_days` | INTEGER | NO | 最長連続学習日数 |
| `updated_at` | TIMESTAMP | NO | 更新日時 |

#### 補足

- `user_progress` は、画面表示をしやすくするための現在値を持つ。
- 学習時間の元データは `study_logs` とする。
- もし `user_progress` と元データの集計結果がずれた場合は、元データを正とする。

## 6. テーブル同士の関係

```text
users
  ├─ auth_accounts
  ├─ user_goals
  ├─ user_progress
  ├─ user_quests
  │    └─ quests
  ├─ study_logs
  │    └─ user_quests
  ├─ user_badges
  │    └─ badges
  ├─ activity_logs
  └─ user_event_settings
```

| 関係 | 内容 |
|---|---|
| `users` 1 : N `auth_accounts` | 1人のユーザーは複数のログイン方法を持てる |
| `users` 1 : N `user_goals` | 1人のユーザーは複数の目標を持てる |
| `users` 1 : 1 `user_progress` | 1人のユーザーは1つの進捗情報を持つ |
| `users` 1 : N `user_quests` | 1人のユーザーは複数のクエスト受注履歴を持つ |
| `quests` 1 : N `user_quests` | 1つのクエストは複数ユーザーに受注される |
| `users` 1 : N `study_logs` | 1人のユーザーは複数の学習記録を持つ |
| `user_quests` 1 : N `study_logs` | 1つの受注クエストに複数の学習記録が紐づく |
| `users` 1 : N `user_badges` | 1人のユーザーは複数のバッジを獲得できる |
| `badges` 1 : N `user_badges` | 1つのバッジは複数ユーザーに獲得される |
| `users` 1 : N `activity_logs` | 1人のユーザーは複数の活動ログを持つ |
| `users` 1 : N `user_event_settings` | 1人のユーザーはイベント種別ごとの公開設定を持つ |

## 7. 主な制約

| 対象 | 制約 |
|---|---|
| `users.email` | 一意 |
| `auth_accounts.provider` | `email`, `google` のいずれか |
| `quests.difficulty` | `easy`, `normal`, `hard` のいずれか |
| `quests.target_type` | `study_minutes`, `study_count`, `manual` のいずれか |
| `user_quests.status` | `in_progress`, `completed`, `cancelled` のいずれか |
| `user_quests` | 同じユーザー・同じクエストの進行中レコードは1件まで |
| `study_logs.studied_minutes` | 0より大きい |
| `study_logs.input_type` | `timer`, `manual` のいずれか |
| `user_badges` | `user_id` と `badge_id` の組み合わせを一意にする |
| `activity_logs.visibility` | `public`, `private` のいずれか |
| `user_event_settings` | `user_id` と `event_type` の組み合わせを一意にする |
| `user_progress.total_exp` | 0以上 |
| `user_progress.total_points` | 0以上 |

## 8. 推奨インデックス

| テーブル | インデックス | 目的 |
|---|---|---|
| `users` | `email` | ユーザー検索 |
| `auth_accounts` | `provider`, `provider_user_id` | 外部認証ログイン |
| `auth_accounts` | `email` | メールログイン |
| `quests` | `is_active`, `category`, `difficulty` | クエスト一覧・絞り込み |
| `user_quests` | `user_id`, `status` | マイクエスト取得 |
| `user_quests` | `user_id`, `quest_id`, `status` | 進行中の重複受注チェック |
| `study_logs` | `user_id`, `study_date` | 週間学習状況の集計 |
| `user_badges` | `user_id`, `badge_id` | バッジ重複チェック |
| `activity_logs` | `visibility`, `created_at` | 掲示板の新着取得 |
| `user_event_settings` | `user_id`, `event_type` | 公開設定の取得 |
