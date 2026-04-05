/**
 * Vercel Serverless Function - Odds proxy (kept semantically separate)
 */
import { handleRequestGuards, forwardSportmonks } from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) {
    return;
  }

  const { fixtureId, bookmakerId = 2 } = req.query;
  if (!fixtureId) {
    return res.status(400).json({ error: 'Fixture ID is required', code: 'MISSING_FIXTURE_ID' });
  }

  try {
    return await forwardSportmonks({
      res,
      path: `/odds/pre-match/fixtures/${fixtureId}/bookmakers/${bookmakerId}`,
      defaultParams: {
        include: 'market;bookmaker;fixture',
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch odds',
      code: 'ODDS_PROXY_ERROR',
      message: error.message,
    });
  }
}
