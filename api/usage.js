/**
 * Vercel Serverless Function - API usage proxy
 */
import {
  handleRequestGuards,
  forwardSportmonks,
  SPORTMONKS_CORE_BASE,
  sendApiError,
} from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) {
    return;
  }

  try {
    return await forwardSportmonks({
      res,
      path: '/my/usage',
      query: req.query,
      baseUrl: SPORTMONKS_CORE_BASE,
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      code: 'USAGE_PROXY_ERROR',
      message: 'Failed to fetch usage',
      context: { detail: error.message },
    });
  }
}
