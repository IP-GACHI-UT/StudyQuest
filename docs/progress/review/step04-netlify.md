# STEP 04追加確認: Node Functions入口

2026-10-05 / Issue #72 / 実装 `2b729803948c290904333bd2d22530a3c9388592`。PR #71を前提とする追加PR。Openのまま確認を受け、マージしない。

## レビューの順序

1. [配置の正本](../../netlify.md)の経路・環境変数・未確認事項を読む。
2. apps/api/src/lib/netlify-request.tsのIP上書き、Cookie/本文/redirect、no-storeを確認。
3. apps/api/src/lib/auth.tsとapi-runtime.tsのモード分離、Node入口の起動ガード、Origin/CSRFの明示有効化を確認。
4. apps/webのnext.config.tsとserver-auth.ts、netlify.tomlのbuild/Functions経路を確認。
5. 追加の単体/DBテスト、公式bundler、Linux CIの生成物からのDB試験を確認。

API仕様・Presenter・DB schema・migration・seed・画面表示は変更しない。依存追加は公式Functions型と公式bundlerの検証目的。既存のNext.js/Hono/Prisma/Better Authの直接指定版は維持した。lockfileには追加ツールの依存とpeer解決の変更がある。

## ローカル検証

- 成功: format:check、check:web（Functionsモードでlint/typecheck/build/biome）、check:api、test:api 20件、test:api:db 32件、test:e2e 3件、prisma:validate/generate、netlify:bundle。
- DBは専用studyquest_test、E2E SMTPはローカルMailpit。既存のschemaとのdiffはなし。合成fixtureのみ使う。
- 追加単体7件: 本文/query/Origin/Cookie、複数Set-Cookie、IPv6、不正IP3種、モード誤設定とNode起動拒否、immutable headersのredirect。
- 追加DB3件: Secure/HttpOnly/SameSite=Lax、IP記録、保存再送1件・達成/XP/points、利用者分離・期限切れ、フォーム/Cookie付き認証の異なるOrigin拒否、偽装IPを変えても6回目429・別context.ipの独立性。
- CI=true pnpm install --frozen-lockfileを使用。ZIP出力はNFT/API v2/nodejs22.x、Prisma Clientの実体を含む。環境ファイルを依存一覧で拒否する。
- 一時loopbackゲートウェイでhealth 200、Cookieなし保護ページ307→login、有効な既存セッションでSSR 200を確認。クライアント側の読込完了はこの一時ゲートウェイでは確認できず、合格に数えない。実Netlify adapter/pathの試験とは区別する。

Windowsのディレクトリ出力はsymlink権限で失敗し、ZIPへ変更。Windows ZIPにはjunctionの絶対参照があるため、本番へuploadしない。

## GitHub CIと進捗表示

[PR #73](https://github.com/IP-GACHI-UT/StudyQuest/pull/73)はOpen、baseはPR #71のブランチ。head `c1c3a64e96df1b0ac34c48847acbb967aad3b852`で[API](https://github.com/IP-GACHI-UT/StudyQuest/actions/runs/37246733627)、[E2E](https://github.com/IP-GACHI-UT/StudyQuest/actions/runs/37246733681)、[quality](https://github.com/IP-GACHI-UT/StudyQuest/actions/runs/37246733671)、[Web](https://github.com/IP-GACHI-UT/StudyQuest/actions/runs/37246733746)の全5チェックが成功。

API DB jobではLinuxで公式ZIPを生成・展開し、生成済みFunctions入口からhealth 200、Prisma query 200、未認証401を確認した。これはクラウド配置の証明ではない。

進捗HTMLは18/42・無料β18/23を維持。04.1.2検索で1件、Netlify資料の展開、PC幅1280/文書1265・スマホ幅390/文書375で横あふれなしを確認した。

## 残件と状態

04.1.1/04.1.2は外部配置・実HTTPS・実context.ip・DB TLS/pooling・実メール・ログ/利用枠の確認が残るためblockedを維持。入口の実装だけで実配置を完了扱いにせず、全体18/42、無料β18/23は維持する。

運営者、問い合わせ先の外部受信/返信、サービス・ドメイン・公開は確認待ち。外部登録・課金・DNS・本番migration・実メール送信・公開・PRマージは行っていない。
