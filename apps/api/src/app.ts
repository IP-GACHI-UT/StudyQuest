import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { activitiesRoute } from './routes/activities.js';
import { healthRoute } from './routes/health.js';
import { profileRoute } from './routes/profile.js';
import { questBoardRoute } from './routes/quest-board.js';
import { questsRoute } from './routes/quests.js';
import { studyLogsRoute } from './routes/study-logs.js';
import { studySummaryRoute } from './routes/study-summary.js';
import { userQuestsRoute } from './routes/user-quests.js';

const DEFAULT_CORS_ORIGIN = 'http://localhost:3000';

export const app = new Hono();
const corsOrigin = process.env.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN;

app.use(
  '/api/*',
  cors({
    origin: corsOrigin,
  }),
);

app.route('/api/health', healthRoute);
app.route('/api/activities', activitiesRoute);
app.route('/api/board/quests', questBoardRoute);
app.route('/api/profile', profileRoute);
app.route('/api/quests', questsRoute);
app.route('/api/my-quests', userQuestsRoute);
app.route('/api/study-logs', studyLogsRoute);
app.route('/api/study-summary', studySummaryRoute);
