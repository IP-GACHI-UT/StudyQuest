# 認証設計と運用手順

## 構成

StudyQuestはBetter AuthをHonoの`/api/auth/*`へ統合し、Prisma/PostgreSQLへUser、Account、Session、Verification、RateLimitを保存します。Next.jsは認証APIを持たず、ブラウザからの`/api/*`をHonoへrewriteします。

- 公開: `/`、`/quests`、`GET /api/quests`、`GET /api/health`、`/api/auth/*`
- 認証必須: `/dashboard`、`/board`、`/my-quest`、`/study/{questId}`、クエスト受注、プロフィール、学習記録GET/POST、週間集計、活動ログ
- proxyはsession Cookieの存在だけを確認します。sessionの有効性は保護レイアウトとHono APIの両方でDB照合します。
- ユーザー別APIは、リクエスト本文や固定値ではなくsessionのUser IDだけを使用します。

## ローカルセットアップ

`.env.example`を`.env`へコピーし、`BETTER_AUTH_SECRET`を32文字以上のランダム値へ変更します。その後、PostgreSQLとMailpitを起動します。

```bash
docker compose up -d db mailpit
pnpm prisma:generate
pnpm prisma migrate dev
pnpm db:seed
pnpm dev:api
pnpm dev:web
```

Mailpitの確認画面は`http://localhost:8025`です。メール確認とパスワード再設定のリンクはここで取得できます。

## Google OAuth Testing設定

実サービスへの登録・設定・動作確認は未実施です。以下は運営者の承認後に行う設定案です。Googleのボタンは既定で「準備中」とし、APIの資格情報設定と確認後にWebの `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` をビルド時に指定して有効化します。Client secretはAPI側だけに設定します。

1. Google Cloudでプロジェクトを作成し、OAuth同意画面のAudienceをExternalにします。
2. アプリ名をStudyQuest、サポートメールを管理可能なアドレスに設定します。
3. TestingモードのTest usersへ動作確認用Googleアカウントを追加します。
4. Web applicationのOAuth clientを作成します。
5. Authorized redirect URIへ`http://localhost:3000/api/auth/callback/google`を登録します。
6. Client IDとClient secretを`.env`の`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`へ設定します。

スコープは`openid email profile`だけを使用します。Googleとメール認証で確認済みの同一メールが使われた場合だけ、同じUserへAccountをリンクします。

## 本番メール

本番の候補はNodemailerからResend SMTPを使用する構成です。送信元ドメイン、返信先、サービス選定は運営者の確認待ちで、外部登録・DNS変更・本番送信は実施していません。次の値は設定案です。

- `SMTP_HOST`: `smtp.resend.com`
- `SMTP_PORT`: Resendが案内するTLSポート
- `SMTP_SECURE`: 利用ポートに合わせた値
- `SMTP_USER`: Resendが案内するSMTPユーザー
- `SMTP_PASSWORD`: Resend API key。Gitへ保存しない
- `MAIL_FROM`: `StudyQuest <no-reply@mail.gtowell.dev>`
- `MAIL_REPLY_TO`: `admin@gtowell.dev`

DNS検証、本番URL、Privacy Policy、Terms、Googleブランド情報が確定するまでGoogle OAuthをProductionへ切り替えません。

## セキュリティ上の決定

- パスワードは15～128文字。文字種の組み合わせは強制しません。
- Better Auth標準のscryptとHave I Been Pwnedチェックを使用します。
- メール確認と再設定トークンは1時間有効です。再設定トークンは一度だけ使用でき、成功後は全sessionを失効します。
- DB sessionは7日有効で、利用中は1日ごとに期限を更新します。
- CookieはHttpOnly、SameSite=Lax、Path=/とし、本番ではSecureを有効にします。
- 認証APIはDBベースでレート制限します。登録・ログインは5回/15分/IP、再設定・確認メール再送は3回/15分/IPです。
- OAuth tokenはDB保存前に暗号化します。
- `next`やcallback URLは信頼済みオリジン内のパスだけを許可します。
- HonoはNext.jsなどの既知のreverse proxyからだけ到達できる構成とし、`TRUSTED_PROXY_IPS`へそのproxyのIPまたはCIDRを設定します。転送されたIPはsession記録とレート制限に使用します。

## 公開前チェックリスト

- [ ] 本番の`APP_ORIGIN`と`API_INTERNAL_URL`を設定した
- [ ] `BETTER_AUTH_SECRET`を安全なランダム値にした
- [ ] Honoを外部へ直接公開せず、`TRUSTED_PROXY_IPS`へreverse proxyだけを設定した
- [ ] `mail.gtowell.dev`のDNS検証が完了した
- [ ] Resend SMTPから確認・再設定メールを受信できた
- [ ] 本番OAuth redirect URIをGoogle Cloudへ追加した
- [ ] Privacy PolicyとTermsを運営者が確認した
- [ ] Google Testingユーザーで登録、同一メールリンク、ログアウトを確認した
- [ ] 認証E2EとAPI DBテストが成功した

## 自動検証

`pnpm test:api:db` は専用ローカル `studyquest_test` DBで実セッションとデータ分離を検証します。`pnpm test:e2e` は同DBとローカルMailpit（SMTP 1025、確認画面8025）が必要です。ローカルDBは5433、CIは5432を使い、DB名・テスト資格情報・接続先のガードで他のDBへの実行を拒否します。Web/APIの既存サーバーは再利用しません。

E2Eではメール登録・メール確認・ログイン・ログアウト・再設定・レート制限に加え、分離した二つのブラウザー環境で本人だけの記録と、学習保存時の期限切れ→別タブ再ログイン→同じ入力の再送を確認します。実Google OAuth、本番SMTP、実端末、本番配置はこの検証に含みません。

## 対象外

今回、MFA、パスキー、メール変更、連携解除、退会、ログイン中のパスワード変更は実装しません。
