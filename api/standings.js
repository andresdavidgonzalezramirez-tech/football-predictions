/**
 * Vercel Serverless Function - Standings by season proxy
 */
import { handleRequestGuards, forwardSportmonks, sendApiError } from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) return;

  const { seasonId, ...restQuery } = req.query;
  if (!seasonId) {
    return sendApiError(res, {
      status: 400,
      code: 'MISSING_SEASON_ID',
      message: 'seasonId is required',
    });
  }

  try {
    return await forwardSportmonks({
      res,
      path: `/standings/seasons/${seasonId}`,
      query: restQuery,
      defaultParams: {
        include: 'participant;details.type',
      },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      code: 'STANDINGS_PROXY_ERROR',
      message: 'Failed to fetch standings',
      context: { detail: error.message, seasonId },
    });
  }
}
