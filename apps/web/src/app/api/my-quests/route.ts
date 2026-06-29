import { presentUserQuest } from '@/lib/api-presenters';
import { errorResponse, jsonResponse } from '@/lib/api-response';
import { getCurrentUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const userId = await getCurrentUserId();

  try {
    const userQuests = await prisma.userQuest.findMany({
      where: { userId },
      include: {
        quest: true,
      },
      orderBy: {
        acceptedAt: 'desc',
      },
    });

    return jsonResponse({ userQuests: userQuests.map(presentUserQuest) });
  } catch {
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'マイクエストの取得に失敗しました。',
    );
  }
}
