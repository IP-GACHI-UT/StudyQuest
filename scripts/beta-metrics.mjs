import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { config } from 'dotenv';
import pg from 'pg';

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function parseDay(value) {
  requireCondition(
    typeof value === 'string' && /^20\d{2}-\d{2}-\d{2}$/.test(value),
    '日付はYYYY-MM-DDで指定してください。',
  );
  const calendar = new Date(`${value}T00:00:00Z`);
  requireCondition(
    !Number.isNaN(calendar.getTime()) &&
      calendar.toISOString().slice(0, 10) === value,
    '実在する日付を指定してください。',
  );
  return new Date(`${value}T00:00:00+09:00`);
}

export function parseMetricsOptions(args) {
  const values = new Map();
  const keys = new Set(['--participants', '--from', '--to', '--as-of']);
  requireCondition(
    args.length === 8,
    'participants/from/to/as-ofをすべて指定してください。',
  );
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    requireCondition(
      keys.has(key) && !values.has(key) && args[i + 1],
      '不正または重複した引数です。',
    );
    values.set(key, args[i + 1]);
  }
  const from = parseDay(values.get('--from'));
  const to = parseDay(values.get('--to'));
  const asOf = parseDay(values.get('--as-of'));
  requireCondition(
    from < to && to <= asOf,
    'from < to <= as-ofの順で指定してください。',
  );
  requireCondition(asOf <= new Date(), '未来の観測日は指定できません。');
  return { participants: values.get('--participants'), from, to, asOf };
}

export function validateParticipantIds(ids) {
  requireCondition(
    Array.isArray(ids) && ids.length > 0 && ids.length <= 1000,
    '参加者IDを1～1000件のJSON配列で指定してください。',
  );
  requireCondition(
    ids.every(
      (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id),
    ),
    '参加者はユーザーIDだけを指定してください。',
  );
  requireCondition(
    new Set(ids).size === ids.length,
    '参加者IDが重複しています。',
  );
  return ids;
}

function rate(numerator, denominator) {
  return {
    numerator,
    denominator,
    percent:
      denominator === 0
        ? null
        : Math.round((numerator / denominator) * 1000) / 10,
  };
}

// same client上の読み取り専用snapshot。行やユーザーIDを返さない。
export async function collectBetaMetrics(client, { ids, from, to, asOf }) {
  validateParticipantIds(ids);
  const sql = await readFile(
    new URL('./beta-metrics.sql', import.meta.url),
    'utf8',
  );
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {
    await client.query("SET LOCAL TIME ZONE 'UTC'");
    await client.query('SET LOCAL statement_timeout = 10000');
    const { rows } = await client.query(sql, [
      ids,
      from.toISOString(),
      to.toISOString(),
      asOf.toISOString(),
    ]);
    const counts = rows[0];
    await client.query('COMMIT');
    return {
      schemaVersion: 1,
      period: {
        timezone: 'Asia/Tokyo',
        from: from.toISOString(),
        toExclusive: to.toISOString(),
        observedBefore: asOf.toISOString(),
      },
      requestedParticipants: ids.length,
      counts,
      rates: {
        firstAccept: rate(counts.firstAccepted, counts.registered),
        firstSave: rate(counts.firstSaved, counts.registered),
        saveAfterAccept: rate(counts.acceptedAndSaved, counts.firstAccepted),
        saveWithin48h: rate(
          counts.savedWithin48h,
          counts.eligibleForFirstSave48h,
        ),
        reuseOnD7: rate(counts.reusedOnD7, counts.eligibleForD7),
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  const options = parseMetricsOptions(process.argv.slice(2));
  const ids = validateParticipantIds(
    JSON.parse(await readFile(options.participants, 'utf8')),
  );
  config({ quiet: true });
  requireCondition(
    process.env.DATABASE_URL,
    '読み取り先のDATABASE_URLを設定してください。',
  );
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
  });
  try {
    await client.connect();
    const report = await collectBetaMetrics(client, { ...options, ids });
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await client.end();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch(() => {
    // 例外や接続URL、参加者ファイルの本文は出力しない。
    console.error(
      'β集計に失敗しました。引数・日付・参加者JSON・DB接続/権限を確認してください。',
    );
    process.exitCode = 1;
  });
}
