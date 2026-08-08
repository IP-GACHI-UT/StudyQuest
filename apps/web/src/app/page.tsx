import { ArrowRight, CheckCircle2, Compass, Flame, Trophy } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Compass,
    title: '小さく始められる',
    description:
      'いまの時間と気分に合う学習クエストを選んで、すぐに一歩を踏み出せます。',
  },
  {
    icon: Flame,
    title: '続けた実感が見える',
    description:
      '学習時間や連続記録を可視化し、積み重ねを次の行動につなげます。',
  },
  {
    icon: Trophy,
    title: '達成が成果になる',
    description:
      'クエスト達成でポイントやXPを獲得。小さな成功を着実に残せます。',
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-20 pb-12 pt-8 sm:pt-16">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-16 text-white sm:px-12 lg:px-16 lg:py-24">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="mb-5 text-sm font-bold tracking-[0.2em] text-blue-300">
            SMALL QUESTS. QUIET PROGRESS.
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            今日の学びを、
            <br />
            ひとつのクエストに。
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            StudyQuestは、勉強を小さな挑戦に変える学習継続アプリです。
            迷う時間を減らして、静かでも確かな前進を積み重ねましょう。
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3 font-bold text-white transition hover:bg-blue-400"
            >
              無料で始める
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link
              href="/quests"
              className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-6 py-3 font-bold text-white transition hover:border-slate-400 hover:bg-white/5"
            >
              クエストを見る
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="features-heading">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-widest text-blue-600">
            WHY STUDYQUEST
          </p>
          <h2
            id="features-heading"
            className="mt-3 text-3xl font-black text-slate-900"
          >
            続けるための仕組みを、シンプルに
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
            >
              <span className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-600">
                <Icon aria-hidden="true" size={24} />
              </span>
              <h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid items-center gap-10 rounded-3xl bg-blue-50 px-6 py-12 sm:px-10 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold tracking-widest text-blue-700">
            HOW IT WORKS
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-900">
            3ステップで学習を記録
          </h2>
          <ol className="mt-7 space-y-5">
            {[
              '興味や目標に合うクエストを探す',
              'クエストを受注して学習に取り組む',
              '学習時間を記録して達成を積み重ねる',
            ].map((step) => (
              <li
                key={step}
                className="flex items-center gap-3 font-semibold text-slate-700"
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="shrink-0 text-blue-600"
                  size={21}
                />
                {step}
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">今日のおすすめ</p>
          <h3 className="mt-3 text-2xl font-black text-slate-900">
            公式ドキュメントを10分読む
          </h3>
          <p className="mt-3 leading-7 text-slate-600">
            まとまった時間がなくても大丈夫。まずは10分のクエストから始められます。
          </p>
          <Link
            href="/quests"
            className="mt-6 inline-flex items-center gap-2 font-bold text-blue-700 hover:text-blue-800"
          >
            公開クエストを探す
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
