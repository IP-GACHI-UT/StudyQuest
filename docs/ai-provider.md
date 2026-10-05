# STEP 06: AI候補・入力条件・原価試算の案

2026-10-05確認。Issue [#76](https://github.com/IP-GACHI-UT/StudyQuest/issues/76)。[生成・採用契約案](ai-quests.md)を前提に、接続前の判断材料を整理する。事業者・分野・回数・費用・保持期間は未承認。外部アカウント作成、支払い、API送信、アプリのAI実装は行わない。

[MVP](mvp.md)の無料βにはAIを含めない。無料βの価値・需要の実測と提供判断を待ち、条件が確定したら別の実装Issueを作る。06.2.1は候補調査と提案まで進めるが、完了条件の「決定」は満たしていない。

## 候補と料金の確認

料金はUSD / 100万token、テキストの通常有料処理。無料枠、Batch、Flex、Priority、特別契約は試算へ混ぜない。

| 候補 | 通常入力 | cache読取 | cache書込 | 出力 | 現時点の判断材料 |
| --- | ---: | ---: | ---: | ---: | --- |
| OpenAI `gpt-6-luna` | 0.10 | 0.01 | 0.125 | 0.50 | 構造化出力対応。原価とAPIデータ条件から最初の評価候補に提案 |
| Google `gemini-3.5-flash-lite` | 0.30 | 0.03 | この比較では使用しない | 2.50 | 構造化出力対応。有料APIのデータ条件・年齢条件を確認してから評価 |

OpenAIの価格・構造化出力対応は[モデル文書](https://developers.openai.com/api/docs/models/gpt-6-luna)、Googleは[通常有料料金](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite)と[モデル文書](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite)による。Googleの出力料金はthinkingも含む。明示cacheの保管料金はこの案では発生させず、試算にも含めない。

OpenAIのcache書込tokenは通常入力・cache読取と重複加算しない。公式の課金式では入力を3区分へ分ける。試算ではcache命中を期待せず、全入力を最大の0.125で予約する。[Prompt Caching](https://developers.openai.com/api/docs/guides/prompt-caching)

旧`gpt-5.4-nano`は2026-10-01に非推奨となり、2027-04-01終了予定のため新規候補に採用しない。[廃止予定](https://developers.openai.com/api/docs/deprecations)

`gpt-6-luna`の文書に日付付きsnapshotは掲載されていない。利用可能な固定版・アカウントの利用資格・最低入金・請求条件・実際の生成品質は未確認。価格やmodelが不明なまま接続したり、別modelへ自動切替したりしない。両候補の比較は採用決定を意味しない。

## 送信・保存条件

| 項目 | OpenAI API | Gemini API |
| --- | --- | --- |
| 入出力の製品改善利用 | APIは明示opt-inしない限り学習に使わない | 有料サービスは製品改善に使わない。無料サービスでは利用され、人による確認もあり得る |
| provider側の記録 | 通常の不正利用監視は最大30日が基本。ただし法令・安全上の例外あり。Responsesの通常保存は別に扱う | 不正利用監視のため一定期間記録する。参照文書に固定日数は示されていない |
| cache | 暗号化した中間表現を最大24時間保持する場合がある | 暗黙cacheはproject内で分離したメモリで最大24時間。明示cacheはこの案では使用しない |
| この案で残す条件 | `store:false`を前提にするが、保持ゼロとは説明しない。Zero Data Retentionには別の適格性・承認条件がある | APIの有料条件は有効なCloud Billing projectを必要とする。Workspaceの契約だけでGemini APIが有料扱いになるとは限らない |

根拠は[OpenAIのデータ管理](https://developers.openai.com/api/docs/guides/your-data)、[Gemini API利用条件](https://ai.google.dev/gemini-api/terms)、[Geminiの保持データ](https://ai.google.dev/gemini-api/docs/zdr)。日本からの通常利用の比較で、地域別例外や個別契約をこのプロジェクトへ自動適用しない。

Gemini APIの利用条件には18歳以上、および18歳未満を対象とする／利用される可能性が高いアプリへの制限がある。StudyQuestの対象年齢と現在の導線を確認してから候補の適合性を判断する。無料Gemini APIに個人情報や機密・センシティブな入力を送る案は採用しない。有料も本人の同意・送信条件の確認前には接続しない。

送信は分野・目標・期限・使える時間と固定の生成指示/出力schemaに限定する。requestIdはStudyQuest内で管理し、providerへ本人ID・メール・Cookie・学習履歴・入力したメモを送らない。目標欄に個人情報を入力しない案内を表示し、同意しない人も基本クエストを使える設計とする。外部検索、Files、会話保存、background処理、外部ツールはこの小規模試験へ追加しない。

Responsesの保存を止める場合、失敗時にproviderの保存応答を必ず再取得できるとは限らない。StudyQuestのGETは自分のDB状態を返し、providerの結果照合ができない状態はunknownのまま予約を維持する。新しい生成を自動で再実行しない。

運営側の保持期間も提案段階とする。小規模試験終了後14日で未採用の生成入力・案を削除し、採用済みQuest/学習ログは既存の本人データとして扱う案。二重呼び出し防止の最小記録（requestId、結果状態、要求ハッシュ、費用予約）は90日保持する案。ハッシュは匿名化の保証として扱わない。保持終了後の古いキーを拒否する条件、退会/本人削除、バックアップからの削除反映を実装前に確定する。providerの保持期間をStudyQuest側だけで短縮できるとは案内しない。

この原稿を公開中のprivacy/termsへ適用していない。事業者と条件の確定後、運営者・問い合わせ窓口の確認と合わせて送信先・目的・保持・削除・同意撤回の説明を更新する。

## 小規模試験の上限案

| 項目 | 未承認の提案 |
| --- | --- |
| 対象・期間 | 10人、14日。対象分野は回答待ち |
| 1人の回数 | JSTで1日2回、同じrequestIdの再送は追加生成しない |
| 全体の回数 | 利用者最大280回 + 内部の合成入力20回 = 300回 |
| 1回の入力 | 指示・schema・目標を含む全入力3,000token以内 |
| 1回の出力 | thinking/reasoningを含む全課金対象の出力1,500token以内 |
| token予算 | 試験全体2 USD、月3 USD。支払い・入金の許可ではない |
| timeout | 15秒を仮置き。実配置の実行時間と実応答を見て確定 |

出力の表示文字数だけを課金token上限として使わない。各providerで全課金対象の上限を強制できること、usageの読み方・欠損時の扱いを実装Issueで確認する。確認できないmodelには接続しない。生成品質、応答時間、1〜3案がこの上限で収まるかは未検証。上限を変更したら料金表と試算を再確認する。

DBで本人の日次枠・全体の回数・費用予約・同じ要求の実行権を一つのtransactionで確保する。Functionsの別instanceでも同じ上限を共有し、日付が変わった再送は初回の予約日のまま扱う。provider送信前の入力エラーは消費しない。送信開始後の失敗・不正出力・unknownは回数と最大原価を確保したままにし、実請求を照合できた範囲で精算する。不明なtoken/原価はnullで残し、0に置換しない。SDKの自動再試行は無効にし、利用者の新規操作も残枠とunknown状態を検査する。

予算不足・model/料金不明・設定欠落・provider停止・未精算のunknownがある場合は、新規provider呼び出しを止める。既存の採用Questと通常の学習導線は使用できる設計とする。管理画面で原価上限を実装しても、provider側の支払停止保証にはならない。アカウント側の請求条件と停止方法は別途確認する。

## 接続不要の試算CLI

[ai-pricing.json](ai-pricing.json)は確認日の通常有料料金を記録した比較専用snapshot。`selectedProvider:null`を維持する。追加したCLIはNode標準機能でローカルJSONを読み、整数のmicro USDで上方丸めする。APIキー・SDK・DB・ネットワークを使用しない。

```powershell
pnpm ai:estimate
pnpm ai:estimate --input-tokens 3000 --output-tokens 1500 --requests 300 --budget-usd 2 --yen-per-usd 160
pnpm test:ai-estimate
```

既定の300回、為替160円/USDという仮定での結果:

| 候補 | 1回の予約額 USD | 300回 USD | 円換算（仮定） |
| --- | ---: | ---: | ---: |
| OpenAI | 0.001125 | 0.337500 | 54.00 |
| Google | 0.004650 | 1.395000 | 223.20 |

税・為替手数料・最低入金・外部ツール・明示cache保管などを含まないtoken分の試算であり、実請求や提供の採算を示すものではない。現在の実為替を取得しない。予算内の最大回数も、このtoken数の仮定での算術結果で、回数上限案を増やす許可ではない。

異常な引数・無料/Batchプロフィールを拒否し、エラーに入力値や秘密値を出さない。CLIの成功をAI生成、実usage、timeout・同時実行制限の成功として扱わない。

## 品質を確認する次の段階

接続の条件が揃ってから、選択した分野の合成入力20件を用意する。入力の例・期待する行動・時間を人が事前に定義し、通常・曖昧・時間不足・期限境界・命令混入を含める。完全に検証可能なJSONが19/20件以上であることを暫定の最低条件に提案し、実行可能な内容・予算時間の一致・不要な個人情報や危険な指示がないことは人が確認する。少数標本の合格率を継続利用や学習効果の証明へ読み替えない。

[構造化出力](https://developers.openai.com/api/docs/guides/structured-outputs)にも対応するschemaの範囲がある。JSON形式の適合に加えて、契約の文字数・合計時間・所有者・編集採用をサーバーで検査する。schemaに利用者の本文を埋め込まない。現時点で合成入力の実送信・品質採点はしていない。

## 接続前に残る判断

- 無料βの結果とAIを提供する判断、対象分野。
- 事業者・model、アカウントの利用条件と年齢条件、送信先・同意・保持/削除期間。
- 回数・token/費用・timeoutの上限と、別途必要な請求条件の確認。
- provider上限の強制、実usage/費用・unknown照合、本人分離・同時実行・生成から学習までの検証。

対象版と検証結果は[今回の記録](progress/review/step06-provider.md)で確認する。承認前に登録・課金・公開・実接続へ進めない。PRはOpenのままレビューを待つ。
