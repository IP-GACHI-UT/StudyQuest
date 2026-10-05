export const NETLIFY_CLIENT_IP_HEADER = 'x-studyquest-client-ip';

export function getApiRuntime(): 'node' | 'netlify' {
  const runtime = process.env.STUDYQUEST_API_RUNTIME ?? 'node';
  if (runtime !== 'node' && runtime !== 'netlify') {
    throw new Error('STUDYQUEST_API_RUNTIME must be node or netlify.');
  }
  return runtime;
}

export function requireApiRuntime(expected: 'node' | 'netlify') {
  if (getApiRuntime() !== expected) {
    throw new Error(`This entry requires STUDYQUEST_API_RUNTIME=${expected}.`);
  }
  if (expected === 'netlify') {
    const origin = process.env.APP_ORIGIN;
    if (!origin) throw new Error('APP_ORIGIN is required for Netlify.');
    const url = new URL(origin);
    if (
      url.origin !== origin ||
      (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')
    ) {
      throw new Error(
        'APP_ORIGIN must be an origin; production requires HTTPS.',
      );
    }
  }
}
