import { prisma } from '@studyquest/db';
import { Hono } from 'hono';
import { errorResponse, jsonResponse } from '../lib/api-response.js';
import {
  activityPresenterSelect,
  presentActivity,
} from '../presenters/api-presenters.js';

export const activitiesRoute = new Hono().get('/', async () => {
  try {
    const activities = await prisma.activityLog.findMany({
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
