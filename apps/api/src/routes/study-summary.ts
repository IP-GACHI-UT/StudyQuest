import { prisma } from '@studyquest/db';
import { Hono } from 'hono';
import { errorResponse, jsonResponse } from '../lib/api-response.js';
import { type AuthEnv, requireAuth } from '../lib/auth.js';

const DAYS_IN_WEEK = 7;

type StudyLogForSummary = {
  minutes: number;
  studiedAt: Date;
};

type DailyStudyMinutes = {
  date: string;
  minutes: number;
};

export const studySummaryRoute = new Hono<AuthEnv>()
  .use('*', requireAuth)
  .get('/weekly', async (c) => {
    const userId = c.var.user.id;
    const weekStart = getStartOfWeek(new Date());
    const weekEnd = addDays(weekStart, DAYS_IN_WEEK);

    try {
      const [studyLogs, completedUserQuests] = await Promise.all([
        prisma.studyLog.findMany({
          where: {
            userId,
            studiedAt: {
              gte: weekStart,
              lt: weekEnd,
            },
          },
          select: {
            minutes: true,
            studiedAt: true,
          },
        }),
        prisma.userQuest.findMany({
          where: {
            userId,
            status: 'COMPLETED',
            completedAt: {
              gte: weekStart,
              lt: weekEnd,
            },
          },
          select: {
            quest: {
              select: {
                xpReward: true,
              },
            },
          },
        }),
      ]);

      const dailyStudyMinutes = buildDailyStudyMinutes(weekStart, studyLogs);
      const studyMinutes = dailyStudyMinutes.reduce(
        (total, daily) => total + daily.minutes,
        0,
      );
      const earnedXp = completedUserQuests.reduce(
        (total, userQuest) => total + userQuest.quest.xpReward,
        0,
      );

      return jsonResponse({
        summary: {
          studyMinutes,
          completedQuestCount: completedUserQuests.length,
          earnedXp,
          streakDays: calculateStreakDays(dailyStudyMinutes),
          dailyStudyMinutes,
        },
      });
    } catch {
      return errorResponse(
        'INTERNAL_SERVER_ERROR',
        '週間学習状況の取得に失敗しました。',
      );
    }
  });

function buildDailyStudyMinutes(
  weekStart: Date,
  studyLogs: StudyLogForSummary[],
): DailyStudyMinutes[] {
  // OpenAPIの契約どおり、ログがない日も minutes: 0 として7日分返す。
  const dailyStudyMinutes = Array.from(
    { length: DAYS_IN_WEEK },
    (_, index) => ({
      date: formatDate(addDays(weekStart, index)),
      minutes: 0,
    }),
  );
  const indexByDate = new Map(
    dailyStudyMinutes.map((daily, index) => [daily.date, index]),
  );

  for (const studyLog of studyLogs) {
    const date = formatDate(studyLog.studiedAt);
    const dailyIndex = indexByDate.get(date);

    if (dailyIndex !== undefined) {
      dailyStudyMinutes[dailyIndex].minutes += studyLog.minutes;
    }
  }

  return dailyStudyMinutes;
}

function calculateStreakDays(dailyStudyMinutes: DailyStudyMinutes[]) {
  let currentStreakDays = 0;
  let maxStreakDays = 0;

  for (const daily of dailyStudyMinutes) {
    if (daily.minutes > 0) {
      currentStreakDays += 1;
      maxStreakDays = Math.max(maxStreakDays, currentStreakDays);
      continue;
    }

    currentStreakDays = 0;
  }

  return maxStreakDays;
}

function getStartOfWeek(date: Date) {
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const daysSinceMonday = (startOfDay.getDay() + 6) % DAYS_IN_WEEK;

  return addDays(startOfDay, -daysSinceMonday);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
