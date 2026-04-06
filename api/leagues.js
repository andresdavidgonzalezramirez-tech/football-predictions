/**
 * Vercel Serverless Function - Leagues + upcoming fixtures proxy
 */
import { handleRequestGuards, forwardSportmonks, sendApiError } from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) {
    return;
  }

  try {
    return await forwardSportmonks({
      res,
      path: '/leagues',
      query: req.query,
      defaultParams: {
        include: 'country;upcoming.participants;upcoming.state;upcoming.metadata',
        timezone: 'UTC',
        per_page: '50',
      },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      code: 'LEAGUES_PROXY_ERROR',
      message: 'Failed to fetch leagues',
      context: { detail: error.message },
    });
  }
}
