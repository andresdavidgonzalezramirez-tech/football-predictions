/**
 * Vercel Serverless Function - Odds proxy (kept semantically separate)
 */
import { handleRequestGuards, forwardSportmonks, sendApiError } from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) {
    return;
  }

  const { fixtureId, bookmakerId = 2 } = req.query;
  if (!fixtureId) {
    return sendApiError(res, {
      status: 400,
      code: 'MISSING_FIXTURE_ID',
      message: 'Fixture ID is required',
    });
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
    return sendApiError(res, {
      status: 500,
      code: 'ODDS_PROXY_ERROR',
      message: 'Failed to fetch odds',
      context: { detail: error.message, fixtureId, bookmakerId },
    });
  }
}
