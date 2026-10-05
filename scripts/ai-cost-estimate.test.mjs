import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  decimalToMicro,
  estimate,
  loadPricing,
  parseArgs,
} from './ai-cost-estimate.mjs';

const pricing = await loadPricing();
const openai = pricing.profiles.find(
  (profile) => profile.provider === 'openai',
);
const google = pricing.profiles.find(
  (profile) => profile.provider === 'google',
);
const cli = fileURLToPath(new URL('./ai-cost-estimate.mjs', import.meta.url));

test('default OpenAI reserve includes the largest cache write price', () => {
  const result = estimate(openai, parseArgs([]));
  assert.equal(result.reserveInputUsdPerMillion, '0.125000');
  assert.equal(result.perRequestReserveMicroUsd, '1125');
  assert.equal(result.totalReserveUsd, '0.337500');
  assert.equal(result.totalReserveYenAtAssumedRate, '54.00');
  assert.equal(result.maximumRequestsWithinAssumedBudget, '1777');
});

test('Google comparison uses paid standard prices including billable thinking output', () => {
  const result = estimate(google, parseArgs([]));
  assert.equal(result.perRequestReserveMicroUsd, '4650');
  assert.equal(result.totalReserveUsd, '1.395000');
  assert.equal(result.totalReserveYenAtAssumedRate, '223.20');
  assert.equal(result.maximumRequestsWithinAssumedBudget, '430');
  assert.equal(result.withinAssumedTokenBudget, true);
});

test('each request rounds upward before summing and yen rounds upward to cents', () => {
  const result = estimate(
    openai,
    parseArgs([
      '--input-tokens',
      '1',
      '--output-tokens',
      '1',
      '--requests',
      '3',
    ]),
  );
  assert.equal(result.perRequestReserveMicroUsd, '1');
  assert.equal(result.totalReserveUsd, '0.000003');
  assert.equal(result.totalReserveYenAtAssumedRate, '0.01');
});

test('budget comparison preserves a one micro-dollar boundary', () => {
  const exact = estimate(
    openai,
    parseArgs(['--requests', '1', '--budget-usd', '0.001125']),
  );
  const short = estimate(
    openai,
    parseArgs(['--requests', '1', '--budget-usd', '0.001124']),
  );
  assert.equal(exact.withinAssumedTokenBudget, true);
  assert.equal(exact.maximumRequestsWithinAssumedBudget, '1');
  assert.equal(short.withinAssumedTokenBudget, false);
  assert.equal(short.maximumRequestsWithinAssumedBudget, '0');
  assert.equal(
    estimate(openai, parseArgs(['--budget-usd', '0'])).withinAssumedTokenBudget,
    false,
  );
});

test('currency conversion uses the supplied assumption rather than a live exchange rate', () => {
  const result = estimate(openai, parseArgs(['--yen-per-usd', '100.000001']));
  assert.equal(result.totalReserveYenAtAssumedRate, '33.76');
});

test('amounts accept at most six decimal places and reject coercion', () => {
  assert.equal(decimalToMicro('0.000001'), 1n);
  assert.equal(decimalToMicro('123.456789'), 123456789n);
  for (const invalid of [
    '-1',
    '1e3',
    'NaN',
    'Infinity',
    '01',
    ' 2',
    '2 ',
    '.1',
    '0.0000001',
    '1'.repeat(25),
    2,
  ]) {
    assert.throws(() => decimalToMicro(invalid));
  }
});

test('CLI rejects unknown, duplicate, missing and fractional count options', () => {
  for (const args of [
    ['--api-key', 'dummy'],
    ['__proto__', 'x'],
    ['toString', 'x'],
    ['--requests'],
    ['--requests', '1', '--requests', '2'],
    ['--requests', '1.5'],
    ['--requests', '0'],
    ['--output-tokens', '100001'],
    ['--budget-usd', '10001'],
    ['--yen-per-usd', '0'],
  ]) {
    assert.throws(() => parseArgs(args));
  }
});

test('reserve rejects free/batch profiles and invalid direct parameters', () => {
  for (const profile of [
    { ...openai, tier: 'free' },
    { ...openai, processing: 'batch' },
    { ...openai, inputUsdPerMillion: '-1' },
    { ...openai, outputUsdPerMillion: '0' },
  ]) {
    assert.throws(() => estimate(profile, parseArgs([])));
  }
  for (const parameters of [
    { ...parseArgs([]), inputTokens: -1 },
    { ...parseArgs([]), requests: 0.1 },
    { ...parseArgs([]), yenPerUsd: '0' },
  ]) {
    assert.throws(() => estimate(openai, parameters));
  }
});

test('CLI runs outside the repository without credentials and reports no approval', () => {
  const run = spawnSync(process.execPath, [cli], {
    cwd: tmpdir(),
    encoding: 'utf8',
    env: { ...process.env, OPENAI_API_KEY: '', GEMINI_API_KEY: '' },
  });
  assert.equal(run.status, 0, run.stderr);
  const report = JSON.parse(run.stdout);
  assert.equal(report.kind, 'offline_estimate');
  assert.equal(report.selectedProvider, null);
  assert.equal(report.aiConnectionApproved, false);
  assert.equal(
    report.assumptions.outputScope,
    'all_billable_output_including_reasoning',
  );
  assert.equal(report.candidates.length, 2);
});

test('invalid arguments never echo argument payloads or credential environment variables', () => {
  const marker = 'synthetic-secret-marker-for-test';
  const run = spawnSync(process.execPath, [cli, '--requests', marker], {
    encoding: 'utf8',
    env: { ...process.env, OPENAI_API_KEY: marker },
  });
  assert.equal(run.status, 1);
  assert.equal(run.stdout, '');
  assert.match(run.stderr, /試算できませんでした/);
  assert.ok(!run.stderr.includes(marker));
  assert.ok(!run.stderr.includes('Error:'));
});

test('help succeeds without generating an estimate', () => {
  const run = spawnSync(process.execPath, [cli, '--help'], {
    encoding: 'utf8',
  });
  assert.equal(run.status, 0);
  assert.match(run.stdout, /Offline estimate only/);
  assert.ok(!run.stdout.includes('candidates'));
});
