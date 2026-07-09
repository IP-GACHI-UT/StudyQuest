import { Prisma, prisma } from '@studyquest/db';
import { Hono } from 'hono';
import { errorResponse, jsonResponse } from '../lib/api-response.js';
import { getCurrentUserId } from '../lib/auth.js';
import {
  presentQuest,
  presentUserQuest,
} from '../presenters/api-presenters.js';

export const questsRoute = new Hono()
  .get('/', async () => {
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
  })
  .post('/:questId/accept', async (c) => {
    const questId = c.req.param('questId');
    const userId = await getCurrentUserId();

    try {
      const quest = await prisma.quest.findFirst({
        where: {
          id: questId,
          isActive: true,
        },
        select: {
          id: true,
          title: true,
        },
      });

      if (!quest) {
        return errorResponse(
          'QUEST_NOT_FOUND',
          '指定されたクエストが見つかりません。',
          404,
        );
      }

      const acceptedQuest = await prisma.userQuest.findUnique({
        where: {
          userId_questId: {
            userId,
            questId,
          },
        },
      });

      if (acceptedQuest) {
        return errorResponse(
          'QUEST_ALREADY_ACCEPTED',
          'このクエストはすでに受注済みです。',
          409,
        );
      }

      const userQuest = await prisma.$transaction(async (tx) => {
        await tx.user.upsert({
          where: { id: userId },
          update: {},
          create: {
            id: userId,
            displayName: '開発用ユーザー',
            email: 'dev@example.com',
          },
        });

        const createdUserQuest = await tx.userQuest.create({
          data: {
            userId,
            questId,
          },
          include: {
            quest: true,
          },
        });

        await tx.activityLog.create({
          data: {
            userId,
            questId,
            type: 'QUEST_ACCEPTED',
            message: `「${quest.title}」を受注しました。`,
          },
        });

        return createdUserQuest;
      });

      return jsonResponse({ userQuest: presentUserQuest(userQuest) }, 201);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return errorResponse(
          'QUEST_ALREADY_ACCEPTED',
          'このクエストはすでに受注済みです。',
          409,
        );
      }

      return errorResponse(
        'INTERNAL_SERVER_ERROR',
        'クエストの受注に失敗しました。',
      );
    }
  });
