import { prisma } from '@studyquest/db';
import { Hono } from 'hono';
import { errorResponse, jsonResponse } from '../lib/api-response.js';
import { type AuthEnv, requireAuth } from '../lib/auth.js';
import {
  activityPresenterSelect,
  presentActivity,
} from '../presenters/api-presenters.js';

export const activitiesRoute = new Hono<AuthEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const userId = c.var.user.id;

    try {
      const activities = await prisma.activityLog.findMany({
        where: { userId },
        take: 20,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: activityPresenterSelect,
      });

      return jsonResponse({ activities: activities.map(presentActivity) });
    } catch {
      return errorResponse(
        'INTERNAL_SERVER_ERROR',
        '活動の取得に失敗しました。',
      );
    }
  });
