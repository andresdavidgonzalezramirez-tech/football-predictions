/**
 * Vercel Serverless Function - Tournaments (leagues) proxy
 */
import { handleRequestGuards, forwardSportmonks, sendApiError } from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) return;

  try {
    return await forwardSportmonks({
      res,
      path: '/leagues',
      query: req.query,
      defaultParams: {
        include: 'country;currentseason',
        per_page: 50,
      },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      code: 'TOURNAMENTS_PROXY_ERROR',
      message: 'Failed to fetch tournaments',
      context: { detail: error.message },
    });
  }
}
