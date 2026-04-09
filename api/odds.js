/**
 * Vercel Serverless Function - Unified fixture intelligence proxy
 * Returns odds + probabilities + advanced fixture stats in one response.
 * Fail-safe contract: always returns data.odds, data.predictions, and data.stats.
 */
import {
  PLAN_RESTRICTED_STATUSES,
  SPORTMONKS_BASE,
  fetchSportmonksPage,
  getApiToken,
  handleRequestGuards,
  sendApiError,
} from './_shared.js';

const DEFAULT_ODDS_INCLUDE = [
  'market',
  'bookmaker',
  'fixture',
  'fixture.participants',
  'fixture.scores',
].join(';');

const DEFAULT_PREDICTIONS_INCLUDE = [
  'type',
  'fixture',
  'fixture.participants',
].join(';');

const DEFAULT_STATS_INCLUDE = [
  'participants',
  'statistics.type',
  'statistics.details.type',
].join(';');

const parseRows = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const normalizeStatsRows = (fixturePayload) => {
  const fixture = fixturePayload?.data ?? fixturePayload;
  const stats = fixture?.statistics?.data ?? fixture?.statistics;
  return Array.isArray(stats) ? stats : [];
};

const buildUpstreamError = ({ response, data, module, fixtureId, bookmakerId }) => {
  const restricted = PLAN_RESTRICTED_STATUSES.has(response.status);
  return {
    status: response.status,
    code: data?.code || (restricted ? 'PLAN_RESTRICTED' : 'SPORTMONKS_REQUEST_FAILED'),
    message: data?.message || (restricted
      ? 'The current Sportmonks plan does not include this module or addon.'
      : `Sportmonks request failed for ${module}.`),
    context: {
      module,
      fixtureId,
      bookmakerId: bookmakerId ?? null,
      upstreamStatus: response.status,
      upstreamError: data ?? null,
    },
  };
};

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) return;

  const { fixtureId, bookmakerId, ...restQuery } = req.query;
  if (!fixtureId || !bookmakerId) {
    return sendApiError(res, {
      status: 400,
      code: 'MISSING_ODDS_PARAMS',
      message: 'fixtureId and bookmakerId are required',
      context: { fixtureId: fixtureId ?? null, bookmakerId: bookmakerId ?? null },
    });
  }

  const token = getApiToken();

  try {
    const [oddsResult, predictionsResult, statsResult] = await Promise.all([
      fetchSportmonksPage({
        path: `/odds/pre-match/fixtures/${fixtureId}/bookmakers/${bookmakerId}`,
        query: restQuery,
        defaultParams: { include: DEFAULT_ODDS_INCLUDE },
      }),
      fetchSportmonksPage({
        path: `/predictions/probabilities/fixtures/${fixtureId}`,
        query: restQuery,
        defaultParams: { include: DEFAULT_PREDICTIONS_INCLUDE, per_page: 50 },
      }),
      fetchSportmonksPage({
        path: `/fixtures/${fixtureId}`,
        query: restQuery,
        defaultParams: { include: DEFAULT_STATS_INCLUDE },
      }),
    ]);

    const modules = [
      { key: 'odds', result: oddsResult },
      { key: 'predictions', result: predictionsResult },
      { key: 'stats', result: statsResult },
    ];

    // Check for critical errors (429 Rate Limit)
    const rateLimited = modules.find(({ result }) => result.response.status === 429);
    if (rateLimited) {
      return sendApiError(res, {
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit reached for this entity. Retry with backoff.',
        context: { module: rateLimited.key, fixtureId, bookmakerId },
      });
    }

    // Check for other failures (401, 403, 404, etc.)
    const failed = modules.find(({ result }) => !result.response.ok);
    if (failed) {
      return sendApiError(res, buildUpstreamError({
        response: failed.result.response,
        data: failed.result.data,
        module: failed.key,
        fixtureId,
        bookmakerId,
      }));
    }

    // Success response with unified data structure
    return res.status(200).json({
      fixtureId: Number(fixtureId),
      bookmakerId: Number(bookmakerId),
      apiTokenConfigured: Boolean(token),
      status: 'ok',
      includes: {
        odds: DEFAULT_ODDS_INCLUDE,
        predictions: DEFAULT_PREDICTIONS_INCLUDE,
        stats: DEFAULT_STATS_INCLUDE,
      },
      generatedAt: new Date().toISOString(),
      data: {
        odds: parseRows(oddsResult.data),
        predictions: parseRows(predictionsResult.data),
        probabilities: parseRows(predictionsResult.data), // Aliased for backward compatibility
        stats: normalizeStatsRows(statsResult.data),
      },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      code: 'UNIFIED_ODDS_PROXY_ERROR',
      message: 'Failed to fetch unified fixture intelligence data.',
      context: {
        detail: error.message,
        fixtureId,
        bookmakerId,
      },
    });
  }
}
