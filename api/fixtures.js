/**
 * Vercel Serverless Function - Fixture detail proxy
 */
import { handleRequestGuards, forwardSportmonks } from './_shared.js';

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) {
    return;
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Fixture ID is required', code: 'MISSING_FIXTURE_ID' });
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
    return res.status(500).json({
      error: 'Failed to fetch fixture',
      code: 'FIXTURE_PROXY_ERROR',
      message: error.message,
    });
  }
}
