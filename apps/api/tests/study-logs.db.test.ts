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

async function postStudyLog(minutes: number, requestId?: string) {
  return app.request('/api/study-logs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      questId: TEST_QUEST.id,
      minutes,
      requestId,
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
  it('accepts ISO timestamps with higher fractional precision and stores milliseconds', async () => {
    const response = await app.request('/api/study-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questId: TEST_QUEST.id,
        minutes: 1,
        studiedAt: '2026-01-15T09:00:00.1234567Z',
      }),
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toHaveProperty(
      'studyLog.studiedAt',
      '2026-01-15T09:00:00.123Z',
    );
  });
  it('rejects canceled quests without creating logs or awarding rewards', async () => {
    await prisma.userQuest.updateMany({
      where: { userId: DEVELOPMENT_USER_ID },
      data: { status: 'CANCELED' },
    });
    const response = await postStudyLog(15);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toHaveProperty(
      'error.code',
      'QUEST_CANCELED',
    );
    await expect(
      prisma.studyLog.count({ where: { userId: DEVELOPMENT_USER_ID } }),
    ).resolves.toBe(0);
    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: DEVELOPMENT_USER_ID },
        select: { totalXp: true },
      }),
    ).resolves.toEqual({ totalXp: INITIAL_TOTAL_XP });
  });
  it('completes only after the accumulated minutes reach the threshold', async () => {
    expect((await postStudyLog(14)).status).toBe(201);
    await expect(
      prisma.userQuest.findFirst({
        where: { userId: DEVELOPMENT_USER_ID },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: 'IN_PROGRESS' });
    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: DEVELOPMENT_USER_ID },
        select: { totalXp: true },
      }),
    ).resolves.toEqual({ totalXp: INITIAL_TOTAL_XP });
    expect((await postStudyLog(1)).status).toBe(201);
    await expect(
      prisma.userQuest.findFirst({
        where: { userId: DEVELOPMENT_USER_ID },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: 'COMPLETED' });
  });
  it('serializes concurrent minutes so the completion threshold is not missed', async () => {
    const responses = await Promise.all([postStudyLog(8), postStudyLog(8)]);
    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    await expect(
      prisma.userQuest.findFirst({
        where: { userId: DEVELOPMENT_USER_ID },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: 'COMPLETED' });
    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: DEVELOPMENT_USER_ID },
        select: { totalXp: true },
      }),
    ).resolves.toEqual({ totalXp: INITIAL_TOTAL_XP + TEST_QUEST.xpReward });
  });
  it('returns one log and one reward when identical requests are concurrent or retried', async () => {
    const requestId = 'a22b8d86-35aa-4bca-8b74-d88a871bfae8';
    const responses = await Promise.all([
      postStudyLog(15, requestId),
      postStudyLog(15, requestId),
    ]);
    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    expect(await responses[0].json()).toEqual(await responses[1].json());
    expect((await postStudyLog(15, requestId)).status).toBe(201);
    expect((await postStudyLog(16, requestId)).status).toBe(409);
    await expect(
      prisma.studyLog.count({ where: { userId: DEVELOPMENT_USER_ID } }),
    ).resolves.toBe(1);
    await expect(
      prisma.activityLog.count({
        where: { userId: DEVELOPMENT_USER_ID, type: 'STUDY_LOG_CREATED' },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.activityLog.count({
        where: { userId: DEVELOPMENT_USER_ID, type: 'QUEST_COMPLETED' },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: DEVELOPMENT_USER_ID },
        select: { totalXp: true, totalPoints: true },
      }),
    ).resolves.toEqual({
      totalXp: INITIAL_TOTAL_XP + TEST_QUEST.xpReward,
      totalPoints: INITIAL_TOTAL_POINTS + TEST_QUEST.clearPoint,
    });
  });
  it('rejects a requestId owned by another user without returning their record', async () => {
    const otherId = 'study-log-key-other';
    await prisma.user.create({
      data: { id: otherId, displayName: '別ユーザー' },
    });
    try {
      await prisma.studyLog.create({
        data: {
          id: 'study-a22b8d86-35aa-4bca-8b74-d88a871bfae8',
          userId: otherId,
          questId: TEST_QUEST.id,
          minutes: 15,
        },
      });
      const response = await postStudyLog(
        15,
        'a22b8d86-35aa-4bca-8b74-d88a871bfae8',
      );
      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toHaveProperty(
        'error.code',
        'REQUEST_ID_CONFLICT',
      );
      await expect(
        prisma.studyLog.count({ where: { userId: DEVELOPMENT_USER_ID } }),
      ).resolves.toBe(0);
    } finally {
      await prisma.user.delete({ where: { id: otherId } });
    }
  });
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
