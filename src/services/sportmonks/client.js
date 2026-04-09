import axios from 'axios';
import { getCache, setCache, shouldCacheData } from '../../utils/cacheManager';
import { logApiRequest } from '../../utils/apiMonitor';

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

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const DATA_CONTRACT_SCHEMA = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      properties: {
        odds: { type: 'array' },
        probabilities: { type: 'array' },
        predictions: { type: 'array' },
        stats: { type: 'array' },
      },
    },
  },
};

const validateAgainstSchema = (payload, schema) => {
  if (!payload || typeof payload !== 'object') return false;
  if (schema.required?.some((field) => payload[field] === undefined)) return false;

  const data = payload.data;
  if (!data || typeof data !== 'object') return false;

  const props = schema.properties?.data?.properties ?? {};
  return Object.entries(props).every(([propName, propRule]) => {
    if (data[propName] === undefined) return false;
    if (propRule.type === 'array') return Array.isArray(data[propName]);
    return true;
  });
};

const hasUnifiedKeys = (payload) => {
  const data = payload?.data;
  if (!data || typeof data !== 'object') return false;

  return Object.prototype.hasOwnProperty.call(data, 'probabilities')
    || Object.prototype.hasOwnProperty.call(data, 'predictions')
    || Object.prototype.hasOwnProperty.call(data, 'odds')
    || Object.prototype.hasOwnProperty.call(data, 'stats');
};

const normalizeUnifiedContract = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  if (!hasUnifiedKeys(payload)) return payload;

  const rawData = payload.data && typeof payload.data === 'object' ? payload.data : {};
  const probabilities = ensureArray(rawData.probabilities ?? rawData.predictions);

  return {
    ...payload,
    data: {
      ...rawData,
      probabilities,
      predictions: probabilities,
      odds: ensureArray(rawData.odds),
      stats: ensureArray(rawData.stats),
    },
  };
};

export const fetchFromSportmonks = async ({
  cacheKey,
  endpoint,
  params = {},
  ttl = 60_000,
  fallbackMessage = 'No se pudo completar la solicitud.',
}) => {
  const cached = cacheKey ? getCache(cacheKey) : null;
  if (cached) {
    logApiRequest(endpoint, true);
    return cached;
  }

  try {
    logApiRequest(endpoint, false);
    const response = await apiClient.get(endpoint, { params });
    const normalized = normalizeUnifiedContract(response.data);
    const payloadToReturn = validateAgainstSchema(normalized, DATA_CONTRACT_SCHEMA)
      ? normalized
      : response.data;

    if (cacheKey && isValidPayload(payloadToReturn)) {
      setCache(cacheKey, payloadToReturn, ttl);
    }

    return payloadToReturn;
  } catch (error) {
    throw mapApiError(error, fallbackMessage);
  }
};

export default apiClient;
