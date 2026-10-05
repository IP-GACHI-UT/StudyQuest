import type { Context } from '@netlify/functions';
import { app } from './app.js';
import { requireApiRuntime } from './lib/api-runtime.js';
import { handleNetlifyRequest } from './lib/netlify-request.js';

requireApiRuntime('netlify');

export default function handler(
  request: Request,
  context: Pick<Context, 'ip'>,
) {
  return handleNetlifyRequest(request, context, app.fetch);
}
