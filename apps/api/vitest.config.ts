import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      DATABASE_URL:
        'postgresql://studyquest:studyquest@localhost:5432/studyquest_test?schema=public',
    },
    include: ['tests/**/*.test.ts'],
  },
});
