import { ProtectedLayout } from '@/components/ProtectedLayout';
export default function MyQuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayout returnTo="/my-quest">{children}</ProtectedLayout>;
}
