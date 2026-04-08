/**
 * Vercel Serverless Function - Fixture proxy
 * Supports detail by ID and by date.
 */
import { handleRequestGuards, forwardSportmonks, sendApiError } from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) {
    return;
  }

  const { id, date, ...restQuery } = req.query;

  try {
    if (id) {
      return await forwardSportmonks({
        res,
        path: `/fixtures/${id}`,
        query: restQuery,
        defaultParams: {
          include: 'participants;league;venue;state;metadata;scores;events;statistics.type',
          timezone: 'UTC',
        },
      });
    }

    if (date) {
      return await forwardSportmonks({
        res,
        path: `/fixtures/date/${date}`,
        query: restQuery,
        defaultParams: {
          include: 'participants;league;state;scores',
          timezone: 'UTC',
        },
      });
    }

    return sendApiError(res, {
      status: 400,
      code: 'MISSING_FIXTURE_QUERY',
      message: 'Provide id or date query param for fixtures endpoint.',
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      code: 'FIXTURE_PROXY_ERROR',
      message: 'Failed to fetch fixture data',
      context: { detail: error.message, fixtureId: id ?? null, date: date ?? null },
    });
  }
}
