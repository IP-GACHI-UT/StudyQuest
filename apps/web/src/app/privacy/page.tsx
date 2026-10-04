export default function PrivacyPage() {
  return (
    <article className="prose prose-slate mx-auto max-w-3xl py-8">
      <p className="text-sm font-bold tracking-widest text-blue-600">
        LEGAL DRAFT
      </p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">
        プライバシーポリシー
      </h1>
      <p className="mt-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        この文書は公開準備用の技術ドラフトです。一般公開前に運営者による内容確認が必要です。
      </p>
      <div className="mt-8 space-y-7 leading-7 text-slate-700">
        <section>
          <h2 className="text-xl font-bold text-slate-900">取得する情報</h2>
          <p className="mt-2">
            表示名、メールアドレス、Googleから提供される基本プロフィール、学習記録、クエスト進捗、認証に必要なセッション情報を取得します。パスワードは復元できない形式で保存します。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900">利用目的</h2>
          <p className="mt-2">
            本人確認、サービス提供、学習状況の表示、不正利用防止、問い合わせ対応のために利用します。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900">外部サービス</h2>
          <p className="mt-2">
            Google
            OAuthを本人確認に、Resendをメール配信に利用する場合があります。各サービスには必要最小限の情報だけを送信します。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900">Cookie</h2>
          <p className="mt-2">
            ログイン状態を安全に維持するため、HttpOnlyのセッションCookieを使用します。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900">お問い合わせ</h2>
          <p className="mt-2">
            個人情報に関するお問い合わせは admin@gtowell.dev
            までご連絡ください。
          </p>
        </section>
      </div>
    </article>
  );
}
