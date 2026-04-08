/**
 * Vercel Serverless Function - Livescores proxy
 */
import { handleRequestGuards, forwardSportmonks, sendApiError } from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) return;

  try {
    return await forwardSportmonks({
      res,
      path: '/livescores/latest',
      query: req.query,
      defaultParams: {
        include: 'participants;scores;state;league',
      },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      code: 'LIVE_PROXY_ERROR',
      message: 'Failed to fetch livescores',
      context: { detail: error.message },
    });
  }
}
