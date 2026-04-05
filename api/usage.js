/**
 * Vercel Serverless Function - API usage proxy
 */
import { handleRequestGuards, forwardSportmonks } from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) {
    return;
  }

  try {
    return await forwardSportmonks({
      res,
      path: '/my/usage',
      query: req.query,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch usage',
      code: 'USAGE_PROXY_ERROR',
      message: error.message,
    });
  }
}
