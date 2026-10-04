import { prisma } from '@studyquest/db';
import { describe, expect, it, vi } from 'vitest';
import { app } from '../src/app.js';

describe('app', () => {
  it('returns health status', async () => {
    const response = await app.request('/api/health');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });
  it.each([
    null,
    [],
    123,
    'invalid',
  ])('rejects non-object study-log JSON: %j', async (body) => {
    const response = await app.request('/api/study-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toHaveProperty(
      'error.code',
      'INVALID_REQUEST_BODY',
    );
  });
  it.each([
    { minutes: 1.5 },
    { minutes: 1441 },
    { requestId: 'invalid' },
    { studiedAt: 123 },
    { studiedAt: '2026-01-01' },
    { studiedAt: '2026-02-30T12:00:00Z' },
  ])('rejects malformed study-log fields: %j', async (fields) => {
    const response = await app.request('/api/study-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questId: 'test', minutes: 1, ...fields }),
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toHaveProperty(
      'error.code',
      'VALIDATION_ERROR',
    );
  });
  it('returns a safe 500 response when retrieving logs fails', async () => {
    const mock = vi
      .spyOn(prisma.studyLog, 'findMany')
      .mockRejectedValueOnce(new Error('private database details'));
    try {
      const response = await app.request('/api/study-logs');
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '学習記録の取得に失敗しました。',
        },
      });
    } finally {
      mock.mockRestore();
    }
  });
});
