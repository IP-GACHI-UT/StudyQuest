import { Hono } from 'hono';
import { prisma } from '@studyquest/db';
import { errorResponse, jsonResponse } from '../lib/api-response.js';
import { getCurrentUserId } from '../lib/auth.js';
import { presentUserQuest } from '../presenters/api-presenters.js';

export const userQuestsRoute = new Hono().get('/', async () => {
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
});
