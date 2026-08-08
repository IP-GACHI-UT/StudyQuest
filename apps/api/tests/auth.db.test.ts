import { prisma } from '@studyquest/db';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import {
  authenticatedHeaders,
  createAuthenticatedTestUser,
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
