import { randomUUID } from 'node:crypto';
import { prisma } from '@studyquest/db';
import { hashPassword } from 'better-auth/crypto';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

vi.hoisted(() => {
  vi.stubEnv('STUDYQUEST_API_RUNTIME', 'netlify');
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('APP_ORIGIN', 'https://studyquest.example');
  vi.stubEnv(
    'BETTER_AUTH_SECRET',
    'studyquest-netlify-test-secret-at-least-32-characters',
  );
});

import handler from '../src/netlify.js';

const ORIGIN = 'https://studyquest.example';
const PASSWORD = 'correct horse battery staple 2026';
const EMAILS = ['netlify-a@example.com', 'netlify-b@example.com'];
const IPS = ['203.0.113.200', '203.0.113.201'];
const QUEST_ID = 'test-netlify-function-quest';

async function clean() {
  await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
  await prisma.quest.deleteMany({ where: { id: QUEST_ID } });
  await prisma.rateLimit.deleteMany({
    where: { OR: IPS.map((ip) => ({ key: { startsWith: `${ip}|` } })) },
  });
}

function request(path: string, options: RequestInit = {}, ip = IPS[0]) {
  const headers = new Headers(options.headers);
  if (!headers.has('origin')) headers.set('origin', ORIGIN);
  return handler(new Request(`${ORIGIN}${path}`, { ...options, headers }), {
    ip,
  });
}

async function login(email = EMAILS[0], ip = IPS[0]) {
  const response = await request(
    '/api/auth/sign-in/email',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: PASSWORD }),
    },
    ip,
  );
  expect(response.status).toBe(200);
  const setCookie = response.headers
    .getSetCookie()
    .find((value) => value.startsWith('__Secure-studyquest.session_token='));
  expect(setCookie).toContain('HttpOnly');
  expect(setCookie).toContain('Secure');
  expect(setCookie).toContain('SameSite=Lax');
  return setCookie?.split(';')[0] ?? '';
}

beforeEach(async () => {
  await clean();
  const password = await hashPassword(PASSWORD);
  for (const email of EMAILS) {
    const id = randomUUID();
    await prisma.user.create({
      data: {
        id,
        email,
        displayName: 'Functions検証用',
        emailVerified: true,
        accounts: {
          create: { providerId: 'credential', accountId: id, password },
        },
      },
    });
  }
  await prisma.quest.create({
    data: {
      id: QUEST_ID,
      title: 'Functions検証用',
      description: '合成データ',
      category: '検証',
      estimatedMinutes: 5,
      acceptPoint: 1,
      clearPoint: 2,
      xpReward: 5,
    },
  });
});

afterEach(clean);
afterAll(async () => {
  try {
    await clean();
  } finally {
    await prisma.$disconnect();
    vi.unstubAllEnvs();
  }
});

describe('Node Functions with the dedicated local DB', () => {
  it('keeps secure authentication, body, replay, progress and user isolation', async () => {
    expect((await request('/api/my-quests')).status).toBe(401);
    const cookie = await login();
    const headers = { cookie, 'content-type': 'application/json' };
    expect(
      (
        await request(`/api/quests/${QUEST_ID}/accept`, {
          method: 'POST',
          headers,
        })
      ).status,
    ).toBe(201);
    const body = JSON.stringify({
      requestId: randomUUID(),
      questId: QUEST_ID,
      minutes: 5,
      note: '検証用本文',
    });
    const saved = await request('/api/study-logs', {
      method: 'POST',
      headers,
      body,
    });
    const replay = await request('/api/study-logs', {
      method: 'POST',
      headers,
      body,
    });
    expect(saved.status).toBe(201);
    expect(await replay.json()).toEqual(await saved.json());
    expect(await prisma.studyLog.count({ where: { questId: QUEST_ID } })).toBe(
      1,
    );
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: EMAILS[0] },
    });
    expect(user.totalXp).toBe(5);
    expect(user.totalPoints).toBe(3);
    const own = await request('/api/my-quests', { headers: { cookie } });
    const ownBody = await own.json();
    expect(ownBody.userQuests[0].status).toBe('completed');
    expect(own.headers.get('cache-control')).toContain('no-store');
    const otherCookie = await login(EMAILS[1], IPS[1]);
    const other = await request(
      `/api/my-quests?userId=${user.id}`,
      { headers: { cookie: otherCookie } },
      IPS[1],
    );
    expect(await other.json()).toEqual({ userQuests: [] });
    const session = await prisma.session.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(session.ipAddress).toBe(IPS[0]);
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: new Date(0) },
    });
    expect(
      (await request('/api/my-quests', { headers: { cookie } })).status,
    ).toBe(401);
  });

  it('rejects a different Origin without accepting the quest', async () => {
    const cookie = await login();
    const response = await request(`/api/quests/${QUEST_ID}/accept`, {
      method: 'POST',
      headers: {
        cookie,
        origin: 'https://other.example',
        'content-type': 'text/plain',
      },
    });
    expect(response.status).toBe(403);
    expect(await prisma.userQuest.count({ where: { questId: QUEST_ID } })).toBe(
      0,
    );
    const authResponse = await request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        cookie,
        origin: 'https://other.example',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: EMAILS[0], password: PASSWORD }),
    });
    expect(authResponse.status).toBe(403);
  });

  it('does not let spoofed IP headers bypass the database rate limit or block another platform IP', async () => {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 6; attempt++) {
      const response = await request('/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': `192.0.2.${attempt + 1}`,
          'x-real-ip': `192.0.2.${attempt + 1}`,
          'x-studyquest-client-ip': `192.0.2.${attempt + 1}`,
        },
        body: JSON.stringify({
          email: EMAILS[0],
          password: 'incorrect test password',
        }),
      });
      statuses.push(response.status);
    }
    expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
    const cookie = await login(EMAILS[1], IPS[1]);
    expect(cookie).toContain('studyquest.session_token');
  });
});
