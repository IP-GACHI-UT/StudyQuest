# STEP 06: 目標から今日のクエストを作る契約案

2026-10-05、Issue [#74](https://github.com/IP-GACHI-UT/StudyQuest/issues/74)。API契約の正本は[openapi.yaml](api/openapi.yaml)の`AiQuests`（すべて`planned`）。この文書は保存先・本人分離・失敗時の振る舞いを説明する設計案。現在のHonoには生成・採用ルートがなく、AI呼び出し・DB変更・画面変更は今回行わない。

## 着手条件と未決定事項

[ロードマップ](roadmap.md)と[MVP](mvp.md)に従い、最初の無料βにはAIを含めない。設計の準備と、利用者へAI機能を提供する判断を分ける。

| 項目 | 現在の扱い | 実装・試験の前に必要なこと |
| --- | --- | --- |
| 対象分野 | 確認待ち。下の例は既存seedと接続しやすいプログラミング基礎 | 最初の試験分野を選び、βの反応で対象・教材範囲を確認 |
| 入出力の大きさ | 目標500文字、時間5〜120分、クエスト1〜3件の提案 | 対象分野の教材と利用者に合うか確認 |
| AI事業者・モデル | 未選定 | 最新の料金・入力データの扱い・保存/削除・利用条件を確認 |
| 費用・回数 | 未決定 | 本人単位の日次上限、全体予算、出力token上限、timeoutを確定。未設定なら生成を無効にする |
| 報酬 | 試験中のAIクエストは受注/達成ポイント・XPを0にする提案 | 多重生成で報酬を増やせない方針を確認。モデルやクライアントに決めさせない |
| 提供判断 | 無料βの公開・実測が未実施 | STEP 05の基本体験と需要を確認し、小規模AI試験の条件・同意を決める |

この提案を追加しただけでは、06.1.1を完了にしない。対象分野の選択と入力/保存先の確認を残す。06.1.2以降の実接続は上の条件が揃ってから別の実装Issueへ進む。

## 入力と出力

生成入力は`requestId`（UUID v4）、`domain`、`goal`、`deadline`、`availableMinutes`の5項目だけ。`domain`は`programming` / `certification` / `english`の候補から、試験で選んだ分野だけをサーバーで許可する。教材本文・学習履歴・氏名・メール・利用者IDは入力に含めない。目標に個人情報・秘密情報を入れない案内を生成前に表示する。

文字列はLFへ揃えて前後をtrimし、Unicodeコードポイント数で検査する。目標は1〜500文字、期限は実在する`YYYY-MM-DD`で、日本時間の今日から90日後まで。使える時間は「今日この一度の生成結果に使える合計」で5〜120の整数。週の予算や、残り日数×時間を意味しない。期限内の達成を保証しない。

モデルから受け取るJSONは`drafts`配列だけ。各要素は`title`（1〜80文字）、`description`（1〜600文字の具体的行動）、`estimatedMinutes`（5〜120の整数）。1〜3件、合計時間が入力の`availableMinutes`以下で、重複する行動がないことをサーバーで検査する。空白だけ、未知の項目、範囲外、壊れたJSONは失敗として扱う。タイトル等はプレーンテキストとして表示し、HTML実行・URL取得・ツール実行には使わない。

サーバーが`generationId`、`draftIndex`（1始まり）、状態と時刻を付ける。モデル出力のID・所有者・報酬・権限・採用状態は信用しない。`draftIndex`は保存後に変えず、編集しても元の案を追えるようにする。

例は人が書いた契約用サンプルで、AI生成結果でも実績でもない。

```json
{
  "requestId": "1b2f3a40-66bb-4bbb-8ccc-123456789abc",
  "domain": "programming",
  "goal": "HTMLで自己紹介ページを作れるようになる",
  "deadline": "2026-10-12",
  "availableMinutes": 30
}
```

```json
{
  "drafts": [
    { "title": "見出しと段落を置く", "description": "h1とpを使い、名前の代わりにサンプル文字列を置いたHTMLを作る。ブラウザーで表示を確認する。", "estimatedMinutes": 15 },
    { "title": "リンクとリストを加える", "description": "ページにaとul/liを追加し、クリック先と箇条書きの表示を確認する。", "estimatedMinutes": 15 }
  ]
}
```

## APIと採用の流れ

| 操作（未実装） | 契約 | 本人確認・再送 |
| --- | --- | --- |
| `POST /api/quest-generations` | 入力を保存し、検証済みの案を返す。成功201、同じ要求が実行中なら202 | sessionのUser IDとrequestIdの複合一意制約。正規化した入力が同じなら既存結果、違えば409。再送でAIを再呼び出ししない |
| `GET /api/quest-generations/{generationId}` | 保存した入力・状態・案・採用先を再取得 | 未ログイン401。他人のIDと不存在は同じ404。providerの生レスポンスや内部料金は返さない |
| `POST /api/quest-generations/{generationId}/adoptions` | 一つの案を編集して採用し、既存形式の`userQuest`を返す | generationの所有者をsessionと照合。requestIdで再送を識別し、同じ案は一度だけ採用。採用後の編集はこのAPIで行わない |

502/504は既存の`error`に保存済み`generationId`を添える。初回応答を失ってIDが不明でも、同じrequestId/入力のPOSTから保存済みの成功・実行中・失敗/結果不明のIDを取得できる。再送の入力一致を先に照合し、今日からの期限検査・quota予約は初回だけ行う。日付が変わっただけで確定済みの要求を拒否したり、再生成したりしない。

採用入力は`requestId`、`draftIndex`、編集済みの`title`・`description`・`estimatedMinutes`。生成時と同じ長さ・時間制約を使う。未採用の案から1件ずつ選び、今回の編集後時間と既に採用した案の時間の合計も元の予算以下にする。生成レコードをロックして、並行採用で合計を超えないようにする。

採用のtransactionで個人用Quest・UserQuest（IN_PROGRESS）・採用記録・活動を一緒に作る。モデル案だけでは受注、ポイント、学習ログを作らない。既存の受注APIをHTTPで再呼び出しして二重作成しない。同じrequestId/内容の再送は確定済みの201、内容の変更や採用済み案の別要求は409。DB制約でも競合を防ぐ。

採用後は`/my-quest`→`/study/{questId}`→`POST /api/study-logs`へつなぐ。学習時間・週間集計は既存study_logs、進行はuser_quests、活動はactivity_logsのまま。採用先のQuestに目標本文・期限・provider情報を埋め込まない。

## 保存先と必要なDB変更（設計のみ）

現在の[Prisma](../prisma/schema.prisma)にはAI・個人用クエストのモデルがない。以下を実装Issueでschemaとmigrationへ反映し、[db.md](db.md)の手順で開発DBの移行を検証する。今回のSQL/モデル実装ではない。

| 対象 | 追加案 | 制約・寿命 |
| --- | --- | --- |
| QuestGeneration | userId、requestId、正規化した入力とハッシュ、状態、検証済みdrafts(JSON)、内部provider/モデル/設定版、provider側照会ID（得られる場合）、時刻、使用量・原価（未確定はnull） | `(userId, requestId)` unique。JSONはAPI・DBの前に同じvalidatorを通す。モデル出力はuserIdを書き換えられない |
| QuestGenerationAdoption | generationId、draftIndex、userId、requestId、入力ハッシュ、questId、createdAt | `(generationId, draftIndex)` / `(userId, requestId)` / questIdはそれぞれunique。生成の所有者とuserIdの一致をtransactionで検査 |
| Quest | nullableのownerIdとUserへのrelation | nullは既存共通クエスト、非nullは本人用。新規AI採用では必ずsessionのIDを設定。既存データは共通のまま |
| User | 上記の所有relation | 退会時の削除方針を決め、所有者だけnullになって個人用Questが公開へ変わる`SetNull`を禁止する |

生成案の原文と採用後の編集内容は別に保存する。未採用の目標/案・入力ハッシュ・provider使用量の保持期間と削除方法は、事業者の扱いと同意内容を確定してから決める。案や目標を削除するときに、採用後のQuest・UserQuest・StudyLog・達成/XPを連鎖削除しない関係を設計する。生成/採用の再送キーを削除して再実行できる期間も決め、キーだけの最小記録を保持する案を検討する。削除が未実装なのに「即時削除できる」と案内しない。

## 既存APIの本人分離

現在の`GET /api/quests`と掲示板は`isActive: true`だけでQuestを取得する。ownerIdを追加するだけでは個人の学習内容が漏れるため、同じ実装PRで以下を修正・DB検証する。

| 箇所 | 必須の制約 |
| --- | --- |
| クエスト一覧・掲示板・その人数集計 | 共通の`ownerId: null`だけ。個人用の件数・タイトル・完了率も混ぜない |
| `POST /api/quests/{questId}/accept` | 共通または本人所有だけ。個人用AI案は採用時に受注済み。他人のQuestは404 |
| マイクエスト・学習保存・活動 | UserQuest/StudyLog/ActivityのuserIdに加え、参照Questが共通または本人所有であることを確認。所有関係が壊れたデータも返さない |
| Presenterとログ | 既存Questの公開項目を保ち、ownerId・生成入力・内部provider・費用を追加で返さない。活動の目標本文や生成タイトルを別利用者へ公開しない |

クライアントのuserId、Cookie中の表示名、modelの主張を本人判定に使わない。POSTはJSON・許可Origin・sessionを検査する。新ルートにも既存のCSRF/CORS方針を明示的に適用し、異なるOriginのJSONとフォーム送信を拒否する。

## 回数・原価・失敗

入力検査と本人照合の後、本人の日次上限・全体の費用上限・同一要求の実行権をDBで一度だけ確保してからproviderを呼ぶ。メモリだけの上限はFunctionsの別instance間で共有できない。生成レコード・quota/予算予約の保存方法は06.2.2の実装Issueで設計する。料金未選定のためこの文書は具体的な試験回数・円・token数を確定しない。

| 状態/応答 | 保存・UI・再試行 |
| --- | --- |
| 機能未接続/上限未設定（503 AI_UNAVAILABLE） | providerを呼ばず「準備中」。入力を保ち、基本クエストへ移動できる。成功の案は作らない |
| running（202） | 保存済みgenerationIdを返し、GETで再取得。同じrequestIdで二度目を実行しない。無期限の自動pollをしない |
| succeeded（201/GET 200） | すべての案を検査してから保存。編集・採用を可能にする |
| failed（502 AI_INVALID_OUTPUT / AI_PROVIDER_FAILED） | 不正な案を部分採用しない。入力を保ち、基本クエストへ戻れる。新規生成は利用者の操作と残り上限で判断 |
| unknown（504 AI_RESULT_UNKNOWN） | timeout・通信断では費用や結果が確定していない。自動再呼び出し/予約の無条件返却をせず、同じ要求を照会。確認できるまで新規生成を制限する |
| 上限超過（429 AI_LIMIT_REACHED） | 今日の残り上限等だけ表示。provider内部エラー・学習本文をログ/計測に出さない |
| 期限切れ（401） | 入力・編集内容を同じ画面に保持。再ログイン後に本人を再照合し、同じキーで再取得。別アカウントの案を復元しない |

公開前にtimeout値とFunctionsの実行時間を合わせる。処理が終了した後に走り続ける非永続のバックグラウンド処理へ依存しない。停止したrunningの検出・unknownへの移行・provider結果照合の運用も定義する。現時点で新しいqueue/workerを契約する意味ではない。

AIへ送るのは明示した目標・分野・期限・時間だけ。本人ID、メール、Cookie、学習メモを送らない。入力とモデルの文章はデータとして扱い、その中の命令で認証・上限・報酬・公開範囲を変えない。利用者への送信先/同意/削除案内、秘密値のサーバー管理、本文を含まない監視を整える。

## 後続実装の検証条件

- 単体: 日本語/空白/文字数境界、実在日付/JST日付/90日境界、時間の整数/合計、1〜3件、未知項目/壊れたJSON/空/重複/命令入り出力、採用編集の再検査。
- 専用DB: 未ログイン拒否、A生成→BのGET/採用/受注/学習は拒否、共通一覧/掲示板にAの案が出ない、Presenter漏洩なし。同じrequestIdの同時生成はprovider一度、並行採用は同じ案一度・予算以内、DB失敗で受注/報酬/活動の片残りなし。
- providerのstub: 遅延、timeout、通信断、429、不正出力、利用量欠損を再現。stubの成功を実AI接続の証拠にしない。原価不明を0円に置換しない。
- PC/スマホ: 入力→生成待ち→編集→採用→既存タイマー→ログ保存。空/失敗/期限切れから入力を保って復帰。未接続は準備中を表示。
- 実接続: 条件確定後に許可された少数の合成入力で送信・使用量・費用を照合。STEP 07の観測期間・母数・継続基準を事前に確定する。

## 今回のレビュー順

1. 対象分野と、5〜120分・1〜3件という今日の範囲を確認する。
2. [OpenAPI](api/openapi.yaml)のplanned 3操作を確認する。未提供を実装済みと解釈しない。
3. 個人用Questの一覧除外・所有者照合・採用transactionの検証条件を確認する。
4. 事業者/料金/上限/同意/保持期間/報酬と、無料βの結果待ちを確認する。

確認コマンドと対象版は[STEP 06の記録](progress/review/step06-contract.md)に追記する。
