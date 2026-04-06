/**
 * Vercel Serverless Function - Value bets proxy
 * Supports global value bets and by fixture.
 */
import { handleRequestGuards, forwardSportmonks, sendApiError } from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) {
    return;
  }

  const { fixtureId, ...restQuery } = req.query;
  const path = fixtureId
    ? `/predictions/value-bets/fixtures/${fixtureId}`
    : '/predictions/value-bets';

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
      code: 'VALUE_BETS_PROXY_ERROR',
      message: 'Failed to fetch value bets',
      context: { detail: error.message, fixtureId: fixtureId ?? null },
    });
  }
}
