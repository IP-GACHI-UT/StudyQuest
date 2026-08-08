import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/server-auth';

type ProtectedLayoutProps = {
  children: React.ReactNode;
  returnTo: string;
};

export async function ProtectedLayout({
  children,
  returnTo,
}: ProtectedLayoutProps) {
  const session = await getServerSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }

  return children;
}
