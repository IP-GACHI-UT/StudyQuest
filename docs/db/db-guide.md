# DB設計ガイド

このドキュメントは、初学者が `db-design.md` を読みやすくするための補助資料です。

`db-design.md` には正式なテーブル定義を書き、このファイルには「なぜそうするのか」「どの画面で使うのか」「いつデータが作られるのか」をまとめます。

## 1. 最低限の用語

| 用語 | 意味 | StudyQuestでの例 |
|---|---|---|
| テーブル | 同じ種類のデータを入れる表 | `users`, `quests` |
| カラム | テーブルの項目 | `users.name`, `quests.title` |
| レコード | テーブルに保存される1件のデータ | 1人のユーザー、1回の学習記録 |
| 主キー | 1件のデータを特定するID | `users.id` |
| 外部キー | 他のテーブルとつなぐID | `user_quests.user_id` |
| NULL | 値が未設定であること | `completed_at` |
| 一意 | 重複禁止 | `users.email` |
| マスタ | 全ユーザー共通で使う基本データ | `quests`, `badges` |
| 履歴 | 過去の操作や出来事を残すデータ | `user_quests`, `study_logs` |
| 論理削除 | DBから消さずに非表示にすること | `is_active = false` |

## 2. 画面ごとに使う主なテーブル

| 画面 | 主なテーブル | 用途 |
|---|---|---|
| ログイン画面 | `users`, `auth_accounts` | ログイン、ユーザー判定 |
| ホーム画面 | `user_goals`, `user_progress`, `study_logs`, `activity_logs` | 目標、進捗、週間状況、活動表示 |
| クエスト一覧画面 | `quests`, `user_quests` | クエスト一覧、受注済み判定 |
| マイクエスト画面 | `user_quests`, `quests`, `study_logs` | 進行中クエスト、学習記録、達成判定 |
| 掲示板画面 | `activity_logs`, `user_event_settings` | 公開された活動の表示 |
| プロフィール画面 | `users`, `user_progress`, `user_badges`, `badges`, `study_logs` | プロフィール、レベル、バッジ、学習実績 |

## 3. 保存する値と集計する値

画面に表示する値をすべてDBに保存する必要はありません。

基本方針は以下です。

- 後から再現できない事実は保存する。
- 元データから計算できる値は、できるだけ保存しない。
- 表示頻度が高く、毎回計算すると面倒な現在値は保存してもよい。

| 表示・機能 | 保存するか | 元データ・保存先 |
|---|---:|---|
| クエスト名 | 保存する | `quests.title` |
| クエストを受注した事実 | 保存する | `user_quests` |
| クエストを達成した事実 | 保存する | `user_quests.status`, `completed_at` |
| 学習した事実 | 保存する | `study_logs` |
| バッジを獲得した事実 | 保存する | `user_badges` |
| 今日の受注数 | 保存しない | `user_quests.accepted_at` を集計 |
| 今日の達成数 | 保存しない | `user_quests.completed_at` を集計 |
| 週間学習時間 | 保存しない | `study_logs.study_date`, `studied_minutes` を集計 |
| 累計学習時間 | 保存しない | `study_logs.studied_minutes` を集計 |
| 現在レベル | 保存する | `user_progress.level` |
| 累計経験値 | 保存する | `user_progress.total_exp` |
| 累計ポイント | 保存する | `user_progress.total_points` |
| 連続学習日数 | 保存する | `user_progress.current_streak_days` |

## 4. 主な操作とデータの流れ

### 4.1 ユーザー登録

1. `users` にユーザー基本情報を作成する。
2. `auth_accounts` にログイン方法を作成する。
3. `user_progress` に初期進捗を作成する。
4. `user_event_settings` にイベント公開設定の初期値を作成する。

### 4.2 クエストを受注する

1. `quests` から対象クエストを確認する。
2. `user_quests` に1件追加する。
3. `status` は `in_progress` にする。
4. `accepted_at` に受注日時を入れる。
5. 必要に応じて `user_progress.total_points` に受注ポイントを加算する。
6. `activity_logs` に `quest_accepted` を作成する。
7. 公開/非公開は `user_event_settings` を見て決める。

### 4.3 学習記録を作成する

1. `study_logs` に1件追加する。
2. タイマー入力なら `started_at`, `ended_at`, `studied_minutes` を保存する。
3. 手動入力なら `study_date`, `studied_minutes`, `memo` を保存する。
4. クエストに紐づく場合は `user_quest_id` を入れる。
5. `activity_logs` に `study_logged` を作成する。
6. クエスト達成条件を満たしているか確認する。

### 4.4 クエストを達成する

1. 対象の `user_quests.status` を `completed` に更新する。
2. `completed_at` に達成日時を入れる。
3. `earned_points`, `earned_exp` に獲得値を入れる。
4. `user_progress` のポイント・経験値・レベルを更新する。
5. バッジ条件を満たしていれば `user_badges` に追加する。
6. `activity_logs` に `quest_completed` を作成する。

### 4.5 バッジを獲得する

1. `badges` の条件を確認する。
2. 条件を満たしたら `user_badges` に1件追加する。
3. 同じバッジをすでに持っている場合は追加しない。
4. `activity_logs` に `badge_awarded` を作成する。

## 5. サンプルデータ

### user_quests の例

| user_id | quest_id | status | accepted_at | completed_at |
|---|---|---|---|---|
| user_1 | quest_1 | completed | 2026-06-01 10:00 | 2026-06-01 10:30 |
| user_1 | quest_1 | completed | 2026-06-03 20:00 | 2026-06-03 20:40 |
| user_1 | quest_1 | in_progress | 2026-06-05 21:00 | NULL |

この場合、`user_1` は `quest_1` を3回受注しています。

このように、`user_quests` を1受注1レコードにしておくと、後から受注回数や達成回数を集計できます。

### study_logs の例

| user_id | user_quest_id | study_date | studied_minutes | input_type |
|---|---|---|---:|---|
| user_1 | user_quest_1 | 2026-06-01 | 30 | timer |
| user_1 | NULL | 2026-06-02 | 20 | manual |

2件目は、クエストに紐づかない自由な学習記録です。

## 6. 注意点

- `user_quests` は現在状態だけでなく、受注履歴を残すテーブルとして扱う。
- `study_logs` は学習時間集計の元データなので、簡単に削除しない。
- `activity_logs` は掲示板表示用だが、公開/非公開の判断には `user_event_settings` を使う。
- `user_progress` は画面表示しやすくするための現在値。元データとずれた場合は、`study_logs` や `user_quests` を正とする。
