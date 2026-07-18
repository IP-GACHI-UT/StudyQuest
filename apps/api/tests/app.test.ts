import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

describe('app', () => {
  it('returns health status', async () => {
    const response = await app.request('/api/health');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });
});
