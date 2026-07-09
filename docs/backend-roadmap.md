# StudyQuest バックエンド専用タスクロードマップ

## 目的

このドキュメントは、StudyQuest のバックエンド担当が作業前に見返して、次に進める Issue を判断するためのロードマップです。

詳細な作業内容・完了条件は GitHub Issue に記載し、このロードマップでは以下だけを管理します。

- バックエンド全体の進行順
- 現在のDone / 未Done
- どのIssueを次に進めるべきか
- MVPまでに必要なバックエンド作業の範囲

---

## 前提

- 認証は最後に追加する
- 認証実装までは開発用ユーザーで進める
- DBは Prisma + PostgreSQL を前提にする
- DB変更は Prisma migration を使う前提で管理する
- APIは `apps/api` にHonoで実装する
- APIパスは `/api/...` を維持する
- フロント画面の修正はバックエンド移行作業に含めない
- seedでは開発用クエストを5〜10件作成する
- API確認は Thunder Client をメインにする
- curl は補助・README記載用として使う
- 掲示板は `activity_logs` の取得APIまで作る
- プロフィールは最低限の取得APIまで作る
- バッジはMVPでは表示・取得までにする
- 高度なバッジ判定はMVP後に回す

---

## ステータス定義

| ステータス | 意味 |
| --- | --- |
| Done | 実装・確認・必要なドキュメント更新まで完了 |
| Review | PR作成済み、レビュー待ち |
| In Progress | 作業中 |
| Ready | 仕様が明確で、すぐ着手できる |
| Todo | やる必要はあるが、まだ着手前 |
| Later | MVP後、または主要導線完成後でよい |

---

## バックエンドのDone条件

バックエンドタスクは、コードを書いただけではDoneにしない。

API実装タスクは、以下を満たしたらDoneにする。

- `apps/api` にHonoのAPIルートが実装されている
- 正常系レスポンスが返る
- エラー時もJSONで返る
- 必要なバリデーションがある
- PrismaでDBアクセスしている
- OpenAPI仕様とレスポンス形式が大きくズレていない
- Thunder Client または curl で動作確認済み
- PRに確認方法が書かれている
- 必要なら README または docs が更新されている
- develop ブランチにマージ済み

DB関連タスクは、以下を満たしたらDoneにする。

- Prisma schema が更新されている
- 必要な migration が作成されている
- ローカルDBに反映できる
- Prisma Client を生成できる
- seedが必要な場合はseedも更新されている
- README または docs に実行手順がある
- develop ブランチにマージ済み

---

## 現在Doneにしてよいもの

| 分類 | タスク | 状態 | 備考 |
| --- | --- | --- | --- |
| DB | Prisma schema作成 | Done | 主要モデル定義済み |
| API仕様 | OpenAPI初版作成 | Done | MVP API仕様あり |
| API | クエスト一覧取得API | Done | `GET /api/quests` |
| API | クエスト受注API | Done | `POST /api/quests/{questId}/accept` |
| API | マイクエスト取得API | Done | `GET /api/my-quests` |
| API | 学習記録作成API | Done | `POST /api/study-logs` |
| 認証 | 開発用ユーザー取得 | Done | 仮対応。本認証ではない |

---

## 現在進めるIssue

詳細な作業内容・完了条件は各Issueを参照する。

| 優先順 | Issue | タスク | 現在状態 | 目的 |
| --- | --- | --- | --- | --- |
| 1 | [#11](https://github.com/IP-GACHI-UT/StudyQuest/issues/11) | READMEのバックエンド起動手順を修正する | Ready | 新しく参加した人が正しい手順で起動できるようにする |
| 2 | [#12](https://github.com/IP-GACHI-UT/StudyQuest/issues/12) | Prisma migration運用手順を整理する | Ready | DB変更時の手順をチームで統一する |
| 3 | [#13](https://github.com/IP-GACHI-UT/StudyQuest/issues/13) | seedで開発用クエストを作成する | Ready | API確認・フロント連携で使う初期データを用意する |
| 4 | [#14](https://github.com/IP-GACHI-UT/StudyQuest/issues/14) | Thunder ClientでAPI確認手順を作成する | Ready | 実装済みAPIを誰でも確認できるようにする |
| 5 | [#15](https://github.com/IP-GACHI-UT/StudyQuest/issues/15) | 週間学習状況APIを実装する | Todo | 今週の学習時間・曜日別学習時間を返す |
| 6 | [#16](https://github.com/IP-GACHI-UT/StudyQuest/issues/16) | 活動ログ取得APIを実装する | Todo | 掲示板エリア用に活動ログを返す |
| 7 | [#17](https://github.com/IP-GACHI-UT/StudyQuest/issues/17) | プロフィール取得APIを実装する | Todo | プロフィール表示に必要な情報を返す |
| 8 | [#18](https://github.com/IP-GACHI-UT/StudyQuest/issues/18) | 学習記録APIにクエスト達成判定を追加する | Todo | 学習時間が条件を満たしたらクエストを完了にする |

---

## 作業順

### Step 1：バックエンド作業の土台を整える

まずは以下を進める。

- [#11](https://github.com/IP-GACHI-UT/StudyQuest/issues/11) READMEのバックエンド起動手順を修正する
- [#12](https://github.com/IP-GACHI-UT/StudyQuest/issues/12) Prisma migration運用手順を整理する
- [#13](https://github.com/IP-GACHI-UT/StudyQuest/issues/13) seedで開発用クエストを作成する
- [#14](https://github.com/IP-GACHI-UT/StudyQuest/issues/14) Thunder ClientでAPI確認手順を作成する

このStepの目的は、実装済みAPIをチーム内で確認できる状態にすること。

### Step 2：週間学習状況APIを作る

次に以下を進める。

- [#15](https://github.com/IP-GACHI-UT/StudyQuest/issues/15) 週間学習状況APIを実装する

このAPIができると、フロントの「今週の学習状況」表示と連携できる。

### Step 3：掲示板・プロフィール用APIを作る

次に以下を進める。

- [#16](https://github.com/IP-GACHI-UT/StudyQuest/issues/16) 活動ログ取得APIを実装する
- [#17](https://github.com/IP-GACHI-UT/StudyQuest/issues/17) プロフィール取得APIを実装する

このStepで、掲示板エリアとプロフィール画面の最低限のAPIが揃う。

### Step 4：クエスト達成判定を追加する

次に以下を進める。

- [#18](https://github.com/IP-GACHI-UT/StudyQuest/issues/18) 学習記録APIにクエスト達成判定を追加する

このStepで、MVPの主要導線がよりアプリらしくなる。

流れは以下。

```text
クエスト一覧を見る
→ クエストを受注する
→ マイクエストに表示される
→ 学習記録を作成する
→ 条件達成でクエスト完了になる
→ 活動ログや週間学習状況に反映される
```

### Step 5：認証を追加する

認証は最後に追加する。

主要導線が一通り動くまでは、開発用ユーザーで進める。

認証で検討すること。

- Auth.js / NextAuth を使うか
- GitHubログインにするか
- メールログインにするか
- セッション方式にするか
- JWT方式にするか
- `getCurrentUserId()` をどう差し替えるか
- 未ログイン時にAPIで401を返すか

認証Issueは、主要導線完成後に別途作成する。

---

## 今週のおすすめ作業

今週は、新しいAPIを増やす前にバックエンドの土台を整える。

優先順は以下。

1. [#11](https://github.com/IP-GACHI-UT/StudyQuest/issues/11) READMEのバックエンド起動手順を修正する
2. [#12](https://github.com/IP-GACHI-UT/StudyQuest/issues/12) Prisma migration運用手順を整理する
3. [#13](https://github.com/IP-GACHI-UT/StudyQuest/issues/13) seedで開発用クエストを作成する
4. [#14](https://github.com/IP-GACHI-UT/StudyQuest/issues/14) Thunder ClientでAPI確認手順を作成する
5. 余裕があれば [#15](https://github.com/IP-GACHI-UT/StudyQuest/issues/15) 週間学習状況APIに着手する

---

## MVPまでにバックエンドで完成させるもの

### 必須

- クエスト一覧取得
- クエスト受注
- マイクエスト取得
- 学習記録作成
- 週間学習状況取得
- 活動ログ取得
- プロフィール取得
- seedデータ
- migration運用
- API確認手順

### できればやる

- クエスト達成判定
- ポイント・XP加算
- 最低限のバッジ取得
- APIエラー形式の統一

### 後回し

- 本認証
- 高度なバッジ判定
- 通知
- ランキング
- フレンド機能
- 課金

---

## ロードマップ更新ルール

Issueが進んだら、このロードマップでは詳細を書き換えず、状態だけを更新する。

例：

- Issueが作業中になったら `Ready` から `In Progress` にする
- PRを出したら `Review` にする
- developにマージしたら `Done` にする
- 仕様変更が出たら、詳細はIssue側に追記する

このロードマップに細かい実装手順を書きすぎない。
詳細はIssueに集約する。
