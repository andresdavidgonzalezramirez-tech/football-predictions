/**
 * Vercel Serverless Function - Fixture detail proxy
 */
import { handleRequestGuards, forwardSportmonks, sendApiError } from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) {
    return;
  }

  const { id } = req.query;
  if (!id) {
    return sendApiError(res, {
      status: 400,
      code: 'MISSING_FIXTURE_ID',
      message: 'Fixture ID is required',
    });
  }

  try {
    return await forwardSportmonks({
      res,
      path: `/fixtures/${id}`,
      defaultParams: {
        include: 'participants;league;venue;state;metadata',
        timezone: 'UTC',
      },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      code: 'FIXTURE_PROXY_ERROR',
      message: 'Failed to fetch fixture',
      context: { detail: error.message, fixtureId: id },
    });
  }
}
