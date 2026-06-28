import { presentQuest } from '@/lib/api-presenters';
import { errorResponse, jsonResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const quests = await prisma.quest.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return jsonResponse({ quests: quests.map(presentQuest) });
  } catch {
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'クエスト一覧の取得に失敗しました。',
    );
  }
}
