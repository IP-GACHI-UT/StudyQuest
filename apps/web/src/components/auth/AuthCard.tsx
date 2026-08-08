import Link from 'next/link';

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
}: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md py-8 sm:py-14">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black tracking-[0.2em] text-blue-600">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">{title}</h1>
        <p className="mt-3 leading-7 text-slate-600">{description}</p>
        <div className="mt-7">{children}</div>
      </div>
      <p className="mt-5 text-center text-xs leading-5 text-slate-500">
        続行すると、StudyQuestの
        <Link href="/terms" className="mx-1 underline hover:text-slate-700">
          利用規約
        </Link>
        と
        <Link href="/privacy" className="mx-1 underline hover:text-slate-700">
          プライバシーポリシー
        </Link>
        に同意したものとみなされます。
      </p>
    </div>
  );
}
