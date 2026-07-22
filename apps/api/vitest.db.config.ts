import { defineConfig } from 'vitest/config';

if (process.env.STUDYQUEST_DB_TEST !== '1') {
  throw new Error('DB tests must be started with pnpm test:api:db.');
}

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    include: ['tests/**/*.db.test.ts'],
  },
});
