/**
 * Vercel Serverless Function - Predictions probabilities proxy
 * Supports by fixture and generic list endpoint.
 */
import { handleRequestGuards, forwardSportmonks, sendApiError } from './_shared.js';

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
    return sendApiError(res, {
      status: 500,
      code: 'PREDICTIONS_PROXY_ERROR',
      message: 'Failed to fetch probabilities',
      context: { detail: error.message, fixtureId: fixtureId ?? null },
    });
  }
}
