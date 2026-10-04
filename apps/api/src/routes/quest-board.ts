import { prisma } from '@studyquest/db';
import { Hono } from 'hono';
import { errorResponse, jsonResponse } from '../lib/api-response.js';
import { type AuthEnv, requireAuth } from '../lib/auth.js';
import { presentQuestBoardQuest } from '../presenters/api-presenters.js';

type QuestCount = {
  questId: string;
  _count: {
    questId: number;
  };
};

export const questBoardRoute = new Hono<AuthEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const userId = c.var.user.id;
    const { start, end } = getCurrentDayRange(new Date());

    try {
      const quests = await prisma.quest.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              userQuests: true,
            },
          },
        },
      });
      const questIds = quests.map((quest) => quest.id);

      if (questIds.length === 0) {
        return jsonResponse({ quests: [] });
      }

      const [
        acceptedToday,
        completedToday,
        completedAllTime,
        currentUserQuests,
      ] = await Promise.all([
        prisma.userQuest.groupBy({
          by: ['questId'],
          where: {
            questId: { in: questIds },
            acceptedAt: {
              gte: start,
              lt: end,
            },
          },
          _count: {
            questId: true,
          },
        }),
        prisma.userQuest.groupBy({
          by: ['questId'],
          where: {
            questId: { in: questIds },
            completedAt: {
              gte: start,
              lt: end,
            },
          },
          _count: {
            questId: true,
          },
        }),
        prisma.userQuest.groupBy({
          by: ['questId'],
          where: {
            questId: { in: questIds },
            completedAt: { not: null },
          },
          _count: {
            questId: true,
          },
        }),
        prisma.userQuest.findMany({
          where: {
            userId,
            questId: { in: questIds },
          },
          select: {
            questId: true,
          },
        }),
      ]);

      const acceptedTodayByQuest = buildCountByQuest(acceptedToday);
      const completedTodayByQuest = buildCountByQuest(completedToday);
      const completedAllTimeByQuest = buildCountByQuest(completedAllTime);
      const acceptedQuestIds = new Set(
        currentUserQuests.map((userQuest) => userQuest.questId),
      );

      return jsonResponse({
        quests: quests.map((quest) => {
          const totalAccepted = quest._count.userQuests;
          const totalCompleted = completedAllTimeByQuest.get(quest.id) ?? 0;

          return presentQuestBoardQuest(
            quest,
            {
              acceptedToday: acceptedTodayByQuest.get(quest.id) ?? 0,
              completedToday: completedTodayByQuest.get(quest.id) ?? 0,
              completionRate:
                totalAccepted === 0
                  ? 0
                  : Math.round((totalCompleted / totalAccepted) * 100),
            },
            acceptedQuestIds.has(quest.id),
          );
        }),
      });
    } catch {
      return errorResponse(
        'INTERNAL_SERVER_ERROR',
        '掲示板クエストの取得に失敗しました。',
      );
    }
  });

function buildCountByQuest(counts: QuestCount[]) {
  return new Map(counts.map((count) => [count.questId, count._count.questId]));
}

function getCurrentDayRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}
