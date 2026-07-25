import { prisma } from '@studyquest/db';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { DEVELOPMENT_USER_ID } from '../src/lib/auth.js';

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

async function deleteTestData() {
  await prisma.user.deleteMany({
    where: { id: DEVELOPMENT_USER_ID },
  });
  await prisma.quest.deleteMany({
    where: { id: TEST_QUEST.id },
  });
}

beforeEach(async () => {
  await deleteTestData();
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

describe('POST /api/quests/:questId/accept', () => {
  it('rejects accepting the same quest twice without duplicating database records', async () => {
    const firstResponse = await app.request(
      `/api/quests/${TEST_QUEST.id}/accept`,
      { method: 'POST' },
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

    const secondResponse = await app.request(
      `/api/quests/${TEST_QUEST.id}/accept`,
      { method: 'POST' },
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
          userId: DEVELOPMENT_USER_ID,
          questId: TEST_QUEST.id,
        },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.activityLog.count({
        where: {
          userId: DEVELOPMENT_USER_ID,
          questId: TEST_QUEST.id,
          type: 'QUEST_ACCEPTED',
        },
      }),
    ).resolves.toBe(1);
  });
});
