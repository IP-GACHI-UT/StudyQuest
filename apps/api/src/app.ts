import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { auth } from './lib/auth.js';
import { activitiesRoute } from './routes/activities.js';
import { healthRoute } from './routes/health.js';
import { profileRoute } from './routes/profile.js';
import { questBoardRoute } from './routes/quest-board.js';
import { questsRoute } from './routes/quests.js';
import { studyLogsRoute } from './routes/study-logs.js';
import { studySummaryRoute } from './routes/study-summary.js';
import { userQuestsRoute } from './routes/user-quests.js';

const DEFAULT_APP_ORIGIN = 'http://localhost:3000';

export const app = new Hono();
const appOrigin = process.env.APP_ORIGIN ?? DEFAULT_APP_ORIGIN;

app.use(
  '/api/*',
  cors({
    origin: appOrigin,
    credentials: true,
  }),
);

app.use('/api/quests/*', csrf({ origin: appOrigin }));
app.use('/api/study-logs', csrf({ origin: appOrigin }));

app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

app.route('/api/health', healthRoute);
app.route('/api/activities', activitiesRoute);
app.route('/api/board/quests', questBoardRoute);
app.route('/api/profile', profileRoute);
app.route('/api/quests', questsRoute);
app.route('/api/my-quests', userQuestsRoute);
app.route('/api/study-logs', studyLogsRoute);
app.route('/api/study-summary', studySummaryRoute);
