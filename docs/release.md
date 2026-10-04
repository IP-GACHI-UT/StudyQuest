# 無料βの配置・費用・公開準備

確認日: 2026-10-05。STEP 04 / Issue #68。**配置先は候補段階。外部登録・DNS変更・本番migration・公開は未実施。** 実配置と公開の承認は別途必要。

## 配置候補

第一候補はNetlify FreeのNext.js + Hono Node Functions、Neon FreeのPostgreSQL、Resend Freeの認証メール。Next.js / Hono / Prisma / PostgreSQLと`/api`を維持する。問い合わせの受信は既存の`gtowell.dev`を使う案。

| 候補 | 公式情報で確認した条件 | StudyQuestで残る確認 |
| --- | --- | --- |
| Netlify Free | 商用利用も対象。現行creditプランは月300 credits、追加購入・自動補充なしの上限。独自ドメイン・SSL対応 | Next.js 16とHonoのFunctions接続、Prisma bundle、Cookie、実URL、接続元IP、Freeのチーム運用 |
| Neon Free | 2026-10-02更新で1GB/プロジェクト、月100 CU-hours/プロジェクト、復元窓6時間 | 地域・TLS・接続数・pooling、Free枠到達時の挙動、バックアップ別保管 |
| Resend Free | 月3,000通・日100通、独自ドメイン3件 | 送信DNS検証、TLS SMTP、確認/再設定メール到達、上限時の再送 |
| 既存ドメイン・メール | ユーザーが`gtowell.dev`を所有。公開MXはGoogle向け。`info@gtowell.dev`は窓口候補 | エイリアス/グループ等の設定、外部受信、返信名義、担当者 |

根拠: [Netlify商用利用](https://www.netlify.com/blog/introducing-netlify-free-plan/)、[現行creditプラン](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)、[Neon更新](https://neon.com/blog/neon-free-plan-1-gb-per-project)、[Resend料金](https://resend.com/pricing)。2024年のNetlify記事の旧容量を費用計算に使わない。Legacy契約なら別に確認する。

Vercel Hobbyは個人の非商用用途の条件があり、チームの事業化を想定した標準候補にしない。[公式条件](https://vercel.com/docs/plans/hobby)。Render Freeは休止・起動待ち、SMTPポート制限、Free DBの30日失効があり採用を保留。[公式制限](https://render.com/docs/free)。

## 現構成との差分・配置試験

現在のHonoはNode HTTPプロセスで起動する。NetlifyへそのままPushするだけでAPIが動くとは扱わない。以下の接続処理は**未実装・未試験**。

1. `apps/api`内のHonoをNode FunctionsのRequest/Responseへ接続する入口を用意する。DB処理・認証・Presenterは既存Honoを使い、Next.jsの`app/api`へ複製しない。[Functions入口](https://docs.netlify.com/build/functions/get-started/)
2. Functionsが`/api/*`を処理する場合は、Next.jsのlocalhost向けrewriteを配置設定で外す。保護レイアウトのAPI接続先を決め、自己rewriteのループを防ぐ。[Next.js対応](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
3. Prisma共有パッケージの生成・bundle、PostgreSQLのTLSと同時接続を検証する。本番へ開発用seedを投入しない。
4. プラットフォームが保証する接続元IPでレート制限する。クライアント指定の`x-forwarded-for`やloopback向け`TRUSTED_PROXY_IPS`を流用しない。
5. HTTPS上で登録→メール確認→受注→保存→達成→週間表示を再確認する。未認証・他人分離・期限切れ・Origin不一致拒否・CookieのSecure/HttpOnly/SameSiteも確認する。

[STEP 03](progress/review/step03.md)のローカル認証・二人分離はFunctionsや実HTTPSの合格ではない。配置先確定前にこの試験を通す。

## 環境変数・ログ

| 設定 | 使用先 | 配置前の確認 |
| --- | --- | --- |
| `APP_ORIGIN` | Hono認証・CORS | 正式なHTTPS origin一つ |
| `API_INTERNAL_URL` | Next.jsサーバー・rewrite | Node構成では非公開Hono接続先。Functions構成では入口に合わせる |
| `API_HOST` / `API_PORT` | Node HTTP入口 | Honoを直接外部公開しない。Functionsには別入口が必要 |
| `DATABASE_URL` | API・Prisma | 秘密。開発・CI・復元・本番を分離、TLS・接続数を確認 |
| `BETTER_AUTH_SECRET` | API認証 | 秘密。32文字以上のランダム値、環境ごとに分離 |
| `TRUSTED_PROXY_IPS` | APIのIP判定 | 信頼proxyだけ。実際の転送経路と一致 |
| `SMTP_*` / `MAIL_FROM` / `MAIL_REPLY_TO` | APIメール | 資格情報は秘密。認証送信元と問い合わせ窓口を分ける |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | APIのみ | Google提供時に設定。未確認なら未提供 |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | Webビルド | 公開してよい真偽値のみ。実OAuth確認まではfalse |

ブラウザーは同一originの`/api/*`を使用。旧`NEXT_PUBLIC_API_URL`・`CORS_ORIGIN`は使わない。秘密値・接続URL・Cookie・認証リンク・パスワード・メール・学習メモをrequest bodyや例外全文としてログへ出さない。監視は操作種別、HTTP status、匿名の相関ID、集計件数に絞り、配置サービス側の自動ログも確認する。

ローカルのブラウザー操作では接続元IPを取得できず、認証レート制限が共有bucketへ退避する警告が出た。E2Eは指定ヘッダーでのIP分離試験で、実proxyが正しいIPを付ける証明ではない。配置試験で解消する残件。

## 費用上限・停止条件（承認用案）

無料βの**新規サービス費用上限は月0円**とする案。所有済みドメインの更新費・既存メール契約費は別の既存費用で金額は未確認。新ドメイン、追加メールユーザー、有料プラン、追加credit、AI、決済は含めない。

Netlify概算は`15 × 本番deploy回数 + 10 × compute GB-hour + 2 × Web要求数/10,000 + 20 × 配信GB`。丸めや他機能は契約画面で確認する。例: 本番4回・compute 2GB-hour・20万要求・2GB配信なら約160 credits、余り140。保証や観測済み利用量ではない。[計算単位](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)

- Free枠のみ使用し、自動有料化・追加購入を承認しない。アカウント内の他プロジェクトの使用量も含める。
- 利用量を週1回、β開始直後は毎日確認する案。80%到達で新規募集・頻繁なdeployを止める。枠超過時は停止を受け入れ、有料化で自動復帰しない。
- DBの復元窓だけへ依存せず、[別保管](backup.md)を行う。保存先・担当・保存費が未決定なら公開ゲートを通さない。
- 公開直前に商用条件・枠・上限時停止・地域・チーム権限を再確認する。外部登録・契約・本番migration・DNS・公開はユーザー確認後。

## ドメイン・窓口

Webは`studyquest.gtowell.dev`、問い合わせは`info@gtowell.dev`、認証メール送信元は`no-reply@mail.gtowell.dev`という案。StudyQuest専用ドメインの追加取得はβの必須条件にしない。

ユーザーの説明では`info@`は既存5アカウントのいずれかへ配送する機能で、専用受信箱とは未確認。エイリアスなら既存ユーザーの受信箱、グループならメンバーへ配送する形で窓口を構成できる。[Googleエイリアス](https://support.google.com/a/answer/33327)、[グループの外部投稿](https://knowledge.workspace.google.com/admin/groups/set-organization-wide-policies-for-using-groups)

外部送信者→担当受信箱→`info@`名義の返信を公開前に確認する。問い合わせ履歴は担当者に限定。既存Google向けMXは変更せず、アプリ送信のDNS検証は専用サブドメインで検討する。[返信設定](https://support.google.com/mail/answer/22370?hl=ja)

## 公開前に残る決定

- 実配置、Functions入口・API経路、HTTPS・DB・proxyの確認
- 公開運営者の表示名称、問い合わせ担当、`info@`の受信・返信
- 認証メールのサービス・送信元とDNS検証、必要ならGoogle OAuth
- バックアップ保管先・周期・担当者・復元訓練
- [案内原稿](beta-notice.md)、Privacy/Terms、無料βゲートの運営者確認

画像と検証範囲は[STEP 04確認記録](progress/review/step04.md)。
