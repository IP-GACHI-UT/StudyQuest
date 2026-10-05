import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Only the dedicated test DB is allowed. No production URL or email is used.
const database = new URL(process.env.DATABASE_URL ?? '');
assert.equal(database.protocol, 'postgresql:');
assert.ok(['localhost', '127.0.0.1'].includes(database.hostname));
assert.equal(database.port, '5433');
assert.equal(database.pathname, '/studyquest_test');
assert.equal(database.username, 'studyquest_test');
assert.equal(database.password, 'studyquest_test');
assert.equal(process.env.STUDYQUEST_API_RUNTIME, 'netlify');
assert.equal(process.env.NODE_ENV, 'production');

const entry = pathToFileURL(
  resolve('.local/netlify-function-test/apps/api/functions/studyquest-api.mjs'),
);
const { default: handler, config } = await import(entry.href);
assert.deepEqual(config.path, ['/api', '/api/*']);
const origin = process.env.APP_ORIGIN;
const health = await handler(new Request(`${origin}/api/health`), {
  ip: '203.0.113.202',
});
assert.equal(health.status, 200);
const quests = await handler(new Request(`${origin}/api/quests`), {
  ip: '203.0.113.202',
});
assert.equal(quests.status, 200);
assert.ok(Array.isArray((await quests.json()).quests));
const protectedResponse = await handler(
  new Request(`${origin}/api/my-quests`),
  { ip: '203.0.113.202' },
);
assert.equal(protectedResponse.status, 401);
assert.equal(
  protectedResponse.headers.get('cache-control'),
  'private, no-store',
);
console.log(
  'Generated Functions handler: health 200, Prisma query 200, anonymous access 401.',
);
// Prisma owns a pool; smoke validation has finished and has no pending writes.
process.exit(0);
