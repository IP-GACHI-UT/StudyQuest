# STEP 06: 生成・採用契約の設計準備

2026-10-05。Issue [#74](https://github.com/IP-GACHI-UT/StudyQuest/issues/74)。PR #73の`693a3de`を基に、設計用ブランチ`docs/74-step06-quest-contract`を作成。

## レビュー順

1. [ai-quests.md](../../ai-quests.md)の今日の入力・案・編集採用の範囲を確認。
2. [OpenAPI](../../api/openapi.yaml)の`AiQuests`タグ3操作はすべてplanned。現行アプリのAPI一覧と区別。
3. 個人用QuestのownerId、共通一覧/掲示板からの除外、再送とtransaction、既存学習保存との接続を確認。
4. 対象分野・事業者・入力データの扱い・保持期間・上限・報酬の提案を確認。無料βの結果と提供判断を待つ。

## 変更範囲

- 生成の5入力、1〜3件の出力、1件ずつの編集採用と本人限定取得を設計。
- 成功・実行中・失敗・結果不明を区別し、timeoutや同じ要求の再送で二重呼び出ししない契約を追加。
- Prisma変更案と、個人用データが共通APIへ漏れないための修正・検証条件を整理。
- 進捗表06.1.1を設計ありの検証待ちへ更新。対象分野が未選択なので完了数は18/42・無料β18/23を維持。
- 進捗表の検証待ちの説明を、設計準備も実装済みと誤解されない表現に更新。

## 検証

対象は`693a3de`を基にした今回の設計差分。API動作の合格とは区別する。

| 確認 | 結果 |
| --- | --- |
| `pnpm install --offline --frozen-lockfile`（CI=true） | 706パッケージを既存cacheから導入。依存版・lockfileは変更なし |
| `pnpm prisma:generate` | 既存schemaからClient生成成功。DBへの接続・migrationは行わない |
| `pnpm format:check` / `pnpm check:web` | format・lint・型・build・Biomeすべて成功 |
| `node --check scripts/progress.mjs` / `git diff --check` | 成功。最初の差分検査で検出したYAMLの末尾空白1箇所を修正して再確認 |
| OpenAPIの形式・参照 | js-yaml 4.2.0とAjv 6.15.0を使う一時ローカル検査で、[公式OpenAPI 3.0スキーマ](https://spec.openapis.org/oas/3.0/schema/2024-10-18.html)に適合。内部参照97件解決、既存19パス・既存schemaの内容を保持、追加3操作はplanned/要認証 |
| 契約用サンプルと境界 | 生成入力・provider出力・編集採用の3例、文字数/時間/日付/UUID/未知項目等21ケースをschemaで検査し成功 |
| Markdown参照 | 変更した文書のローカルリンク43件、欠落0 |

公式スキーマの取得版SHA-256は`2385f5bbb8c37878daae73baeabe7f34b2f022a4a8c049329ee61f71796f039c`。`.local/verify-ai-contract.cjs`は検査補助で、アプリの実装・依存・CIに追加しない。合計時間、trim後の検査、相対JST期限、選択分野、本人所有権・providerの副作用はschemaだけでは証明できず、後続実装の検証条件に残す。

`pnpm progress:build` / `pnpm progress:check`も成功。10 STEP・42小項目・完了18、無料β18/23。PC 1280px（document幅1265px）・スマホ390px（375px）でページ全体の横はみ出しなし。06.1.1の開閉、E18への移動、契約本文の同梱、スマホでの検索/検証待ちフィルター（1件）、長いplanned APIの表示を確認。表示サイズと検索を元に戻した。

新APIの動作を確認する画面試験ではなく、進捗表の表示・操作確認。PR/CI結果は確認後に追記する。

## 未確認・未実施

APIルート・Presenter・Prisma schema・migration・seed・アプリ画面・依存版は変更しない。新契約は実装されていないため、生成・採用の実DB/実AI/画面導線は未検証。無料βの公開・実観測も未実施。外部サービスの登録・課金・設定変更・サイト公開・マージは行わない。

人が書いたJSON例を生成実績にしない。完了率は設計案の追加で加点しない。既存のユーザー変更は元の作業ツリーに保持する。
