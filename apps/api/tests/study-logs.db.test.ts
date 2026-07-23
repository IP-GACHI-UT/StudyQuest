import { prisma } from '@studyquest/db';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { DEVELOPMENT_USER_ID } from '../src/lib/auth.js';

const INITIAL_TOTAL_POINTS = 100;
const INITIAL_TOTAL_XP = 200;
const TEST_QUEST = {
  id: 'test-quest-study-logs',
  title: '学習記録DB結合テスト用クエスト',
  description: 'POST /api/study-logsのDB結合テストで使用するクエストです。',
  category: 'テスト',
  estimatedMinutes: 15,
  acceptPoint: 1,
  clearPoint: 7,
  xpReward: 11,
  isActive: true,
};

async function deleteTestData() {
  await prisma.user.deleteMany({
    where: { id: DEVELOPMENT_USER_ID },
  });
  await prisma.quest.deleteMany({
    where: { id: TEST_QUEST.id },
  });
}

async function postStudyLog(minutes: number) {
  return app.request('/api/study-logs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      questId: TEST_QUEST.id,
      minutes,
      studiedAt: '2026-01-15T09:00:00.000Z',
    }),
  });
}

beforeEach(async () => {
  await deleteTestData();
  await prisma.user.create({
    data: {
      id: DEVELOPMENT_USER_ID,
      displayName: '学習記録DB結合テスト用ユーザー',
      email: 'study-logs-db-test@example.com',
      totalPoints: INITIAL_TOTAL_POINTS,
      totalXp: INITIAL_TOTAL_XP,
    },
  });
  await prisma.quest.create({ data: TEST_QUEST });
  await prisma.userQuest.create({
    data: {
      userId: DEVELOPMENT_USER_ID,
      questId: TEST_QUEST.id,
    },
  });
});

afterEach(async () => {
  await deleteTestData();
});

afterAll(async () => {
  try {
    await deleteTestData();
  } finally {
    await prisma.$disconnect();
  }
});

describe('POST /api/study-logs', () => {
  it.each([
    0, -1,
  ])('rejects minutes=%i without changing database state', async (minutes) => {
    const response = await postStudyLog(minutes);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'minutes' }),
          ]),
        }),
      }),
    );

    await expect(
      prisma.studyLog.count({
        where: {
          userId: DEVELOPMENT_USER_ID,
          questId: TEST_QUEST.id,
        },
      }),
    ).resolves.toBe(0);
    await expect(
      prisma.activityLog.count({
        where: {
          userId: DEVELOPMENT_USER_ID,
          questId: TEST_QUEST.id,
        },
      }),
    ).resolves.toBe(0);
    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: DEVELOPMENT_USER_ID },
        select: { totalPoints: true, totalXp: true },
      }),
    ).resolves.toEqual({
      totalPoints: INITIAL_TOTAL_POINTS,
      totalXp: INITIAL_TOTAL_XP,
    });
    await expect(
      prisma.userQuest.findUniqueOrThrow({
        where: {
          userId_questId: {
            userId: DEVELOPMENT_USER_ID,
            questId: TEST_QUEST.id,
          },
        },
        select: { status: true, completedAt: true },
      }),
    ).resolves.toEqual({
      status: 'IN_PROGRESS',
      completedAt: null,
    });
  });

  it('awards quest completion rewards only once across multiple study logs', async () => {
    const firstResponse = await postStudyLog(TEST_QUEST.estimatedMinutes);

    expect(firstResponse.status).toBe(201);
    await expect(firstResponse.json()).resolves.toEqual(
      expect.objectContaining({
        studyLog: expect.objectContaining({
          questId: TEST_QUEST.id,
          minutes: TEST_QUEST.estimatedMinutes,
        }),
      }),
    );

    const completedUserQuest = await prisma.userQuest.findUniqueOrThrow({
      where: {
        userId_questId: {
          userId: DEVELOPMENT_USER_ID,
          questId: TEST_QUEST.id,
        },
      },
      select: { status: true, completedAt: true },
    });

    expect(completedUserQuest.status).toBe('COMPLETED');
    expect(completedUserQuest.completedAt).toBeInstanceOf(Date);
    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: DEVELOPMENT_USER_ID },
        select: { totalPoints: true, totalXp: true },
      }),
    ).resolves.toEqual({
      totalPoints: INITIAL_TOTAL_POINTS + TEST_QUEST.clearPoint,
      totalXp: INITIAL_TOTAL_XP + TEST_QUEST.xpReward,
    });
    await expect(
      prisma.activityLog.count({
        where: {
          userId: DEVELOPMENT_USER_ID,
          questId: TEST_QUEST.id,
          type: 'QUEST_COMPLETED',
        },
      }),
    ).resolves.toBe(1);

    const secondResponse = await postStudyLog(5);

    expect(secondResponse.status).toBe(201);
    await expect(secondResponse.json()).resolves.toEqual(
      expect.objectContaining({
        studyLog: expect.objectContaining({
          questId: TEST_QUEST.id,
          minutes: 5,
        }),
      }),
    );
    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: DEVELOPMENT_USER_ID },
        select: { totalPoints: true, totalXp: true },
      }),
    ).resolves.toEqual({
      totalPoints: INITIAL_TOTAL_POINTS + TEST_QUEST.clearPoint,
      totalXp: INITIAL_TOTAL_XP + TEST_QUEST.xpReward,
    });
    await expect(
      prisma.userQuest.findUniqueOrThrow({
        where: {
          userId_questId: {
            userId: DEVELOPMENT_USER_ID,
            questId: TEST_QUEST.id,
          },
        },
        select: { status: true, completedAt: true },
      }),
    ).resolves.toEqual(completedUserQuest);
    await expect(
      prisma.studyLog.aggregate({
        where: {
          userId: DEVELOPMENT_USER_ID,
          questId: TEST_QUEST.id,
        },
        _count: true,
        _sum: { minutes: true },
      }),
    ).resolves.toEqual({
      _count: 2,
      _sum: { minutes: TEST_QUEST.estimatedMinutes + 5 },
    });
    await expect(
      prisma.activityLog.count({
        where: {
          userId: DEVELOPMENT_USER_ID,
          questId: TEST_QUEST.id,
          type: 'STUDY_LOG_CREATED',
        },
      }),
    ).resolves.toBe(2);
    await expect(
      prisma.activityLog.count({
        where: {
          userId: DEVELOPMENT_USER_ID,
          questId: TEST_QUEST.id,
          type: 'QUEST_COMPLETED',
        },
      }),
    ).resolves.toBe(1);
  });
});
