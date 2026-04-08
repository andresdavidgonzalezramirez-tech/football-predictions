/**
 * Vercel Serverless Function - Teams proxy
 */
import { handleRequestGuards, forwardSportmonks, sendApiError } from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) return;

  try {
    return await forwardSportmonks({
      res,
      path: '/teams',
      query: req.query,
      defaultParams: {
        include: 'country;venue',
        per_page: 50,
      },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      code: 'TEAMS_PROXY_ERROR',
      message: 'Failed to fetch teams',
      context: { detail: error.message },
    });
  }
}
