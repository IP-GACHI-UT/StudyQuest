import { prisma } from '@/lib/prisma';

export const DEVELOPMENT_USER_ID = 'dev-user-001';

export async function getCurrentUserId() {
  return DEVELOPMENT_USER_ID;
}

export async function ensureCurrentUser() {
  const userId = await getCurrentUserId();

  return prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      displayName: '開発用ユーザー',
      email: 'dev@example.com',
    },
  });
}
