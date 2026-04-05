/**
 * Vercel Serverless Function - Predictions probabilities proxy
 * Supports by fixture and generic list endpoint.
 */
import { handleRequestGuards, forwardSportmonks } from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) {
    return;
  }

  const { fixtureId, ...restQuery } = req.query;
  const path = fixtureId
    ? `/predictions/probabilities/fixtures/${fixtureId}`
    : '/predictions/probabilities';

  try {
    return await forwardSportmonks({
      res,
      path,
      query: restQuery,
      defaultParams: {
        include: 'type;fixture;fixture.participants;fixture.league',
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch probabilities',
      code: 'PREDICTIONS_PROXY_ERROR',
      message: error.message,
    });
  }
}
