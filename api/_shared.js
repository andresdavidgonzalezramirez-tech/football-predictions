export const SPORTMONKS_BASE = 'https://api.sportmonks.com/v3/football';

export const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export const getApiToken = () => process.env.VITE_SPORTMONKS_API_TOKEN;

export const handleRequestGuards = (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }

  const token = getApiToken();
  if (!token) {
    res.status(500).json({
      error: 'API token not configured',
      code: 'TOKEN_MISSING',
    });
    return false;
  }

  return true;
};

export const forwardSportmonks = async ({ res, path, query = {}, defaultParams = {} }) => {
  const token = getApiToken();
  const params = new URLSearchParams({
    ...defaultParams,
    ...query,
    api_token: token,
  });

  const url = `${SPORTMONKS_BASE}${path}?${params.toString()}`;

  const response = await fetch(url);
  const data = await response.json();

  if (response.status === 429) {
    return res.status(429).json({
      ...data,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit reached for this entity. Retry with backoff.',
    });
  }

  return res.status(response.status).json(data);
};
