# Netlify候補のNode Functions入口

2026-10-05 / Issue #72。ローカル準備とCI用の設定。**外部登録・接続・DNS・公開は未実施。** 実配置の合格は[release.md](release.md)で別に判断する。

## 経路と環境変数

`apps/api/functions/studyquest-api.mts`が`/api`と`/api/*`を受け、`apps/api/src/netlify.ts`から既存Honoの`app.fetch`へ渡す。認証・DB・PresenterをNext.jsへ移さず、本文、query、Origin、Cookie、別々のSet-Cookieを維持する。[Functions API](https://docs.netlify.com/build/functions/api/)、[path設定](https://docs.netlify.com/build/functions/configuration/)

`netlify.toml`はルート基準でPrisma生成→DB/API build→Web buildを行い、`apps/web/.next`と`apps/api/functions`を対象とする。Next.jsは自動のOpenNext adapterを想定し、固定追加していない。[Next.js対応](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)

HonoのNetlifyガイドはDeno Edge Functionsを説明する。この候補はPrisma/pgを使うNode Functionsで、Edge用入口は使わない。[Honoガイド](https://hono.dev/docs/getting-started/netlify)

| 設定 | ローカルNode | Netlify候補 |
| --- | --- | --- |
| `STUDYQUEST_API_RUNTIME` | node（既定） | **buildとFunctions実行時の両方でnetlify** |
| `APP_ORIGIN` | Webのorigin | 正式なHTTPS origin。build/実行時で同じ値、末尾`/`やpathなし |
| `API_INTERNAL_URL` | 内部Hono URL | 未使用。サーバー認証はAPP_ORIGINへ接続 |
| `TRUSTED_PROXY_IPS` | 信頼proxyのみ。本番Nodeでは必須 | 未使用。context.ipを使用 |
| DB・認証secret・SMTP | ローカルの秘密設定 | release.mdの分離・秘密管理・送信確認に従う |

**`[build.environment]`だけではFunctions実行時へ値が供給されない。** 管理画面/API/CLIで適切なscopeへ設定する必要がある。今回その外部設定は実施していない。[Functions環境変数](https://docs.netlify.com/build/functions/environment-variables/)

Webはnetlify時にlocalhost rewriteを外し、ブラウザーの`/api/*`をFunctionsへ渡す。保護レイアウトは固定の`APP_ORIGIN/api/auth/get-session`へ接続し、Hostや転送ヘッダーから接続先を作らない。Nodeモードのrewriteは従来どおり。

## IP・認証・キャッシュ

入口はcontext.ipをIPv4/IPv6として検証し、利用者のforwarded/x-forwarded-for/x-real-ipを削除、x-studyquest-client-ipを上書きする。Better Authはnetlify時にこの一つの内部ヘッダーだけを使う。IP不明なら503で止め、共有bucketへ進めない。

通常Node入口はnetlifyモードで、Functions入口はnodeモードで起動できない。Nodeへ内部ヘッダーを送ってもIP判定には使わない。app.tsを独自の外部HTTP入口から公開しない。

Functions応答に`Cache-Control: private, no-store`と`Netlify-CDN-Cache-Control: no-store`を付ける。Cookie、本文、パスワード、個別IPを追加ログへ出さない。既存のDB保存型レート制限とSecure/HttpOnly/SameSite=Lax Cookieを維持する。

サーバー認証の自己HTTP要求はサーバー側IPになる可能性がある。実配置でget-sessionの応答時間・共有レート枠・二重ホップを観測する。合成context入力だけで実クライアントIPを実証済みと扱わない。

## 生成とローカル検証

```bash
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm build:api
pnpm netlify:bundle
pnpm test:api
pnpm test:api:db
```

netlify:bundleは公式`@netlify/zip-it-and-ship-it` 16.2.3で`.local/netlify-functions/studyquest-api.zip`を生成するだけ。型確認は`@netlify/functions` 6.0.2。両者はNode >=22.12.0が必要。Functionの.mts入口もAPI typecheck対象。

netlify.tomlと生成スクリプトのFunctions設定は一緒に更新する。esbuild指定でも、この版はRequest/Response API v2にNFTを選ぶ。[公式実装](https://github.com/netlify/build/blob/main/packages/zip-it-and-ship-it/src/runtimes/node/bundlers/index.ts)。Prisma生成先をincluded_filesへ含める。環境ファイルが依存一覧に現れたら生成を失敗させ、成果物を公開・共有しない。

Windowsのディレクトリ形式はsymlink権限で失敗したためZIP形式に変更した。pnpm junctionがZIP内で絶対参照になる場合があるため、**WindowsのZIPを本番へuploadしない。** Linux CIでZIPを展開し、生成済み入口から専用テストDBへ接続してhealth/Prisma query/未認証拒否を確認する。実buildもLinuxを想定する。

DBテストは既存の専用studyquest_test（loopback:5433）の合成ユーザーのみ作成・削除する。schema/seedは変更しない。追加3件はSecure Cookie・セッションIP・一回保存・達成・利用者分離・期限切れ、フォームとCookie付き認証JSONのOrigin拒否、偽装IPヘッダーを変えても6回目429になることと別context.ipの独立性を確認する。

## 実配置の残件

外部サービス・利用枠・運営者・連絡先・公開判断、adapterとcustom pathの優先順位、正式HTTPS、登録/再設定メールと学習導線、実context.ip/SSR/レート枠、DBのTLS/pooling/地域/同時接続/cold start、ログ・停止条件・別保管バックアップを確認する。

ローカル合格はNeon接続、Resend送信、Netlify配置の合格ではない。[STEP 04追加検証](progress/review/step04-netlify.md)に根拠を記録する。
