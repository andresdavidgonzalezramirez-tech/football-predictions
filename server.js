/* eslint-env node */
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import leaguesHandler from './api/leagues.js';
import fixturesHandler from './api/fixtures.js';
import predictionsHandler from './api/predictions.js';
import valueBetsHandler from './api/value-bets.js';
import oddsHandler from './api/odds.js';
import usageHandler from './api/usage.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 3000);

const runHandler = (handler) => async (req, res) => handler(req, res);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.all('/api/leagues', runHandler(leaguesHandler));
app.all('/api/fixtures', runHandler(fixturesHandler));
app.all('/api/predictions', runHandler(predictionsHandler));
app.all('/api/value-bets', runHandler(valueBetsHandler));
app.all('/api/odds', runHandler(oddsHandler));
app.all('/api/usage', runHandler(usageHandler));

app.use(express.static(distDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`football-predictions listening on port ${port}`);
});
