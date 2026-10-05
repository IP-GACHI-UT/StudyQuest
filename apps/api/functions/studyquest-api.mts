import type { Config } from '@netlify/functions';
import handler from '../src/netlify.js';

// API behavior remains in apps/api/src; this is the Functions discovery entry.
export default handler;
export const config: Config = { path: ['/api', '/api/*'] };
