import { prisma } from '@studyquest/db';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  collectBetaMetrics,
  parseMetricsOptions,
  validateParticipantIds,
} from '../../../scripts/beta-metrics.mjs';

const ids = [
  'test-beta-a',
  'test-beta-b',
  'test-beta-c',
  'test-beta-d',
  'test-beta-outside',
];
const excludedId = 'test-beta-not-participant';
const questId = 'test-beta-metrics-quest';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const day = (date: string) => new Date(`${date}T00:00:00+09:00`);
async function cleanup() {
  await prisma.user.deleteMany({ where: { id: { in: [...ids, excludedId] } } });
  await prisma.quest.deleteMany({ where: { id: questId } });
}

beforeAll(async () => {
  await cleanup();
  await client.connect();
  await prisma.quest.create({
    data: {
      id: questId,
      title: 'βのダミー',
      description: '集計境界',
      category: 'テスト',
      estimatedMinutes: 1,
    },
  });
  for (const [index, id] of [...ids, excludedId].entries()) {
    await prisma.user.create({
      data: {
        id,
        displayName: '出力しないダミー氏名',
        email: `${id}@example.com`,
        createdAt: new Date(
          index === 4 ? '2026-01-03T00:00:00Z' : `2026-01-01T0${index}:00:00Z`,
        ),
      },
    });
    if (index !== 3)
      await prisma.userQuest.create({
        data: {
          id: `${id}-quest`,
          userId: id,
          questId,
          acceptedAt: new Date('2026-01-01T06:00:00Z'),
        },
      });
  }
  const logs: Array<[string, string, string]> = [
    [ids[0], 'first-a', '2026-01-01T15:00:00Z'],
    [ids[0], 'before-d7-a', '2026-01-08T14:59:59.999Z'],
    [ids[0], 'start-d7-a', '2026-01-08T15:00:00Z'],
    [ids[0], 'second-d7-a', '2026-01-08T16:00:00Z'],
    [ids[1], 'first-b', '2026-01-03T01:00:00Z'],
    [ids[1], 'end-d7-b', '2026-01-10T15:00:00Z'],
    [ids[2], 'first-c', '2026-01-08T00:00:00Z'],
    [excludedId, 'not-participant', '2026-01-01T10:00:00Z'],
  ];
  for (const [userId, id, createdAt] of logs) {
    await prisma.studyLog.create({
      data: {
        id: `test-beta-${id}`,
        userId,
        questId,
        userQuestId: `${userId}-quest`,
        minutes: 1,
        note: '出力しない個人メモ',
        createdAt: new Date(createdAt),
        studiedAt: new Date('2026-01-09T00:00:00Z'),
      },
    });
  }
});
afterAll(async () => {
  await client.end();
  await cleanup();
  await prisma.$disconnect();
});

describe('無料βの匿名集計', () => {
  it('対象・登録期間・保存時刻・D7境界と同一利用者の重複を区別する', async () => {
    const report = await collectBetaMetrics(client, {
      ids,
      from: day('2026-01-01'),
      to: day('2026-01-03'),
      asOf: day('2026-01-12'),
    });
    expect(report.counts).toEqual({
      registered: 4,
      firstAccepted: 3,
      firstSaved: 3,
      acceptedAndSaved: 3,
      registeredWithoutAccept: 1,
      acceptedWithoutSave: 0,
      eligibleForFirstSave48h: 4,
      pendingFirstSave48h: 0,
      savedWithin48h: 1,
      eligibleForD7: 2,
      pendingD7: 1,
      reusedOnD7: 1,
    });
    expect(report.rates.reuseOnD7).toEqual({
      numerator: 1,
      denominator: 2,
      percent: 50,
    });
    expect(report.rates.saveWithin48h.percent).toBe(25);
    const output = JSON.stringify(report);
    for (const personal of [
      ...ids,
      excludedId,
      'example.com',
      '個人メモ',
      'ダミー氏名',
    ])
      expect(output).not.toContain(personal);
  });

  it('D7の一日が終わっていない人を分母と成功数へ入れない', async () => {
    const report = await collectBetaMetrics(client, {
      ids,
      from: day('2026-01-01'),
      to: day('2026-01-03'),
      asOf: day('2026-01-10'),
    });
    expect(report.counts.eligibleForD7).toBe(1);
    expect(report.counts.pendingD7).toBe(2);
    expect(report.rates.reuseOnD7).toEqual({
      numerator: 1,
      denominator: 1,
      percent: 100,
    });
  });

  it('観測期限後を除外し、未成熟・空の分母を0%にしない', async () => {
    const report = await collectBetaMetrics(client, {
      ids,
      from: day('2026-01-01'),
      to: day('2026-01-03'),
      asOf: day('2026-01-03'),
    });
    expect(report.counts.firstSaved).toBe(1);
    expect(report.counts.acceptedWithoutSave).toBe(2);
    expect(report.counts.pendingFirstSave48h).toBe(4);
    expect(report.rates.saveWithin48h.percent).toBeNull();
    expect(report.rates.reuseOnD7.percent).toBeNull();
    const empty = await collectBetaMetrics(client, {
      ids: ['test-beta-missing'],
      from: day('2026-01-01'),
      to: day('2026-01-03'),
      asOf: day('2026-01-12'),
    });
    expect(empty.counts.registered).toBe(0);
    expect(empty.rates.firstSave.percent).toBeNull();
  });

  it('不正日付・未指定/重複の参加者やメール指定を拒否する', () => {
    const args = [
      '--participants',
      '.local/beta.json',
      '--from',
      '2026-01-01',
      '--to',
      '2026-01-03',
      '--as-of',
      '2026-01-12',
    ];
    expect(parseMetricsOptions(args).from).toEqual(day('2026-01-01'));
    expect(() =>
      parseMetricsOptions(
        args.map((arg) => (arg === '2026-01-03' ? '2026-02-30' : arg)),
      ),
    ).toThrow();
    expect(() => parseMetricsOptions(args.slice(0, 6))).toThrow();
    expect(() => validateParticipantIds([])).toThrow();
    expect(() => validateParticipantIds(['a', 'a'])).toThrow();
    expect(() => validateParticipantIds(['personal@example.com'])).toThrow();
  });
});
