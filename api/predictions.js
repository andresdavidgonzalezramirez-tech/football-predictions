/**
 * Vercel Serverless Function - Unified probabilities proxy
 * Fail-safe contract: always returns data.odds, data.probabilities, data.predictions, data.stats.
 */
import {
  PLAN_RESTRICTED_STATUSES,
  SPORTMONKS_BASE,
  getApiToken,
  handleRequestGuards,
  sendApiError,
} from './_shared.js';

const DEFAULT_BOOKMAKER_ID = 2;

const DEFAULT_ODDS_INCLUDE = [
  'market',
  'bookmaker',
  'fixture',
  'fixture.participants',
  'fixture.scores',
].join(';');

const DEFAULT_PROBABILITIES_INCLUDE = [
  'type',
  'fixture',
  'fixture.participants',
].join(';');

const DEFAULT_STATS_INCLUDE = [
  'participants',
  'statistics.type',
  'statistics.details.type',
].join(';');

const parseCollection = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const parseStats = (payload) => {
  const fixture = payload?.data ?? payload;
  const statsRows = fixture?.statistics?.data ?? fixture?.statistics;
  return Array.isArray(statsRows) ? statsRows : [];
};

const buildUrl = ({ path, query = {}, include, token }) => {
  const params = new URLSearchParams({
    ...query,
    include,
    api_token: token,
  });

  return `${SPORTMONKS_BASE}${path}?${params.toString()}`;
};

const fetchSportmonks = async ({ path, query, include, token }) => {
  const url = buildUrl({ path, query, include, token });
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { url, response, data };
};

const normalizeError = ({ module, result, fixtureId, bookmakerId }) => {
  if (!result) {
    return {
      module,
      status: 500,
      code: 'UPSTREAM_UNKNOWN_ERROR',
      message: 'Unknown upstream error',
      fixtureId,
      bookmakerId,
    };
  }

  const status = result.response?.status ?? 500;
  const restricted = PLAN_RESTRICTED_STATUSES.has(status);

  return {
    module,
    status,
    code: result.data?.code || (restricted ? 'PLAN_RESTRICTED' : 'SPORTMONKS_REQUEST_FAILED'),
    message: result.data?.message || (restricted
      ? 'The current Sportmonks plan does not include this module or addon.'
      : `Sportmonks request failed for ${module}.`),
    fixtureId,
    bookmakerId,
    url: result.url,
  };
};

export default async function handler(req, res) {
  if (!handleRequestGuards(req, res)) {
    return;
  }

  const { fixtureId, bookmakerId = DEFAULT_BOOKMAKER_ID, ...restQuery } = req.query;
  if (!fixtureId) {
    return sendApiError(res, {
      status: 400,
      code: 'MISSING_FIXTURE_ID',
      message: 'fixtureId is required',
    });
  }

  const token = getApiToken();

  try {
    const requests = [
      {
        module: 'probabilities',
        path: `/predictions/probabilities/fixtures/${fixtureId}`,
        include: DEFAULT_PROBABILITIES_INCLUDE,
      },
      {
        module: 'odds',
        path: `/odds/pre-match/fixtures/${fixtureId}/bookmakers/${bookmakerId}`,
        include: DEFAULT_ODDS_INCLUDE,
      },
      {
        module: 'stats',
        path: `/fixtures/${fixtureId}`,
        include: DEFAULT_STATS_INCLUDE,
      },
    ];

    const settled = await Promise.allSettled(
      requests.map((requestConfig) => fetchSportmonks({
        path: requestConfig.path,
        query: restQuery,
        include: requestConfig.include,
        token,
      })),
    );

    const moduleResults = requests.reduce((acc, requestConfig, index) => {
      const result = settled[index];
      if (result.status === 'fulfilled') {
        acc[requestConfig.module] = result.value;
      } else {
        acc[requestConfig.module] = null;
      }
      return acc;
    }, {});

    const errors = [];

    Object.entries(moduleResults).forEach(([module, result]) => {
      if (!result || !result.response?.ok) {
        const errorItem = normalizeError({
          module,
          result,
          fixtureId: Number(fixtureId),
          bookmakerId: Number(bookmakerId),
        });
        errors.push(errorItem);
        console.error('[SPORTMONKS_PROXY_ERROR]', errorItem);
      }
    });

    const probabilitiesRows = moduleResults.probabilities?.response?.ok
      ? parseCollection(moduleResults.probabilities.data)
      : [];
    const oddsRows = moduleResults.odds?.response?.ok ? parseCollection(moduleResults.odds.data) : [];
    const statsRows = moduleResults.stats?.response?.ok ? parseStats(moduleResults.stats.data) : [];

    const rateLimited = errors.find((errorItem) => errorItem.status === 429);
    const authError = errors.find((errorItem) => errorItem.status === 401);

    return res.status(200).json({
      fixtureId: Number(fixtureId),
      bookmakerId: Number(bookmakerId),
      status: errors.length ? 'partial' : 'ok',
      includes: {
        probabilities: DEFAULT_PROBABILITIES_INCLUDE,
        odds: DEFAULT_ODDS_INCLUDE,
        stats: DEFAULT_STATS_INCLUDE,
      },
      diagnostics: {
        authorizationHeaderSent: true,
        rateLimited: Boolean(rateLimited),
        authError: Boolean(authError),
        errors,
      },
      generatedAt: new Date().toISOString(),
      data: {
        probabilities: probabilitiesRows,
        predictions: probabilitiesRows,
        odds: oddsRows,
        stats: statsRows,
      },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      code: 'UNIFIED_PREDICTIONS_PROXY_ERROR',
      message: 'Failed to fetch unified probabilities data.',
      context: { detail: error.message, fixtureId, bookmakerId },
    });
  }
}
