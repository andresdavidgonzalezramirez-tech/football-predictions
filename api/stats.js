/**
 * Vercel Serverless Function - Fixture statistics proxy
 */
import { handleRequestGuards, forwardSportmonks, sendApiError } from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) return;

  const { fixtureId, ...restQuery } = req.query;
  if (!fixtureId) {
    return sendApiError(res, {
      status: 400,
      code: 'MISSING_FIXTURE_ID',
      message: 'fixtureId is required',
    });
  }

  try {
    return await forwardSportmonks({
      res,
      path: `/fixtures/${fixtureId}`,
      query: restQuery,
      defaultParams: {
        include: 'statistics.type;participants',
      },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      code: 'STATS_PROXY_ERROR',
      message: 'Failed to fetch statistics',
      context: { detail: error.message, fixtureId },
    });
  }
}
