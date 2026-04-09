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

export const getApiToken = () =>
  process.env.SPORTMONKS_API_TOKEN ||
  process.env.API_TOKEN ||
  process.env.VITE_SPORTMONKS_API_TOKEN;

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

export const fetchSportmonksPage = async ({
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

  return { response, data };
};

export const forwardSportmonksPaginated = async ({
  res,
  path,
  query = {},
  defaultParams = {},
  baseUrl = SPORTMONKS_BASE,
}) => {
  const requestedPerPage = Number(query.per_page ?? defaultParams.per_page ?? 50);
  const per_page = Number.isFinite(requestedPerPage)
    ? Math.min(Math.max(requestedPerPage, 1), 50)
    : 50;

  const firstQuery = { ...query, page: Number(query.page ?? 1), per_page };
  const allData = [];
  let pagination = null;

  for (let currentPage = firstQuery.page; currentPage < firstQuery.page + 100; currentPage += 1) {
    const { response, data } = await fetchSportmonksPage({
      path,
      query: { ...query, page: currentPage, per_page },
      defaultParams,
      baseUrl,
    });

    if (response.status === 429) {
      return sendApiError(res, {
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit reached for this entity. Retry with backoff.',
        context: { upstreamStatus: 429, path, query: { ...query, page: currentPage, per_page } },
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
          query: { ...query, page: currentPage, per_page },
          upstreamError: data,
        },
      });
    }

    const pageData = Array.isArray(data?.data) ? data.data : [];
    allData.push(...pageData);
    pagination = data?.pagination ?? pagination;

    const hasMore = Boolean(data?.pagination?.has_more);
    if (!hasMore) break;
  }

  return res.status(200).json({
    ...(pagination ? { pagination: { ...pagination, per_page, page: firstQuery.page, has_more: false } } : {}),
    data: allData,
  });
};