# STEP 06: AI候補条件とオフライン原価試算

2026-10-05。Issue [#76](https://github.com/IP-GACHI-UT/StudyQuest/issues/76)。PR #75の`9e7ca46`を基に、専用ブランチ`chore/76-ai-provider-estimate`で準備した。

## レビュー順

1. [候補と入力条件](../../ai-provider.md)で通常有料料金、データ利用・保持、年齢条件を確認。
2. 未承認の回数/token/費用/timeout案と、接続前の判断事項を確認。
3. [料金snapshot](../../ai-pricing.json)と[CLI](../../../scripts/ai-cost-estimate.mjs)で、整数予約・cache課金区分・丸めを確認。
4. [テスト](../../../scripts/ai-cost-estimate.test.mjs)とCIで試算の検証範囲を確認。

## 検証

試算実装の対象版は`888a3bef84a02c712c04271f7303dc045b498a94`。新規依存・lockfile変更なし。

| 確認 | 結果 |
| --- | --- |
| `pnpm install --offline --frozen-lockfile`（CI=true） | cache内の706パッケージを使用 |
| `pnpm test:ai-estimate` | Node標準テスト11件成功。手計算した通常有料原価、cache書込の最大単価、micro USD/円の切上げ、1 micro USDの予算境界、引数拒否、別cwd・キーなしの起動、エラーへの値の非出力 |
| `pnpm ai:estimate` | 3,000入力/1,500全課金出力/300回/160円という仮定でOpenAI 0.337500 USD=54円、Google 1.395000 USD=223.20円。未選択・未承認を出力 |
| `pnpm prisma:generate` | 既存schemaから生成。初回はDATABASE_URL未設定で失敗。仮のローカルURLを指定して再実行成功、DB接続なし |
| `pnpm check:web` | lint・型・build・Biome成功 |
| `pnpm format:check` / `pnpm biome:check` / `git diff --check` | 成功。JSON/JSはLF・2スペースで整形 |
| `node --check` | 試算CLI・進捗生成スクリプトの構文確認成功 |
| Markdown参照 | 変更7文書のローカルリンク54件、欠落0 |
| `pnpm progress:build` / `pnpm progress:check` | 10 STEP・42小項目・完了18、無料β18/23。正本と生成HTML一致 |
| 進捗表の表示・操作 | PC 1280px（document 1265px）、スマホ390px（375px）で全体の横はみ出しなし。06.2.1の検索1件・開閉・E20への移動・候補本文同梱・保留フィルター1件を確認。サイズと検索/フィルターを元に戻した |

料金snapshotの出典と確認日は[候補文書](../../ai-provider.md)とJSONに記録する。接続・支払いの確認や実AIの成功を意味しない。

進捗表の06.2.1は事業者・条件・上限の判断待ちを維持。対象分野未決定の06.1.1も維持する。完了数は18/42、無料βは18/23。PR CIの結果は確認後に追記する。表示確認は進捗表の確認で、AIアプリ導線の検証ではない。

## 未実施と残る条件

AI接続、実品質/使用量、生成・採用APIとDB、アプリ画面、回数/原価制限の本番動作は未実施。試算CLIは費用制限の実装ではない。既存API/認証のCIも新AIの動作証拠として扱わない。

無料βの公開・実観測、対象分野、事業者・送信条件・同意/保持・上限・請求条件は確認待ち。外部サービスの登録・設定変更・支払い・公開・マージは行わない。
