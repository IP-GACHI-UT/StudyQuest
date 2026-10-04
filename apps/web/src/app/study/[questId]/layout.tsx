import { ProtectedLayout } from '@/components/ProtectedLayout';
export default async function StudyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ questId: string }>;
}) {
  const { questId } = await params;
  return (
    <ProtectedLayout returnTo={`/study/${encodeURIComponent(questId)}`}>
      {children}
    </ProtectedLayout>
  );
}
