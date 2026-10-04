import { prisma } from '@studyquest/db';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import {
  authenticatedHeaders,
  createAuthenticatedTestUser,
  getSessionCookie,
  signInTestUser,
  TEST_PASSWORD,
} from './auth-test-helper.js';

const EMAILS = [
  'auth-flow@example.com',
  'auth-isolation-a@example.com',
  'auth-isolation-b@example.com',
] as const;
const TEST_QUEST_ID = 'test-auth-isolation-quest';

async function deleteAuthTestData() {
  await prisma.user.deleteMany({
    where: { email: { in: [...EMAILS] } },
  });
  await prisma.quest.deleteMany({ where: { id: TEST_QUEST_ID } });
}

afterEach(deleteAuthTestData);

afterAll(async () => {
  try {
    await deleteAuthTestData();
  } finally {
    await prisma.$disconnect();
  }
});

describe('email authentication', () => {
  it('stores a password hash and denies sign-in until email verification', async () => {
    const response = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: authenticatedHeaders('', true),
      body: JSON.stringify({
        email: EMAILS[0],
        password: TEST_PASSWORD,
        name: '認証フローテストユーザー',
        callbackURL: '/dashboard',
      }),
    });

    expect(response.status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: EMAILS[0] },
      include: { accounts: true },
    });
    expect(user.emailVerified).toBe(false);
    expect(user.accounts).toHaveLength(1);
    expect(user.accounts[0].password).not.toBe(TEST_PASSWORD);

    const signInResponse = await signInTestUser(EMAILS[0], TEST_PASSWORD);
    expect(signInResponse.status).toBe(403);
  });

  it('returns the same reset response and revokes sessions after password reset', async () => {
    const { cookie } = await createAuthenticatedTestUser({
      email: EMAILS[0],
      name: '再設定テストユーザー',
    });

    const knownResponse = await app.request(
      '/api/auth/request-password-reset',
      {
        method: 'POST',
        headers: authenticatedHeaders('', true),
        body: JSON.stringify({
          email: EMAILS[0],
          redirectTo: '/reset-password',
        }),
      },
    );
    const unknownResponse = await app.request(
      '/api/auth/request-password-reset',
      {
        method: 'POST',
        headers: authenticatedHeaders('', true),
        body: JSON.stringify({
          email: 'not-registered@example.com',
          redirectTo: '/reset-password',
        }),
      },
    );

    expect(knownResponse.status).toBe(200);
    expect(unknownResponse.status).toBe(200);
    expect(await knownResponse.json()).toEqual(await unknownResponse.json());

    const verification = await prisma.verification.findFirstOrThrow({
      where: { identifier: { startsWith: 'reset-password:' } },
      orderBy: { createdAt: 'desc' },
    });
    const token = verification.identifier.replace('reset-password:', '');
    const newPassword = 'a different secure passphrase 2026';
    const resetResponse = await app.request('/api/auth/reset-password', {
      method: 'POST',
      headers: authenticatedHeaders('', true),
      body: JSON.stringify({ token, newPassword }),
    });

    expect(resetResponse.status).toBe(200);
    const reusedTokenResponse = await app.request('/api/auth/reset-password', {
      method: 'POST',
      headers: authenticatedHeaders('', true),
      body: JSON.stringify({
        token,
        newPassword: 'unused secure passphrase 2026',
      }),
    });
    expect(reusedTokenResponse.status).toBe(400);

    const protectedResponse = await app.request('/api/profile', {
      headers: authenticatedHeaders(cookie),
    });
    expect(protectedResponse.status).toBe(401);
    const tamperedCookieResponse = await app.request('/api/profile', {
      headers: authenticatedHeaders(`${cookie}-tampered`),
    });
    expect(tamperedCookieResponse.status).toBe(401);
    expect((await signInTestUser(EMAILS[0], TEST_PASSWORD)).status).toBe(401);
    expect((await signInTestUser(EMAILS[0], newPassword)).status).toBe(200);

    await app.request('/api/auth/request-password-reset', {
      method: 'POST',
      headers: authenticatedHeaders('', true),
      body: JSON.stringify({
        email: EMAILS[0],
        redirectTo: '/reset-password',
      }),
    });
    const expiredVerification = await prisma.verification.findFirstOrThrow({
      where: { identifier: { startsWith: 'reset-password:' } },
      orderBy: { createdAt: 'desc' },
    });
    await prisma.verification.update({
      where: { id: expiredVerification.id },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
    const expiredToken = expiredVerification.identifier.replace(
      'reset-password:',
      '',
    );
    const expiredTokenResponse = await app.request('/api/auth/reset-password', {
      method: 'POST',
      headers: authenticatedHeaders('', true),
      body: JSON.stringify({
        token: expiredToken,
        newPassword: 'another unused secure passphrase 2026',
      }),
    });
    expect(expiredTokenResponse.status).toBe(400);
  });
});

describe('user data isolation', () => {
  it('rejects unauthenticated reads and writes for every personal API', async () => {
    for (const path of [
      '/api/profile',
      '/api/my-quests',
      '/api/study-logs',
      '/api/study-summary/weekly',
      '/api/board/quests',
      '/api/activities',
    ]) {
      const response = await app.request(path);
      expect(response.status, path).toBe(401);
      expect((await response.json()).error.code).toBe(
        'AUTHENTICATION_REQUIRED',
      );
    }
    for (const path of ['/api/study-logs', '/api/quests/not-owned/accept']) {
      const response = await app.request(path, {
        method: 'POST',
        headers: authenticatedHeaders('', true),
        body: JSON.stringify({ userId: 'fake-user' }),
      });
      expect(response.status, path).toBe(401);
    }
  });

  it('keeps study logs, rewards, and retries within the authenticated user', async () => {
    const first = await createAuthenticatedTestUser({
      email: EMAILS[1],
      name: 'ユーザーA',
    });
    const second = await createAuthenticatedTestUser({
      email: EMAILS[2],
      name: 'ユーザーB',
    });
    await prisma.quest.create({
      data: {
        id: TEST_QUEST_ID,
        title: '分離学習',
        description: '本人の記録を分離',
        category: 'テスト',
        estimatedMinutes: 10,
        xpReward: 25,
      },
    });
    const accepted = await app.request(`/api/quests/${TEST_QUEST_ID}/accept`, {
      method: 'POST',
      headers: authenticatedHeaders(first.cookie, true),
      body: JSON.stringify({ userId: second.userId }),
    });
    expect(accepted.status).toBe(201);
    const requestId = 'a52b60ef-0531-4dba-a4fa-41e52e5bd624';
    const body = {
      requestId,
      questId: TEST_QUEST_ID,
      minutes: 10,
      note: 'Aだけの学習メモ',
      userId: first.userId,
    };
    const save = (cookie: string, payload = body) =>
      app.request('/api/study-logs', {
        method: 'POST',
        headers: authenticatedHeaders(cookie, true),
        body: JSON.stringify(payload),
      });
    expect((await save(second.cookie)).status).toBe(400);
    expect((await save(first.cookie)).status).toBe(201);
    expect((await save(first.cookie)).status).toBe(201);
    expect((await save(second.cookie)).status).toBe(409);
    const aLogs = await app.request('/api/study-logs', {
      headers: authenticatedHeaders(first.cookie),
    });
    const bLogs = await app.request(`/api/study-logs?userId=${first.userId}`, {
      headers: authenticatedHeaders(second.cookie),
    });
    expect((await aLogs.json()).studyLogs).toHaveLength(1);
    expect((await bLogs.json()).studyLogs).toEqual([]);
    const aProfile = await app.request('/api/profile', {
      headers: authenticatedHeaders(first.cookie),
    });
    const bProfile = await app.request(`/api/profile?userId=${first.userId}`, {
      headers: authenticatedHeaders(second.cookie),
    });
    expect((await aProfile.json()).profile.totalXp).toBe(25);
    expect((await bProfile.json()).profile.totalStudyMinutes).toBe(0);
    const bAccept = await app.request(`/api/quests/${TEST_QUEST_ID}/accept`, {
      method: 'POST',
      headers: authenticatedHeaders(second.cookie),
    });
    expect(bAccept.status).toBe(201);
    const bBody = {
      ...body,
      requestId: '9c23a890-1808-4f6c-9333-1450a0760603',
      note: 'Bだけのメモ',
    };
    expect((await save(second.cookie, bBody)).status).toBe(201);
    const records = await prisma.studyLog.findMany({
      where: { questId: TEST_QUEST_ID },
      orderBy: { note: 'asc' },
    });
    expect(records.map((log) => [log.userId, log.note])).toEqual([
      [first.userId, body.note],
      [second.userId, bBody.note],
    ]);
  });

  it('denies expired sessions and restores access after signing in again', async () => {
    const user = await createAuthenticatedTestUser({
      email: EMAILS[0],
      name: '期限切れ学習者',
    });
    await prisma.session.updateMany({
      where: { userId: user.userId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(
      (
        await app.request('/api/study-logs', {
          headers: authenticatedHeaders(user.cookie),
        })
      ).status,
    ).toBe(401);
    const login = await signInTestUser(EMAILS[0], TEST_PASSWORD);
    expect(login.status).toBe(200);
    const newCookie = getSessionCookie(login);
    expect(newCookie).not.toBe(user.cookie);
    expect(
      (
        await app.request('/api/study-logs', {
          headers: authenticatedHeaders(newCookie),
        })
      ).status,
    ).toBe(200);
  });

  it('does not expose one user quests to another user', async () => {
    const firstUser = await createAuthenticatedTestUser({
      email: EMAILS[1],
      name: 'ユーザーA',
    });
    const secondUser = await createAuthenticatedTestUser({
      email: EMAILS[2],
      name: 'ユーザーB',
    });
    await prisma.quest.create({
      data: {
        id: TEST_QUEST_ID,
        title: '認証分離テストクエスト',
        description: 'ユーザーごとのデータ分離を確認します。',
        category: 'テスト',
        estimatedMinutes: 10,
      },
    });
    await prisma.userQuest.create({
      data: { userId: firstUser.userId, questId: TEST_QUEST_ID },
    });

    const firstResponse = await app.request('/api/my-quests', {
      headers: authenticatedHeaders(firstUser.cookie),
    });
    const secondResponse = await app.request('/api/my-quests', {
      headers: authenticatedHeaders(secondUser.cookie),
    });

    expect(firstResponse.status).toBe(200);
    expect((await firstResponse.json()).userQuests).toHaveLength(1);
    expect(secondResponse.status).toBe(200);
    expect((await secondResponse.json()).userQuests).toHaveLength(0);
  });
});
