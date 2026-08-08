import { ProtectedLayout } from '@/components/ProtectedLayout';

export default function BoardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ProtectedLayout returnTo="/board">{children}</ProtectedLayout>;
}
