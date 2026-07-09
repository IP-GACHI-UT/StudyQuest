import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { healthRoute } from './routes/health.js';
import { questsRoute } from './routes/quests.js';
import { studyLogsRoute } from './routes/study-logs.js';
import { studySummaryRoute } from './routes/study-summary.js';
import { userQuestsRoute } from './routes/user-quests.js';

const DEFAULT_API_PORT = 3001;
const DEFAULT_CORS_ORIGIN = 'http://localhost:3000';

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

const app = new Hono();
const corsOrigin = process.env.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN;

app.use(
  '/api/*',
  cors({
    origin: corsOrigin,
  }),
);

app.route('/api/health', healthRoute);
app.route('/api/quests', questsRoute);
app.route('/api/my-quests', userQuestsRoute);
app.route('/api/study-logs', studyLogsRoute);
app.route('/api/study-summary', studySummaryRoute);

const port = getApiPort();

serve({
  fetch: app.fetch,
  port,
});

console.log(`StudyQuest API listening on http://localhost:${port}`);
