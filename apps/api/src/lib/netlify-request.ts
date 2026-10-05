import { isIP } from 'node:net';
import { NETLIFY_CLIENT_IP_HEADER } from './api-runtime.js';

type FetchHandler = (request: Request) => Response | Promise<Response>;

// The platform context is trusted; request headers are supplied by the caller.
export async function handleNetlifyRequest(
  request: Request,
  context: { ip: string },
  fetch: FetchHandler,
): Promise<Response> {
  if (!isIP(context.ip)) {
    return Response.json(
      {
        error: {
          code: 'CLIENT_IP_UNAVAILABLE',
          message: '接続元を確認できません。',
        },
      },
      {
        status: 503,
        headers: {
          'cache-control': 'private, no-store',
          'netlify-cdn-cache-control': 'no-store',
        },
      },
    );
  }

  const headers = new Headers(request.headers);
  headers.delete('forwarded');
  headers.delete('x-forwarded-for');
  headers.delete('x-real-ip');
  headers.set(NETLIFY_CLIENT_IP_HEADER, context.ip);
  const original = await fetch(new Request(request, { headers }));
  // Redirect responses may have immutable headers. Copy without reading the body.
  const response = new Response(original.body, original);
  response.headers.set('cache-control', 'private, no-store');
  response.headers.set('netlify-cdn-cache-control', 'no-store');
  return response;
}
