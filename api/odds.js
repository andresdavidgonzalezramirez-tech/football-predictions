/**
 * Vercel Serverless Function - Pre-match odds proxy
 */
import { handleRequestGuards, forwardSportmonks, sendApiError } from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) return;

  const { fixtureId, bookmakerId, ...restQuery } = req.query;
  if (!fixtureId || !bookmakerId) {
    return sendApiError(res, {
      status: 400,
      code: 'MISSING_ODDS_PARAMS',
      message: 'fixtureId and bookmakerId are required',
    });
  }

  try {
    return await forwardSportmonks({
      res,
      path: `/odds/pre-match/fixtures/${fixtureId}/bookmakers/${bookmakerId}`,
      query: restQuery,
      defaultParams: {
        include: 'market;bookmaker',
      },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      code: 'ODDS_PROXY_ERROR',
      message: 'Failed to fetch pre-match odds',
      context: { detail: error.message, fixtureId, bookmakerId },
    });
  }
}
