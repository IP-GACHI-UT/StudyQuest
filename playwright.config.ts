import { defineConfig, devices } from '@playwright/test';

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://studyquest_test:studyquest_test@127.0.0.1:5433/studyquest_test?schema=public';

const testDb = new URL(databaseUrl);
if (
  testDb.protocol !== 'postgresql:' ||
  !['localhost', '127.0.0.1'].includes(testDb.hostname) ||
  !['5432', '5433'].includes(testDb.port) ||
  testDb.pathname !== '/studyquest_test' ||
  testDb.username !== 'studyquest_test' ||
  testDb.password !== 'studyquest_test' ||
  testDb.search !== '?schema=public' ||
  testDb.hash
)
  throw new Error('E2E requires the dedicated local studyquest_test database.');

process.env.DATABASE_URL = databaseUrl;

if (
  process.env.SMTP_HOST &&
  !['127.0.0.1', 'localhost'].includes(process.env.SMTP_HOST)
) {
  throw new Error('E2E requires local Mailpit SMTP.');
}
if (process.env.SMTP_PORT && process.env.SMTP_PORT !== '1025') {
  throw new Error('E2E requires local Mailpit on port 1025.');
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm dev:api',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NODE_ENV: 'development',
        DATABASE_URL: databaseUrl,
        APP_ORIGIN: 'http://localhost:3000',
        TRUSTED_PROXY_IPS: '127.0.0.1,::1',
        BETTER_AUTH_SECRET:
          process.env.BETTER_AUTH_SECRET ??
          'studyquest-e2e-secret-with-at-least-32-characters',
        SMTP_HOST: process.env.SMTP_HOST ?? '127.0.0.1',
        SMTP_PORT: process.env.SMTP_PORT ?? '1025',
        SMTP_SECURE: 'false',
        SMTP_USER: '',
        SMTP_PASSWORD: '',
        MAIL_FROM: 'StudyQuest <no-reply@studyquest.local>',
        MAIL_REPLY_TO: 'admin@gtowell.dev',
      },
    },
    {
      command: 'pnpm dev:web',
      url: 'http://localhost:3000',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        API_INTERNAL_URL: 'http://localhost:3001',
      },
    },
  ],
});
