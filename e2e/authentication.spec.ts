import { expect, test } from '@playwright/test';

const MAILPIT_URL = 'http://127.0.0.1:8025';

type MailpitMessageSummary = {
  ID: string;
  Subject: string;
  To: Array<{ Address: string }>;
};

type MailpitMessage = {
  Text: string;
};

async function clearMailpit() {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: 'DELETE' });
}

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
  await clearMailpit();
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
