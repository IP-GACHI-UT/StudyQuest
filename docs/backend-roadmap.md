# StudyQuest バックエンド作業ロードマップ

更新日: 2026-10-05。全体の実装順は[公開・価値検証ロードマップ](roadmap.md)、現在の小項目・証拠は[進捗表](progress/index.html)を参照する。旧資料の「認証は最後」「本認証はMVP後」は、複数人向け公開の順序には適用しない。

STEP 02の作業版`13792d4`で、本人ログGET、再送防止、同時保存の累積判定、日本時間の週間集計と画面接続を実装・ローカル検証した。専用ブランチのPRは未マージで、developへの統合や本認証・配置は未確認。[確認記録](progress/review/step02.md)を参照。次にSTEP 03の既存認証PRを評価する。

後続のSTEP 03で本認証・本人分離をローカル統合・検証し、PR #67をOpenにした。STEP 04は配置・費用の候補と別DB復元まで準備、実配置・公開は確認待ち。STEP 05では既存DBによる[β計測](beta-metrics.md)と公開版候補を準備する。これらは作業ブランチの進捗で、developへのマージや実参加者の成果とは分ける。

## 初期基準版の実装とIssue

基準版`8600867`のコードと2026-10-04のIssue状態を照合。ClosedはGitHub上の状態であり、今回の実DB再検証を意味しない。

| 対象 | 状態 | 根拠・残る確認 |
| --- | --- | --- |
| 起動・DB運用・seed・API確認手順 | 文書・コードあり / #11〜#14 Closed | README、docs/db.md、prisma/seed.js、docs/api/test-guide.md。現環境での再実行は別検証 |
| クエスト一覧・受注・マイクエスト・学習記録作成 | API実装あり | apps/api/src/routes。UIから一連の保存を検証する |
| 学習ログの一覧取得 | 画面呼び出しとAPIが不整合 | ホームはGET /api/study-logsを呼ぶが、基準版のルート・OpenAPIはPOSTのみ。STEP 02で解消 |
| 週間集計 | API実装あり / #15 Closed | study-summary.ts。ホームの固定値を実データへ接続する必要あり |
| 活動・プロフィール | API実装あり / #16・#17 Closed | activities.ts、profile.ts。公開に不要な拡張は後回し |
| 達成判定・XP・受注ポイント | API実装あり / #18・#47 Closed | quest-completion.ts、quests.ts。二重加算・境界条件を実DBで再確認 |
| 掲示板の本人受注状態 | API修正あり / #48 Closed | quest-board.ts。フロント接続 #54はOpen、公開必須ではない |
| 本認証 | 基準版は開発用固定ID | codex/auth-*の既存作業を確認し、方式・統合順・検証範囲を決める |

## 次の作業

1. STEP 02: #52と学習タイマー→学習記録API→達成/XP→週間表示のフロント連携を支援する。`study_logs`で集計、`user_quests`で進行、`activity_logs`で活動を分け、既存のJSON形式とPresenterを維持する。
2. STEP 03: 既存認証ブランチを調査して本認証を統合する。全更新APIでセッションから本人を特定し、未ログイン・他人の対象ID・期限切れを拒否する。認証は無料βの公開前に必要。
3. STEP 04〜05: API URL/CORS/秘密値/DB接続/復元/ログを配置環境で確認する。Prisma/PostgreSQLを維持できる低コスト構成を先に検証する。
4. STEP 06以降: 目標→クエスト生成の最小契約、AI入力と費用上限、本人所有権を定義してから実装する。生成・採用・学習ログの責務を混ぜない。
5. STEP 09〜10: 需要確認後に計画・再計画と決済へ進む。Webhookの署名、重複・順不同、購読状態と権限、解約を検証する。

AI・認証・決済のAPIやDB構造はこの文書だけで追加しない。対象Issueで[OpenAPI](api/openapi.yaml)、[Prisma](../prisma/schema.prisma)を更新し、[DB手順](db.md)と[リポジトリの検証規約](../AGENTS.md)に従う。

## 更新とレビュー

小項目の状態・証拠は[progress/tasks.json](progress/tasks.json)へ記録し、`pnpm progress:build`と`pnpm progress:check`でHTMLへ反映する。この文書は作業順や担当範囲が変わったときに更新する。詳細な実装相談とPR/マージ状態はIssueで管理し、既存IssueのClosedを未着手へ戻さない。
