import { prisma } from '@studyquest/db';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { app } from '../src/app.js';
import {
  authenticatedHeaders,
  createAuthenticatedTestUser,
} from './auth-test-helper.js';

let DEVELOPMENT_USER_ID = '';
let authCookie = '';
const OWN_EMAIL = 'study-summary-own@example.com';

const OTHER_USER = 'test-summary-other';
const QUEST_ID = 'test-summary-quest';
async function cleanup() {
  await prisma.user.deleteMany({
    where: { OR: [{ email: OWN_EMAIL }, { id: OTHER_USER }] },
  });
  await prisma.quest.deleteMany({ where: { id: QUEST_ID } });
}
beforeEach(async () => {
  await cleanup();
  const own = await createAuthenticatedTestUser({
    email: OWN_EMAIL,
    name: '本人',
  });
  DEVELOPMENT_USER_ID = own.userId;
  authCookie = own.cookie;
  await prisma.user.create({
    data: {
      id: OTHER_USER,
      email: 'study-summary-other@example.com',
      displayName: '別ユーザー',
    },
  });
  await prisma.quest.create({
    data: {
      id: QUEST_ID,
      title: '週の境界テスト',
      description: '日本時間の境界を確認',
      category: 'テスト',
      estimatedMinutes: 15,
      xpReward: 11,
    },
  });
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-01-14T12:00:00Z'));
});
afterEach(async () => {
  vi.useRealTimers();
  await cleanup();
});
afterAll(async () => {
  await prisma.$disconnect();
});
async function createLog(
  id: string,
  studiedAt: string,
  minutes: number,
  userId = DEVELOPMENT_USER_ID,
) {
  await prisma.studyLog.create({
    data: {
      id,
      userId,
      questId: QUEST_ID,
      minutes,
      studiedAt: new Date(studiedAt),
      note: id,
    },
  });
}
describe('GET /api/study-logs', () => {
  it('returns an empty array for a user with no logs', async () => {
    await expect(
      (
        await app.request('/api/study-logs', {
          headers: authenticatedHeaders(authCookie),
        })
      ).json(),
    ).resolves.toEqual({ studyLogs: [] });
  });
  it('returns only own logs in studiedAt/id descending order and ignores client userId', async () => {
    await createLog('log-a', '2026-01-12T01:00:00Z', 1);
    await createLog('log-b', '2026-01-12T01:00:00Z', 2);
    await createLog('log-c', '2026-01-13T01:00:00Z', 3);
    await createLog('other', '2026-01-14T01:00:00Z', 999, OTHER_USER);
    const response = await app.request(`/api/study-logs?userId=${OTHER_USER}`, {
      headers: authenticatedHeaders(authCookie),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.studyLogs.map((log: { id: string }) => log.id)).toEqual([
      'log-c',
      'log-b',
      'log-a',
    ]);
    expect(body.studyLogs[0]).not.toHaveProperty('userQuestId');
    expect(body.studyLogs[0]).not.toHaveProperty('updatedAt');
    expect(body.studyLogs[0].userId).toBe(DEVELOPMENT_USER_ID);
  });
});
describe('GET /api/study-summary/weekly', () => {
  it('returns all seven zero days for an empty week', async () => {
    const body = await (
      await app.request('/api/study-summary/weekly', {
        headers: authenticatedHeaders(authCookie),
      })
    ).json();
    expect(body.summary).toEqual({
      studyMinutes: 0,
      completedQuestCount: 0,
      earnedXp: 0,
      streakDays: 0,
      dailyStudyMinutes: Array.from({ length: 7 }, (_, index) => ({
        date: `2026-01-${12 + index}`,
        minutes: 0,
      })),
    });
  });
  it('uses Japan Monday boundaries, excludes other users, and separates days at midnight', async () => {
    await createLog('before', '2026-01-11T14:59:59.999Z', 100);
    await createLog('monday-start', '2026-01-11T15:00:00Z', 7);
    await createLog('monday-end', '2026-01-12T14:59:59.999Z', 3);
    await createLog('tuesday-start', '2026-01-12T15:00:00Z', 4);
    await createLog('sunday-end', '2026-01-18T14:59:59.999Z', 5);
    await createLog('next-week', '2026-01-18T15:00:00Z', 200);
    await createLog('other', '2026-01-14T01:00:00Z', 999, OTHER_USER);
    await prisma.userQuest.createMany({
      data: [
        {
          userId: DEVELOPMENT_USER_ID,
          questId: QUEST_ID,
          status: 'COMPLETED',
          completedAt: new Date('2026-01-18T14:59:59.999Z'),
        },
        {
          userId: OTHER_USER,
          questId: QUEST_ID,
          status: 'COMPLETED',
          completedAt: new Date('2026-01-14T01:00:00Z'),
        },
      ],
    });
    const response = await app.request('/api/study-summary/weekly', {
      headers: authenticatedHeaders(authCookie),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.summary.studyMinutes).toBe(19);
    expect(
      body.summary.dailyStudyMinutes.map(
        (day: { minutes: number }) => day.minutes,
      ),
    ).toEqual([10, 4, 0, 0, 0, 0, 5]);
    expect(body.summary.completedQuestCount).toBe(1);
    expect(body.summary.earnedXp).toBe(11);
    expect(body.summary.streakDays).toBe(2);
    vi.setSystemTime(new Date('2026-01-18T15:00:00Z'));
    const next = await (
      await app.request('/api/study-summary/weekly', {
        headers: authenticatedHeaders(authCookie),
      })
    ).json();
    expect(next.summary.studyMinutes).toBe(200);
    expect(next.summary.dailyStudyMinutes[0]).toEqual({
      date: '2026-01-19',
      minutes: 200,
    });
    expect(next.summary.completedQuestCount).toBe(0);
  });
});
