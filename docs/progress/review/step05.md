# STEP 05 無料β候補・利用計測の確認

2026-10-05 / Issue #70。掲示板は`3d574ab`、匿名集計は`8b080df`。STEP 04の`52b04bf`を基にした専用ブランチ`feature/70-step05-beta-preparation`で確認した。実参加者の成果や本番公開ではない。

## レビュー順と変更

[PR #65](https://github.com/IP-GACHI-UT/StudyQuest/pull/65) → [#67](https://github.com/IP-GACHI-UT/StudyQuest/pull/67) → [#69](https://github.com/IP-GACHI-UT/StudyQuest/pull/69) → [#71](https://github.com/IP-GACHI-UT/StudyQuest/pull/71)の順。STEP 05の差分基準は`docs/68-step04-release-preparation`。全PRをOpenに保ち、ユーザー確認後にマージする。

- 掲示板の固定アバター・「匿名の学習者が取り組み中」を除去。実APIの今日の受注・今日の達成・累計達成率を表示する。
- 取得の待機・失敗・再試行・空表示を共通部品へ揃え、受注中の連続操作を止める。成功後に受注状態と件数を読み直し、マイクエストへのリンクを表示する。
- APIの今日集計をサーバーのローカル日付から日本時間00:00以上・翌日00:00未満へ変更。OpenAPIも同じ定義にした。
- [beta-metrics.md](../../beta-metrics.md)に指標・観測窓・実験案・読み取り専用の集計コマンドを定義。参加者だけを既存DBで集計し、個別ID・メール・学習本文を出力しない。

他メンバーの[PR #62](https://github.com/IP-GACHI-UT/StudyQuest/pull/62)（`a3a5152`）も比較した。API接続の主目的は前段の認証統合で取り込まれている。localhost直結・数値ID・alertを含む差分を重ねて認証連携へ戻さないよう、今回必要な再試行・仮表示除去を現版へ実装した。元PR・Issue #54は変更していない。

## ローカルの画面・DB確認

所有する復元用PostgreSQL 16のダミーデータで、実セッションから掲示板を操作した。

1. APIを停止して未受注クエストをクリック。受注と取得の失敗が表示され、再試行が現れ、受注ボタンが無効になる。
2. APIを再起動して「再試行」。取得が復帰し、受注ボタンが有効になる。前の受注エラーは新しい受注操作で解消する。
3. 未受注クエストをダブルクリック。受注成功・マイクエストへのリンク・今日の受注1人を表示。DBの受注0→1件、受注活動0→1件、ポイント18→33（報酬15点1回）を確認。
4. ローカルの8件を一時非表示にして空表示を確認し、元の8件を復元。実データ・本番DBは使っていない。
5. PC幅828・スマホ幅390で横あふれなし（文書幅813・375）。スマホの「5分」「45分」が一行で読めることを確認。実スマホ端末の試験ではない。

画像: [PC](step05-board-pc.jpg)、[スマホ](step05-board-mobile.jpg)、[通信失敗](step05-board-failure.jpg)、[受注成功](step05-board-accepted.jpg)、[空表示](step05-board-empty.jpg)。[受注件数の記録](step05-accept-result.json)はダミーの集計値だけを含む。

## 集計の確認

専用ローカル`studyquest_test`を使用。DBテストは参加者指定・登録期間・保存時刻・48時間境界・日本時間D7両端・未成熟の分母・同じ人の複数保存・匿名出力を確認した。

ダミー試験の観測済みケースでは、指定5人中の期間内登録4人、初回受注3人、初回保存3人、48時間内保存1/4人、D7再利用1/2人、D7観測待ち1人。これはfixtureの期待値に一致した結果で、実βの率ではない。観測を早く切るケースと対象0人のケースでは未成熟・空の分母をnullにした。

`pnpm --silent beta:report`も存在しないダミーIDと過去期間で実行し、[CLI出力](step05-cli-empty-result.json)が対象登録0・率nullの匿名JSONになることを確認。不正日付は終了コード1、接続例外や参加者本文を出力しない。

## 所定チェックと未確認

- 成功: `pnpm format:check`、`pnpm check:web`（lint/typecheck/build/biome）、`pnpm check:api`、`pnpm test:api`（13件）、`pnpm test:api:db`（29件）、`pnpm test:e2e`（3件）、`pnpm prisma:validate`、`pnpm prisma:generate`。
- 依存準備は`CI=true pnpm install --frozen-lockfile`。依存バージョン、DB schema・migration・seedは変更していない。
- E2Eの最初の起動は手動Webサーバーの同じ作業ツリーを使用中で失敗。自分の手動サーバーを停止し、再実行で3件成功した。テスト先は安全ガード付き専用DB、SMTPはローカルMailpitだけ。
- 進捗生成・一致、Markdownのローカル参照44件（欠落0）、Git差分を確認。GitHub CIはPRのChecksで対象headと照合する。
- 進捗HTMLは18/42（43%）・無料β18/23（78%）を表示。05.1.2の検索・詳細展開、要判断4件のフィルター、全件への復帰を確認。幅1280/390で横あふれなし（文書幅1265/375）。
- PR #71のhead `6317382df846503a477ab25c4238054d37205ff0`でGitHub CIのquality・web・api-static・api-db・authentication-e2eがすべて成功。これはそのコミットの結果で、外部配置の確認ではない。
- 未確認: 実配置・Functions入口・HTTPS・実proxy・本番SMTP・Google、窓口の外部受信/返信・運営者名称、実参加者・日程・同意・聞き取り、公開承認。

05.1.2は計測定義・ローカル検証・実験案まで完了。05.1.1はSTEP 04の実配置と公開版確認が残るため検証待ち。05.2.1・05.2.2は公開と協力者確認待ちとして保留し、募集・外部登録・メール送信・DNS変更・公開・マージは行っていない。
