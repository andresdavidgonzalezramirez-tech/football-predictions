/**
 * Vercel Serverless Function - Value bets proxy
 * Supports global value bets and by fixture.
 */
import { handleRequestGuards, forwardSportmonks } from './_shared.js';

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
    return res.status(500).json({
      error: 'Failed to fetch value bets',
      code: 'VALUE_BETS_PROXY_ERROR',
      message: error.message,
    });
  }
}
