import { prisma } from '@studyquest/db';
import { Hono } from 'hono';
import { errorResponse, jsonResponse } from '../lib/api-response.js';
import { getCurrentUserId } from '../lib/auth.js';

const DAYS_IN_WEEK = 7;

/**
 * 学習ログの要約に必要な情報を表す型
 * @typedef {Object} StudyLogForSummary
 * @property {number} minutes - 学習時間 (分)
 * @property {Date} studiedAt - 学習日時
 */
type StudyLogForSummary = {
  minutes: number;
  studiedAt: Date;
};

/**
 * 日ごとの学習時間を表す型
 * @typedef {Object} DailyStudyMinutes
 * @property {string} date - 日付 (YYYY-MM-DD 形式)
 * @property {number} minutes - 学習時間 (分)
 */
type DailyStudyMinutes = {
  date: string;
  minutes: number;
};

/**
 * 週間学習状況の取得
 * @returns {Promise<Response>} 週間学習状況のレスポンス
 */
export const studySummaryRoute = new Hono().get('/weekly', async () => {
  const userId = await getCurrentUserId();
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

/**
 * 週間学習状況の取得に必要な日ごとの学習時間を構築する
 * @param weekStart 週の開始日
 * @param studyLogs 学習ログの配列
 * @returns {DailyStudyMinutes[]} 日ごとの学習時間の配列
 */
function buildDailyStudyMinutes(
  weekStart: Date,
  studyLogs: StudyLogForSummary[],
): DailyStudyMinutes[] {
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

/**
 * 連続学習日数を計算する
 * @param dailyStudyMinutes 日ごとの学習時間の配列
 * @returns {number} 連続学習日数
 */
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

/**
 * 週の開始日を取得する
 * @param date 基準となる日付
 * @returns {Date} 週の開始日
 */
function getStartOfWeek(date: Date) {
  const startOfDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const daysSinceMonday = (startOfDay.getDay() + 6) % DAYS_IN_WEEK;

  return addDays(startOfDay, -daysSinceMonday);
}

/**
 * 日付に指定された日数を加算する
 * @param date 加算する日付
 * @param days 加算する日数
 * @returns {Date} 加算後の日付
 */
function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

/**
 * 日付を YYYY-MM-DD 形式の文字列に変換する
 * @param date 変換する日付
 * @returns {string} 変換後の文字列
 */
function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
