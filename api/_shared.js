/* eslint-env node */
export const SPORTMONKS_BASE = 'https://api.sportmonks.com/v3/football';
export const SPORTMONKS_CORE_BASE = 'https://api.sportmonks.com/v3';
export const PLAN_RESTRICTED_STATUSES = new Set([402, 403]);

export const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export const getApiToken = () => process.env.SPORTMONKS_API_TOKEN || process.env.VITE_SPORTMONKS_API_TOKEN;

export const sendApiError = (res, {
  status = 500,
  code = 'INTERNAL_ERROR',
  message = 'Unexpected server error',
  context = {},
}) => {
  return res.status(status).json({
    error: true,
    code,
    message,
    status,
    context,
  });
};

export const handleRequestGuards = (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }

  if (req.method !== 'GET') {
    sendApiError(res, {
      status: 405,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed',
      context: { method: req.method },
    });
    return false;
  }

  const token = getApiToken();
  if (!token) {
    sendApiError(res, {
      status: 500,
      code: 'TOKEN_MISSING',
      message: 'API token not configured',
      context: { envVar: 'SPORTMONKS_API_TOKEN' },
    });
    return false;
  }

  return true;
};

export const forwardSportmonks = async ({
  res,
  path,
  query = {},
  defaultParams = {},
  baseUrl = SPORTMONKS_BASE,
}) => {
  const token = getApiToken();
  const params = new URLSearchParams({
    ...defaultParams,
    ...query,
    api_token: token,
  });

  const url = `${baseUrl}${path}?${params.toString()}`;

  const response = await fetch(url);
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 429) {
    return sendApiError(res, {
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit reached for this entity. Retry with backoff.',
      context: { upstreamStatus: 429, path, query },
    });
  }

  if (!response.ok) {
    const fallbackCode = PLAN_RESTRICTED_STATUSES.has(response.status)
      ? 'PLAN_RESTRICTED'
      : 'SPORTMONKS_REQUEST_FAILED';
    const fallbackMessage = PLAN_RESTRICTED_STATUSES.has(response.status)
      ? 'The current Sportmonks plan does not include this module or addon.'
      : 'Sportmonks request failed.';

    return sendApiError(res, {
      status: response.status,
      code: data?.code || fallbackCode,
      message: data?.message || fallbackMessage,
      context: {
        upstreamStatus: response.status,
        path,
        query,
        upstreamError: data,
      },
    });
  }

  return res.status(response.status).json(data);
};
