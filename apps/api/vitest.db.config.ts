import { defineConfig } from 'vitest/config';

const TEST_DATABASE_NAME = 'studyquest_test';
const TEST_DATABASE_USER = 'studyquest_test';
const TEST_DATABASE_PASSWORD = 'studyquest_test';
const TEST_DATABASE_PORT = '5433';
const TEST_DATABASE_HOSTS = new Set(['127.0.0.1', 'localhost']);

function assertSafeTestDatabaseUrl(rawUrl: string | undefined) {
  if (!rawUrl) {
    throw new Error(
      'DATABASE_URL must be set by the DB test runner before DB tests start.',
    );
  }

  let databaseUrl: URL;

  try {
    databaseUrl = new URL(rawUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL.');
  }

  const schemaValues = databaseUrl.searchParams.getAll('schema');
  const hasOnlySchemaParameter = [...databaseUrl.searchParams.keys()].every(
    (key) => key === 'schema',
  );
  const isSafeTestDatabase =
    databaseUrl.protocol === 'postgresql:' &&
    TEST_DATABASE_HOSTS.has(databaseUrl.hostname) &&
    databaseUrl.port === TEST_DATABASE_PORT &&
    decodeURIComponent(databaseUrl.pathname.slice(1)) === TEST_DATABASE_NAME &&
    decodeURIComponent(databaseUrl.username) === TEST_DATABASE_USER &&
    decodeURIComponent(databaseUrl.password) === TEST_DATABASE_PASSWORD &&
    schemaValues.length === 1 &&
    schemaValues[0] === 'public' &&
    hasOnlySchemaParameter &&
    databaseUrl.hash === '';

  if (!isSafeTestDatabase) {
    throw new Error(
      'DB tests can only use the dedicated local studyquest_test database on port 5433.',
    );
  }
}

assertSafeTestDatabaseUrl(process.env.DATABASE_URL);

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    include: ['tests/**/*.db.test.ts'],
  },
});
