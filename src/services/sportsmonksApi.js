import axios from 'axios';
import { getCache, setCache, shouldCacheData } from '../utils/cacheManager';
import { logApiRequest } from '../utils/apiMonitor';

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

const isRateLimitError = (error) => error?.response?.status === 429;
const isPlanRestrictedStatus = (status) => status === 402 || status === 403;
const isResourceMissingStatus = (status) => status === 404;

const buildErrorKind = (status, code) => {
  if (isRateLimitError({ response: { status } })) return 'rate_limit';
  if (isPlanRestrictedStatus(status) || code === 'PLAN_RESTRICTED') return 'plan_restricted';
  if (isResourceMissingStatus(status)) return 'not_found';
  if (code === 'TOKEN_MISSING' || status === 401) return 'auth';
  return 'technical';
};

const mapApiError = (error, fallbackMessage) => {
  const status = error?.response?.status ?? error?.status ?? 500;
  const upstreamPayload = error?.response?.data;
  const upstreamCode = upstreamPayload?.code ?? error?.code ?? null;
  const upstreamMessage = upstreamPayload?.message ?? upstreamPayload?.error ?? error?.message ?? null;

  if (isRateLimitError(error)) {
    return {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit 429: agotaste las llamadas por entidad. Reintenta en unos minutos.',
      status: 429,
      kind: 'rate_limit',
    };
  }

  if (isPlanRestrictedStatus(status) || upstreamCode === 'PLAN_RESTRICTED') {
    return {
      code: upstreamCode || 'ADDON_OR_PLAN_UNAVAILABLE',
      message: 'El plan actual no incluye este módulo o addon, o no está activo.',
      status,
      kind: 'plan_restricted',
    };
  }

  if (isResourceMissingStatus(status)) {
    return {
      code: upstreamCode || 'RESOURCE_NOT_FOUND',
      message: upstreamMessage || 'El recurso solicitado no existe o no está disponible.',
      status,
      kind: 'not_found',
    };
  }

  if (upstreamCode === 'TOKEN_MISSING' || status === 401) {
    return {
      code: upstreamCode || 'AUTH_ERROR',
      message: upstreamMessage || 'Token inválido o no configurado.',
      status,
      kind: 'auth',
    };
  }

  return {
    code: upstreamCode || 'API_REQUEST_FAILED',
    message: upstreamMessage || fallbackMessage,
    status,
    kind: buildErrorKind(status, upstreamCode),
  };
};

const isValidPayload = (data) => {
  if (!shouldCacheData(data)) return false;
  if (typeof data !== 'object' || data === null) return true;
  if (data.error === true) return false;
  return true;
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
    if (isValidPayload(response.data)) {
      setCache(cacheKey, response.data, ttl);
    }
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

export const getUsage = async () => fetchWithCache({
  cacheKey: 'usage_snapshot',
  endpoint: '/usage',
  ttl: 60_000,
  fallbackMessage: 'No se pudo cargar usage.',
});

export default apiClient;
