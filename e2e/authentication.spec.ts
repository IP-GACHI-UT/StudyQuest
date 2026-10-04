import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const MAILPIT_URL = 'http://127.0.0.1:8025';

test.setTimeout(90_000);

test.beforeEach(async ({ context }) => {
  const segment = Math.floor(Math.random() * 0xffff).toString(16);
  await context.setExtraHTTPHeaders({
    'x-forwarded-for': `2001:db8:${segment}::5678`,
  });
});

type MailpitMessageSummary = {
  ID: string;
  Subject: string;
  To: Array<{ Address: string }>;
};

type MailpitMessage = {
  Text: string;
};

async function waitForEmail(email: string, subject: string) {
  let messageId: string | undefined;

  await expect
    .poll(
      async () => {
        const response = await fetch(`${MAILPIT_URL}/api/v1/messages`);
        const body = (await response.json()) as {
          messages: MailpitMessageSummary[];
        };
        messageId = body.messages.find(
          (message) =>
            message.Subject === subject &&
            message.To.some((recipient) => recipient.Address === email),
        )?.ID;
        return messageId;
      },
      { timeout: 15_000 },
    )
    .not.toBeUndefined();

  const messageResponse = await fetch(
    `${MAILPIT_URL}/api/v1/message/${messageId}`,
  );
  return (await messageResponse.json()) as MailpitMessage;
}

function extractActionUrl(message: MailpitMessage) {
  const decodedText = message.Text.replaceAll('&amp;', '&');
  const match = decodedText.match(/https?:\/\/[^\s<]+/);

  if (!match) {
    throw new Error('Action URL was not found in the email.');
  }

  return match[0];
}

test('email verification, login, protection, and password reset', async ({
  page,
}) => {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `e2e-${unique}@example.com`;
  const password = `StudyQuest original passphrase ${unique}`;
  const newPassword = `StudyQuest changed passphrase ${unique}`;

  await page.goto('/signup');
  await page.getByLabel('表示名').fill('E2E学習者');
  await page.getByLabel('メールアドレス').fill(email);
  await page.getByLabel('パスワード', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'メールアドレスで登録' }).click();
  await expect(page).toHaveURL(/\/verify-email/);

  const verificationEmail = await waitForEmail(
    email,
    'StudyQuest メールアドレス確認',
  );
  await page.goto(extractActionUrl(verificationEmail));
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(
    page.getByRole('heading', { name: /今日も一歩進めましょう/ }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'ログアウト' }).click();
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);

  await page.goto('/login?next=https%3A%2F%2Fevil.example');
  await page.getByLabel('メールアドレス').fill(email);
  await page.getByLabel('パスワード', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole('button', { name: 'ログアウト' }).click();
  await page.goto('/forgot-password');
  await page.getByLabel('メールアドレス').fill(email);
  await page.getByRole('button', { name: '再設定メールを送る' }).click();
  await expect(page.getByText(/登録されている場合/)).toBeVisible();

  const resetEmail = await waitForEmail(email, 'StudyQuest パスワード再設定');
  await page.goto(extractActionUrl(resetEmail));
  await expect(page).toHaveURL(/\/reset-password\?token=/);
  await page.getByLabel('新しいパスワード', { exact: true }).fill(newPassword);
  await page.getByLabel('新しいパスワード（確認）').fill(newPassword);
  await page.getByRole('button', { name: 'パスワードを変更する' }).click();
  await expect(page.getByText('パスワードを変更しました。')).toBeVisible();

  await page.getByRole('link', { name: 'ログインする' }).click();
  await page.getByLabel('メールアドレス').fill(email);
  await page.getByLabel('パスワード', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await expect(
    page.getByText('メールアドレスまたはパスワードが正しくありません。', {
      exact: true,
    }),
  ).toBeVisible();

  await page.getByLabel('パスワード', { exact: true }).fill(newPassword);
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test('repeated sign-in attempts are rate limited per IP', async ({
  request,
}) => {
  const uniqueSegment = (Date.now() % 0xffff).toString(16);
  const forwardedIp = `2001:db8:${uniqueSegment}::1234`;
  const statuses: number[] = [];

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await request.post('/api/auth/sign-in/email', {
      data: {
        email: `rate-limit-${uniqueSegment}@example.com`,
        password: 'StudyQuest invalid passphrase',
      },
      headers: {
        origin: 'http://localhost:3000',
        'x-forwarded-for': forwardedIp,
      },
    });
    statuses.push(response.status());
  }

  expect(statuses.slice(0, 5)).not.toContain(429);
  expect(statuses[5]).toBe(429);
});

async function registerLearner(
  page: Page,
  email: string,
  password: string,
  name: string,
) {
  await page.goto('/signup');
  await expect(
    page.getByRole('button', { name: 'Google登録（準備中）' }),
  ).toBeDisabled();
  await page.getByLabel('表示名').fill(name);
  await page.getByLabel('メールアドレス').fill(email);
  await page.getByLabel('パスワード', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'メールアドレスで登録' }).click();
  await expect(page).toHaveURL(/\/verify-email/);
  await page.goto(
    extractActionUrl(
      await waitForEmail(email, 'StudyQuest メールアドレス確認'),
    ),
  );
  await expect(page).toHaveURL(/\/dashboard/);
}

test('separate browser sessions and expired-session study save recovery', async ({
  browser,
}) => {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const emailA = `e2e-a-${unique}@example.com`;
  const emailB = `e2e-b-${unique}@example.com`;
  const password = `StudyQuest isolated passphrase ${unique}`;
  const questId = `e2e-study-${unique}`;
  const contexts: BrowserContext[] = [];
  try {
    await prisma.quest.create({
      data: {
        id: questId,
        title: 'E2E認証学習',
        description: 'セッション復帰テスト',
        category: 'テスト',
        estimatedMinutes: 2,
        xpReward: 10,
      },
    });
    const segment = Math.floor(Math.random() * 0xffff).toString(16);
    const contextA = await browser.newContext({
      extraHTTPHeaders: { 'x-forwarded-for': `2001:db8:${segment}:1::1111` },
    });
    const contextB = await browser.newContext({
      extraHTTPHeaders: { 'x-forwarded-for': `2001:db8:${segment}:2::2222` },
    });
    contexts.push(contextA, contextB);
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    await registerLearner(pageA, emailA, password, 'E2EユーザーA');
    await registerLearner(pageB, emailB, password, 'E2EユーザーB');
    expect(
      (await contextA.request.post(`/api/quests/${questId}/accept`)).status(),
    ).toBe(403);
    const accepted = await contextA.request.post(
      `/api/quests/${questId}/accept`,
      { headers: { origin: 'http://localhost:3000' } },
    );
    expect(accepted.status()).toBe(201);
    await pageA.goto(`/study/${questId}`);
    await pageB.goto(`/study/${questId}`);
    await expect(
      pageB.getByText('このクエストは受注していません。'),
    ).toBeVisible();
    await pageA.getByRole('button', { name: '開始', exact: true }).click();
    await pageA.getByRole('button', { name: '終了して記録' }).click();
    await pageA.getByLabel('学習時間（分）').fill('2');
    await pageA
      .getByLabel('学習メモ（任意）')
      .fill('Aの入力を保持して再ログイン');
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: emailA },
    });
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await pageA
      .getByRole('button', { name: '学習記録を保存', exact: true })
      .click();
    await expect(
      pageA.getByRole('alert').filter({ hasText: 'ログインの有効期限' }),
    ).toBeVisible();
    await expect(pageA.getByLabel('学習メモ（任意）')).toHaveValue(
      'Aの入力を保持して再ログイン',
    );
    const popupPromise = contextA.waitForEvent('page');
    await pageA.getByRole('link', { name: '別タブで再ログイン' }).click();
    const loginPage = await popupPromise;
    await expect(loginPage).toHaveURL(/\/login\?next=%2Fstudy/);
    await loginPage.getByLabel('メールアドレス').fill(emailA);
    await loginPage.getByLabel('パスワード', { exact: true }).fill(password);
    await loginPage
      .getByRole('button', { name: 'ログイン', exact: true })
      .click();
    await expect(loginPage).toHaveURL(new RegExp(`/study/${questId}$`));
    await loginPage.close();
    await pageA
      .getByRole('button', { name: '保存を再試行', exact: true })
      .click();
    await expect(pageA.getByText('Aの入力を保持して再ログイン')).toBeVisible();
    await expect(pageA.getByText('このクエストは達成済み')).toBeVisible();
    const logsA = await contextA.request.get('/api/study-logs');
    const logsB = await contextB.request.get(
      `/api/study-logs?userId=${user.id}`,
    );
    expect((await logsA.json()).studyLogs).toHaveLength(1);
    expect((await logsB.json()).studyLogs).toEqual([]);
    expect(await prisma.studyLog.count({ where: { userId: user.id } })).toBe(1);
    await pageB.goto('/my-quest');
    await expect(
      pageB.getByText('受注中のクエストはまだありません。'),
    ).toBeVisible();
    await pageA.getByRole('button', { name: 'ログアウト' }).click();
    await pageA.goto(`/study/${questId}`);
    await expect(pageA).toHaveURL(/\/login\?next=%2Fstudy/);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
    await prisma.user.deleteMany({
      where: { email: { in: [emailA, emailB] } },
    });
    await prisma.quest.deleteMany({ where: { id: questId } });
    await prisma.$disconnect();
  }
});
