import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_TEST_DATABASE_URL =
  'postgresql://studyquest_test:studyquest_test@127.0.0.1:5433/studyquest_test?schema=public';
const TEST_DATABASE_NAME = 'studyquest_test';
const TEST_DATABASE_USER = 'studyquest_test';
const TEST_DATABASE_PASSWORD = 'studyquest_test';
const TEST_DATABASE_PORT = '5433';
const TEST_DATABASE_HOSTS = new Set(['127.0.0.1', 'localhost']);
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function validateTestDatabaseUrl(rawUrl) {
  let databaseUrl;

  try {
    databaseUrl = new URL(rawUrl);
  } catch {
    throw new Error('TEST_DATABASE_URL must be a valid PostgreSQL URL.');
  }

  const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));
  const username = decodeURIComponent(databaseUrl.username);
  const password = decodeURIComponent(databaseUrl.password);
  const schemaValues = databaseUrl.searchParams.getAll('schema');
  const hasOnlySchemaParameter = [...databaseUrl.searchParams.keys()].every(
    (key) => key === 'schema',
  );

  const isSafeTestDatabase =
    databaseUrl.protocol === 'postgresql:' &&
    TEST_DATABASE_HOSTS.has(databaseUrl.hostname) &&
    databaseUrl.port === TEST_DATABASE_PORT &&
    databaseName === TEST_DATABASE_NAME &&
    username === TEST_DATABASE_USER &&
    password === TEST_DATABASE_PASSWORD &&
    schemaValues.length === 1 &&
    schemaValues[0] === 'public' &&
    hasOnlySchemaParameter &&
    databaseUrl.hash === '';

  if (!isSafeTestDatabase) {
    throw new Error(
      'Refusing to use a database other than the dedicated local studyquest_test database on port 5433.',
    );
  }

  return databaseUrl.toString();
}

function runPnpm(args, environment) {
  const result = spawnSync('pnpm', args, {
    cwd: repositoryRoot,
    env: environment,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `pnpm command failed with exit code ${result.status ?? 1}.`,
    );
  }
}

function main() {
  const testDatabaseUrl = validateTestDatabaseUrl(
    process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL,
  );
  const testEnvironment = {
    ...process.env,
    DATABASE_URL: testDatabaseUrl,
    NODE_ENV: 'test',
  };

  console.log('Using the dedicated local studyquest_test database.');

  runPnpm(['prisma:generate'], testEnvironment);
  runPnpm(['--filter', '@studyquest/db', 'build'], testEnvironment);
  runPnpm(['exec', 'prisma', 'migrate', 'deploy'], testEnvironment);
  runPnpm(
    [
      'exec',
      'prisma',
      'migrate',
      'diff',
      '--from-config-datasource',
      '--to-schema',
      'prisma/schema.prisma',
      '--exit-code',
    ],
    testEnvironment,
  );
  runPnpm(
    [
      '--filter',
      '@studyquest/api',
      'exec',
      'vitest',
      'run',
      '--config',
      'vitest.db.config.ts',
    ],
    testEnvironment,
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
