# 進捗表・ロードマップの確認結果

2026-10-04。対象: `docs/roadmap-progress`の今回の作業差分。アプリの基準版は`8600867`。アプリ画面、API、Prisma、認証、依存バージョンは変更していない。

## 成功した確認

- `pnpm progress:build` / `pnpm progress:check`: 10 STEP、15中項目、42小項目、完了4。無料βまで4/23、全体4/42。完了は静的棚卸しの範囲。
- `pnpm exec biome check scripts/progress.mjs docs/progress package.json`: 変更範囲の検査成功。テンプレートも標準HTMLとして解析可能。
- `node --check scripts/progress.mjs` / `node --check docs/progress/client.js`: 構文確認成功。
- `git diff --check`、Markdownのローカル参照28件の存在確認: 成功。
- `pnpm check:web`内の`pnpm lint:web`: 成功。
- ブラウザ: 1440px、390px、320pxの表示。スマホ幅でページ全体の横はみ出しなし（工程ナビは内部で横スクロール）。
- タスク検索、0件時の解除、状態別件数、完了/検証待ちフィルター、全展開/全折りたたみ、工程移動、根拠への移動、5タブ、画面/API検索を確認。
- Tabで検索から展開操作へ移り、Enterで10工程・42小項目を展開できることを確認。ブラウザのerror/warnログなし。
- ローカルサーバーのGET/HEAD成功、他ファイルへの404、POSTへの405を確認。環境ファイルを公開しない。

画像: [PC](desktop.png)、[スマホの先頭](mobile.png)、[スマホのタスク](mobile-tasks.png)。添付の`latest.html`をブラウザ表示して配色・配置を比較した。

## 失敗・未実施

| 確認 | 結果と理由 |
| --- | --- |
| `pnpm format:check` / `pnpm biome:check` | 既存の未追跡`test-results/.last-run.json`末尾改行で失敗。依頼外の生成物は編集していない |
| `pnpm check:web`の型検査 | 既存`.next/dev/types/validator.ts`等に、現在のソースにない認証画面やlayoutへの参照が残り失敗 |
| `pnpm build:web` | コードのコンパイルは成功。続く型検査で既存`.next/dev/types`のLayoutRoutesと現版の生成型が一致せず失敗。Webビルド成功とは扱わない |
| APIテスト・実DB・seed・migration | API/DB変更がないため未実施。棚卸しを実DBの合格として扱わない |
| 人による読み上げ・実スマホ端末 | 未実施。ブラウザのサイズ変更とキーボード確認の範囲 |
| HTMLファイルの直接ブラウザ表示 | ブラウザツールのURL規則がfile:を許可しないため未実施。許可されたローカルHTTP表示と、CSS/JS/データ/文書を1ファイルへ埋め込む生成整合を確認 |

進捗表の生成・表示はアプリのビルドやDBを必要としない。上記の失敗は全体の検証結果に残し、今回の進捗表の検査結果と分ける。

## 保持した既存変更

開始時からあったAGENTS.md、README.mdのContext案内、未追跡のdocs/verification.md、test-resultsを保持。今回のREADME追加は進捗入口の案内のみ。2026-10-04の作成時点ではコミット・Push・PR・マージは未実施。

## 2026-10-05のPR準備

ユーザーの依頼により、ロードマップ・進捗表を作業基準としてdevelopへ反映する文書PRを準備。実装作業は開始していない。

- 既存のAGENTS.md変更、READMEのContext案内、docs/verification.md、test-resultsはPRへ含めない。READMEは進捗入口の追加だけを対象にする。
- 検証規約へのリンクはリポジトリに存在するAGENTS.mdへ向け、未追跡のdocs/verification.mdへの依存を解消した。
- アプリの基準版は最新のorigin/developと同じ8600867。記録済みの実装状態と小項目の完了率は変更していない。
- PRのChecksでquality・web・apiの結果を確認する。2026-10-04のローカル検証結果は上記のとおりで、CIの結果とは分けて扱う。

## STEP 02の実装と検証（2026-10-05）

[STEP 02確認記録](step02.md)に手順とPC・モバイルの画像を保存。対象版13792d4の専用ブランチで、Web/APIチェック、API単体12件、実DB18件と保存失敗からの復帰を確認。進捗表のSTEP 02はこのローカル範囲で根拠ありとし、PR未マージ・本認証・本番配置は区別する。初期の棚卸しと上記の過去の失敗記録は履歴として保持する。

## STEP 03の認証統合と検証（2026-10-05）

[STEP 03確認記録](step03.md)に既存PR #55〜#60の取り込み元、レビュー順、手順と画像を保存。対象版b9d3ca8でWeb/API/Prismaチェック、単体13件、実DB24件、認証E2E3件が成功。本人のデータ分離、偽のuserIdの無視、期限切れでの拒否、別タブ再ログイン後の保存復帰を確認した。Google・本番メール・実端末・配置は未確認で、マージと公開は別のゲートとして残す。

## STEP 04の公開準備と復元（2026-10-05）

[STEP 04確認記録](step04.md)に配置候補・費用上限・公開原稿と別DB復元の結果を保存。STEP 03のe16f03eを基に専用ローカルDBのダミーデータを別の空DBへ復元し、ログ・進行・活動・XP/pointsの一致と復元後の画面を確認。アプリコードは未変更。04.1.3はローカル復元と運用案、04.1.4は確認用原稿まで揃えた。実配置・HTTPS・メール窓口・運営者確認・本番運用は残件で、STEP 04全体は未完了。
