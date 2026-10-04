export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl py-8">
      <p className="text-sm font-bold tracking-widest text-blue-600">
        LEGAL DRAFT
      </p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">利用規約</h1>
      <p className="mt-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        この文書は公開準備用の技術ドラフトです。一般公開前に運営者による内容確認が必要です。
      </p>
      <div className="mt-8 space-y-7 leading-7 text-slate-700">
        <section>
          <h2 className="text-xl font-bold text-slate-900">サービスの利用</h2>
          <p className="mt-2">
            利用者は、本規約と適用法令を守り、StudyQuestを個人の学習支援目的で利用するものとします。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900">アカウント管理</h2>
          <p className="mt-2">
            利用者は登録情報とログイン手段を適切に管理し、不正利用に気づいた場合は速やかに運営者へ連絡してください。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900">禁止事項</h2>
          <p className="mt-2">
            不正アクセス、他者へのなりすまし、サービス運営を妨害する行為、法令または公序良俗に反する行為を禁止します。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900">サービスの変更</h2>
          <p className="mt-2">
            保守や改善のため、事前の予告をもってサービス内容を変更または停止する場合があります。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900">お問い合わせ</h2>
          <p className="mt-2">
            本規約に関するお問い合わせは admin@gtowell.dev までご連絡ください。
          </p>
        </section>
      </div>
    </article>
  );
}
