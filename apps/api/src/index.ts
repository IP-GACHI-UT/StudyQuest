import { serve } from '@hono/node-server';
import { app } from './app.js';

const DEFAULT_API_PORT = 3001;

function getApiPort() {
  const rawPort = process.env.API_PORT;

  if (!rawPort) {
    return DEFAULT_API_PORT;
  }

  const port = Number.parseInt(rawPort, 10);

  if (Number.isNaN(port)) {
    throw new Error('API_PORT must be a number');
  }

  return port;
}

const port = getApiPort();

serve({
  fetch: app.fetch,
  port,
});

console.log(`StudyQuest API listening on http://localhost:${port}`);
