import { prisma } from '@studyquest/db';
import { Hono } from 'hono';
import { errorResponse, jsonResponse } from '../lib/api-response.js';
import { type AuthEnv, requireAuth } from '../lib/auth.js';
import {
  presentProfile,
  profilePresenterSelect,
} from '../presenters/api-presenters.js';

export const profileRoute = new Hono<AuthEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const userId = c.var.user.id;

    try {
      const [profile, studyMinutes] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: profilePresenterSelect,
        }),
        prisma.studyLog.aggregate({
          where: { userId },
          _sum: {
            minutes: true,
          },
        }),
      ]);

      if (!profile) {
        return errorResponse(
          'INTERNAL_SERVER_ERROR',
          'プロフィールの取得に失敗しました。',
        );
      }

      return jsonResponse({
        profile: presentProfile(profile, studyMinutes._sum.minutes ?? 0),
      });
    } catch {
      return errorResponse(
        'INTERNAL_SERVER_ERROR',
        'プロフィールの取得に失敗しました。',
      );
    }
  });
