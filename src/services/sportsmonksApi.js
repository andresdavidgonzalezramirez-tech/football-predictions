import axios from 'axios';
import { getCache, setCache } from '../utils/cacheManager';
import { logApiRequest } from '../utils/apiMonitor';

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

const isRateLimitError = (error) => error?.response?.status === 429;

const mapApiError = (error, fallbackMessage) => {
  if (isRateLimitError(error)) {
    return {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit 429: agotaste las llamadas por entidad. Reintenta en unos minutos.',
      status: 429,
    };
  }

  if (error?.response?.status === 403 || error?.response?.status === 402) {
    return {
      code: 'ADDON_OR_PLAN_UNAVAILABLE',
      message: 'El plan actual no incluye este módulo (predictions/value-bets) o no está activo.',
      status: error.response.status,
    };
  }

  return {
    code: 'API_REQUEST_FAILED',
    message: fallbackMessage,
    status: error?.response?.status ?? 500,
  };
};

const fetchWithCache = async ({ cacheKey, endpoint, params = {}, ttl = 60_000, fallbackMessage }) => {
  const cached = getCache(cacheKey);
  if (cached) {
    logApiRequest(endpoint, true);
    return cached;
  }

  try {
    logApiRequest(endpoint, false);
    const response = await apiClient.get(endpoint, { params });
    setCache(cacheKey, response.data, ttl);
    return response.data;
  } catch (error) {
    throw mapApiError(error, fallbackMessage);
  }
};

export const getLeaguesWithUpcoming = async () => fetchWithCache({
  cacheKey: 'leagues_upcoming',
  endpoint: '/leagues',
  ttl: 120_000,
  fallbackMessage: 'No se pudo cargar el listado de ligas.',
});

export const getFixtureById = async (fixtureId) => fetchWithCache({
  cacheKey: `fixture_${fixtureId}`,
  endpoint: '/fixtures',
  params: { id: fixtureId },
  ttl: 180_000,
  fallbackMessage: `No se pudo cargar el fixture ${fixtureId}.`,
});

export const getProbabilitiesByFixture = async (fixtureId) => fetchWithCache({
  cacheKey: `probabilities_${fixtureId}`,
  endpoint: '/predictions',
  params: { fixtureId },
  ttl: 90_000,
  fallbackMessage: `No se pudieron cargar probabilities para fixture ${fixtureId}.`,
});

export const getValueBetsByFixture = async (fixtureId) => fetchWithCache({
  cacheKey: `valuebets_${fixtureId}`,
  endpoint: '/value-bets',
  params: { fixtureId },
  ttl: 90_000,
  fallbackMessage: `No se pudieron cargar value bets para fixture ${fixtureId}.`,
});

export const getGlobalValueBets = async (params = {}) => fetchWithCache({
  cacheKey: `valuebets_global_${JSON.stringify(params)}`,
  endpoint: '/value-bets',
  params,
  ttl: 60_000,
  fallbackMessage: 'No se pudieron cargar value bets globales.',
});

export const getOddsByFixture = async (fixtureId, bookmakerId = 2) => fetchWithCache({
  cacheKey: `odds_${fixtureId}_${bookmakerId}`,
  endpoint: '/odds',
  params: { fixtureId, bookmakerId },
  ttl: 120_000,
  fallbackMessage: `No se pudieron cargar odds para fixture ${fixtureId}.`,
});

export const getUsage = async () => fetchWithCache({
  cacheKey: 'usage_snapshot',
  endpoint: '/usage',
  ttl: 60_000,
  fallbackMessage: 'No se pudo cargar usage.',
});

export default apiClient;
