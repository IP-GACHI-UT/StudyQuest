import { describe, expect, it, vi } from 'vitest';
import { getApiRuntime, requireApiRuntime } from '../src/lib/api-runtime.js';
import { handleNetlifyRequest } from '../src/lib/netlify-request.js';

describe('Netlify request boundary', () => {
  it('uses the platform IP and preserves path, query, body, cookie and Origin', async () => {
    const request = new Request(
      'https://studyquest.example/api/study-logs?x=1',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: 'studyquest.session_token=synthetic',
          origin: 'https://studyquest.example',
          forwarded: 'for=192.0.2.1',
          'x-forwarded-for': '192.0.2.2, 127.0.0.1',
          'x-real-ip': '192.0.2.3',
          'x-studyquest-client-ip': '192.0.2.4',
        },
        body: JSON.stringify({ minutes: 5, memo: '検証用' }),
      },
    );
    const response = new Response('saved', { status: 201 });
    response.headers.append('set-cookie', 'a=1; HttpOnly');
    response.headers.append('set-cookie', 'b=2; HttpOnly');
    const returned = await handleNetlifyRequest(
      request,
      { ip: '203.0.113.200' },
      async (forwarded) => {
        expect(forwarded.url).toBe(request.url);
        expect(forwarded.method).toBe('POST');
        expect(await forwarded.json()).toEqual({ minutes: 5, memo: '検証用' });
        expect(forwarded.headers.get('cookie')).toBe(
          'studyquest.session_token=synthetic',
        );
        expect(forwarded.headers.get('origin')).toBe(
          'https://studyquest.example',
        );
        expect(forwarded.headers.get('x-studyquest-client-ip')).toBe(
          '203.0.113.200',
        );
        for (const header of ['forwarded', 'x-forwarded-for', 'x-real-ip']) {
          expect(forwarded.headers.has(header)).toBe(false);
        }
        return response;
      },
    );
    expect(await returned.text()).toBe('saved');
    expect(returned.status).toBe(201);
    expect(returned.headers.getSetCookie()).toEqual([
      'a=1; HttpOnly',
      'b=2; HttpOnly',
    ]);
    expect(returned.headers.get('cache-control')).toBe('private, no-store');
    expect(returned.headers.get('netlify-cdn-cache-control')).toBe('no-store');
  });

  it('accepts a platform IPv6 address', async () => {
    await handleNetlifyRequest(
      new Request('https://studyquest.example/api/health'),
      { ip: '2001:db8::1' },
      (request) => {
        expect(request.headers.get('x-studyquest-client-ip')).toBe(
          '2001:db8::1',
        );
        return new Response();
      },
    );
  });

  it('preserves a redirect whose original headers are immutable', async () => {
    const response = await handleNetlifyRequest(
      new Request('https://studyquest.example/api/auth/verify-email'),
      { ip: '203.0.113.200' },
      () => Response.redirect('https://studyquest.example/dashboard', 302),
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      'https://studyquest.example/dashboard',
    );
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it.each([
    '',
    'not-an-ip',
    '203.0.113.200, 203.0.113.201',
  ])('rejects an invalid platform IP before running Hono (%s)', async (ip) => {
    const fetch = vi.fn();
    const response = await handleNetlifyRequest(
      new Request('https://studyquest.example/api/health'),
      { ip },
      fetch,
    );
    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('rejects an unknown runtime and prevents starting the Node entry in Functions mode', () => {
    try {
      vi.stubEnv('STUDYQUEST_API_RUNTIME', 'netlify');
      vi.stubEnv('APP_ORIGIN', 'https://studyquest.example');
      expect(() => requireApiRuntime('node')).toThrow('requires');
      expect(() => requireApiRuntime('netlify')).not.toThrow();
      vi.stubEnv('STUDYQUEST_API_RUNTIME', 'wrong');
      expect(() => getApiRuntime()).toThrow('must be');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
