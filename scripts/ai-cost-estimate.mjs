import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCALE = 1_000_000n;
const PRICING = new URL('../docs/ai-pricing.json', import.meta.url);
const OPTIONS = {
  '--input-tokens': ['inputTokens', 1, 1_000_000],
  '--output-tokens': ['outputTokens', 1, 100_000],
  '--requests': ['requests', 1, 100_000],
  '--budget-usd': ['budgetUsd', 0, 10_000],
  '--yen-per-usd': ['yenPerUsd', 0.000001, 10_000],
};

function requireValue(condition) {
  if (!condition) throw new Error('INVALID_ESTIMATE_INPUT');
}

export function decimalToMicro(value) {
  requireValue(
    typeof value === 'string' &&
      value.length <= 24 &&
      /^(0|[1-9]\d*)(\.\d{1,6})?$/.test(value),
  );
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(6, '0'));
}

export function parseArgs(args) {
  requireValue(args.length % 2 === 0);
  const parameters = {
    inputTokens: 3000,
    outputTokens: 1500,
    requests: 300,
    budgetUsd: '2',
    yenPerUsd: '160',
  };
  const seen = new Set();
  for (let index = 0; index < args.length; index += 2) {
    requireValue(Object.hasOwn(OPTIONS, args[index]));
    const option = OPTIONS[args[index]];
    requireValue(option !== undefined && !seen.has(args[index]));
    seen.add(args[index]);
    const [key, minimum, maximum] = option;
    const value = args[index + 1];
    if (key === 'budgetUsd' || key === 'yenPerUsd') {
      const amount = decimalToMicro(value);
      requireValue(
        amount >= BigInt(Math.round(minimum * Number(SCALE))) &&
          amount <= BigInt(maximum) * SCALE,
      );
      parameters[key] = value;
    } else {
      requireValue(/^(0|[1-9]\d*)$/.test(value));
      const amount = Number(value);
      requireValue(
        Number.isSafeInteger(amount) && amount >= minimum && amount <= maximum,
      );
      parameters[key] = amount;
    }
  }
  return parameters;
}

function ceilDivide(value, denominator) {
  return (value + denominator - 1n) / denominator;
}

function formatAmount(value, precision = 6) {
  const divisor = 10n ** BigInt(precision);
  return `${value / divisor}.${(value % divisor).toString().padStart(precision, '0')}`;
}

export function estimate(profile, parameters) {
  for (const [key, minimum, maximum] of [
    OPTIONS['--input-tokens'],
    OPTIONS['--output-tokens'],
    OPTIONS['--requests'],
  ]) {
    requireValue(
      Number.isSafeInteger(parameters[key]) &&
        parameters[key] >= minimum &&
        parameters[key] <= maximum,
    );
  }
  requireValue(decimalToMicro(parameters.budgetUsd) <= 10_000n * SCALE);
  const forex = decimalToMicro(parameters.yenPerUsd);
  requireValue(forex >= 1n && forex <= 10_000n * SCALE);
  requireValue(profile.tier === 'paid' && profile.processing === 'standard');
  const inputRate = decimalToMicro(profile.inputUsdPerMillion);
  const cachedRate = decimalToMicro(profile.cachedInputUsdPerMillion);
  const writeRate =
    profile.cacheWriteUsdPerMillion === null
      ? 0n
      : decimalToMicro(profile.cacheWriteUsdPerMillion);
  const outputRate = decimalToMicro(profile.outputUsdPerMillion);
  requireValue(inputRate > 0n && outputRate > 0n && cachedRate <= inputRate);
  // Input token partitions are disjoint. Use the largest ordinary/read/write rate,
  // rather than adding a write price to the ordinary input price for the same token.
  const largestInputRate = [inputRate, cachedRate, writeRate].reduce(
    (largest, rate) => (rate > largest ? rate : largest),
    0n,
  );
  const perRequest = ceilDivide(
    BigInt(parameters.inputTokens) * largestInputRate +
      BigInt(parameters.outputTokens) * outputRate,
    SCALE,
  );
  const total = perRequest * BigInt(parameters.requests);
  const budget = decimalToMicro(parameters.budgetUsd);
  const yenCents = ceilDivide(total * forex, 10_000_000_000n);
  return {
    provider: profile.provider,
    model: profile.model,
    processing: profile.processing,
    tier: profile.tier,
    reserveInputUsdPerMillion: formatAmount(largestInputRate),
    perRequestReserveMicroUsd: perRequest.toString(),
    perRequestReserveUsd: formatAmount(perRequest),
    totalReserveUsd: formatAmount(total),
    totalReserveYenAtAssumedRate: formatAmount(yenCents, 2),
    withinAssumedTokenBudget: total <= budget,
    maximumRequestsWithinAssumedBudget: (budget / perRequest).toString(),
    sources: profile.sources,
  };
}

export async function loadPricing() {
  const pricing = JSON.parse(await readFile(PRICING, 'utf8'));
  requireValue(
    pricing.schemaVersion === 1 &&
      pricing.purpose === 'offline_comparison' &&
      pricing.selectedProvider === null &&
      typeof pricing.verifiedAt === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(pricing.verifiedAt) &&
      Array.isArray(pricing.profiles) &&
      pricing.profiles.length > 0,
  );
  for (const profile of pricing.profiles) {
    requireValue(
      typeof profile.provider === 'string' &&
        typeof profile.model === 'string' &&
        Array.isArray(profile.sources) &&
        profile.sources.length > 0,
    );
    for (const source of profile.sources) {
      const url = new URL(source);
      requireValue(
        url.protocol === 'https:' &&
          !url.username &&
          !url.password &&
          ['developers.openai.com', 'ai.google.dev'].includes(url.hostname),
      );
    }
  }
  return pricing;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log(
      'pnpm ai:estimate [--input-tokens N] [--output-tokens N] [--requests N] [--budget-usd USD] [--yen-per-usd JPY]\nOffline estimate only; no API calls, keys, DB access or payments.',
    );
    return;
  }
  try {
    const parameters = parseArgs(args);
    const pricing = await loadPricing();
    console.log(
      JSON.stringify(
        {
          kind: 'offline_estimate',
          pricingVerifiedAt: pricing.verifiedAt,
          selectedProvider: null,
          aiConnectionApproved: false,
          assumptions: {
            ...parameters,
            outputScope: 'all_billable_output_including_reasoning',
          },
          limitations: [
            '料金表のsnapshotと仮定による試算。現在の請求額・利用実績ではありません。',
            '税・為替手数料・最低入金・ツール・明示cache保存料金等は含みません。',
            'token上限・利用制限の実装や事業者の選択・支払いを承認するものではありません。',
          ],
          candidates: pricing.profiles.map((profile) =>
            estimate(profile, parameters),
          ),
        },
        null,
        2,
      ),
    );
  } catch {
    console.error('試算できませんでした。引数または料金表を確認してください。');
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
