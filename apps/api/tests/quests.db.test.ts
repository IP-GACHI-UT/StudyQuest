import { prisma } from '@studyquest/db';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import {
  authenticatedHeaders,
  createAuthenticatedTestUser,
} from './auth-test-helper.js';

const INITIAL_TOTAL_POINTS = 100;
const TEST_USER_EMAIL = 'quests-db-test@example.com';
const OTHER_USER_IDS = [
  'test-quest-board-other-user-1',
  'test-quest-board-other-user-2',
] as const;
const TEST_QUEST = {
  id: 'test-quest-get-quests',
  title: 'DB結合テスト用クエスト',
  description: 'GET /api/questsのDB結合テストで使用するクエストです。',
  category: 'テスト',
  estimatedMinutes: 15,
  acceptPoint: 1,
  clearPoint: 2,
  xpReward: 3,
  isActive: true,
};
let currentUserId = '';
let authCookie = '';

async function deleteTestData() {
  await prisma.user.deleteMany({
    where: {
      OR: [{ email: TEST_USER_EMAIL }, { id: { in: [...OTHER_USER_IDS] } }],
    },
  });
  await prisma.quest.deleteMany({
    where: { id: TEST_QUEST.id },
  });
}

beforeEach(async () => {
  await deleteTestData();
  const authenticatedUser = await createAuthenticatedTestUser({
    email: TEST_USER_EMAIL,
    name: 'クエストDB結合テスト用ユーザー',
  });
  currentUserId = authenticatedUser.userId;
  authCookie = authenticatedUser.cookie;
  await prisma.user.update({
    where: { id: currentUserId },
    data: { totalPoints: INITIAL_TOTAL_POINTS },
  });
  await prisma.quest.create({ data: TEST_QUEST });
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

describe('GET /api/quests', () => {
  it('returns a quest created in the database', async () => {
    const response = await app.request('/api/quests');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        quests: expect.arrayContaining([
          expect.objectContaining({
            id: TEST_QUEST.id,
            title: TEST_QUEST.title,
          }),
        ]),
      }),
    );
  });
});

describe('GET /api/board/quests', () => {
  it('returns zero statistics when nobody has accepted the quest', async () => {
    const response = await app.request('/api/board/quests', {
      headers: authenticatedHeaders(authCookie),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        quests: expect.arrayContaining([
          {
            quest: expect.objectContaining({
              id: TEST_QUEST.id,
              title: TEST_QUEST.title,
            }),
            statistics: {
              acceptedToday: 0,
              completedToday: 0,
              completionRate: 0,
            },
            currentUser: {
              isAccepted: false,
            },
          },
        ]),
      }),
    );
  });

  it('keeps the current user unaccepted when only other users accepted today', async () => {
    const now = new Date();

    await prisma.user.createMany({
      data: OTHER_USER_IDS.map((id, index) => ({
        id,
        displayName: `掲示板DB結合テスト用ユーザー${index + 1}`,
        email: `quest-board-db-test-${index + 1}@example.com`,
      })),
    });
    await prisma.userQuest.createMany({
      data: [
        {
          userId: OTHER_USER_IDS[0],
          questId: TEST_QUEST.id,
          acceptedAt: now,
        },
        {
          userId: OTHER_USER_IDS[1],
          questId: TEST_QUEST.id,
          status: 'COMPLETED',
          acceptedAt: now,
          completedAt: now,
        },
      ],
    });

    const response = await app.request('/api/board/quests', {
      headers: authenticatedHeaders(authCookie),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        quests: expect.arrayContaining([
          expect.objectContaining({
            quest: expect.objectContaining({ id: TEST_QUEST.id }),
            statistics: {
              acceptedToday: 2,
              completedToday: 1,
              completionRate: 50,
            },
            currentUser: {
              isAccepted: false,
            },
          }),
        ]),
      }),
    );
  });

  it('returns the current user as accepted independently of today statistics', async () => {
    await prisma.userQuest.create({
      data: {
        userId: currentUserId,
        questId: TEST_QUEST.id,
        acceptedAt: new Date('2000-01-01T00:00:00.000Z'),
      },
    });

    const response = await app.request('/api/board/quests', {
      headers: authenticatedHeaders(authCookie),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        quests: expect.arrayContaining([
          expect.objectContaining({
            quest: expect.objectContaining({ id: TEST_QUEST.id }),
            statistics: {
              acceptedToday: 0,
              completedToday: 0,
              completionRate: 0,
            },
            currentUser: {
              isAccepted: true,
            },
          }),
        ]),
      }),
    );
  });
});

describe('POST /api/quests/:questId/accept', () => {
  it('awards accept points only once when rejecting a duplicate acceptance', async () => {
    const firstResponse = await app.request(
      `/api/quests/${TEST_QUEST.id}/accept`,
      {
        method: 'POST',
        headers: authenticatedHeaders(authCookie),
      },
    );

    expect(firstResponse.status).toBe(201);
    await expect(firstResponse.json()).resolves.toEqual(
      expect.objectContaining({
        userQuest: expect.objectContaining({
          status: 'in_progress',
          quest: expect.objectContaining({ id: TEST_QUEST.id }),
        }),
      }),
    );
    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: currentUserId },
        select: { totalPoints: true },
      }),
    ).resolves.toEqual({
      totalPoints: INITIAL_TOTAL_POINTS + TEST_QUEST.acceptPoint,
    });

    const secondResponse = await app.request(
      `/api/quests/${TEST_QUEST.id}/accept`,
      {
        method: 'POST',
        headers: authenticatedHeaders(authCookie),
      },
    );

    expect(secondResponse.status).toBe(409);
    await expect(secondResponse.json()).resolves.toEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'QUEST_ALREADY_ACCEPTED',
        }),
      }),
    );

    await expect(
      prisma.userQuest.count({
        where: {
          userId: currentUserId,
          questId: TEST_QUEST.id,
        },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.activityLog.count({
        where: {
          userId: currentUserId,
          questId: TEST_QUEST.id,
          type: 'QUEST_ACCEPTED',
        },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: currentUserId },
        select: { totalPoints: true },
      }),
    ).resolves.toEqual({
      totalPoints: INITIAL_TOTAL_POINTS + TEST_QUEST.acceptPoint,
    });
  });
});
