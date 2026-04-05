/**
 * API Request Monitor
 * Tracks API usage and helps identify rate limit issues
 */

const API_LOG_KEY = 'api_request_log';
const MAX_LOG_ENTRIES = 100;

/**
 * Log an API request
 * @param {string} endpoint - API endpoint
 * @param {boolean} cached - Whether the response was cached
 */
export const logApiRequest = (endpoint, cached = false) => {
  try {
    const log = getApiLog();
    const entry = {
      endpoint,
      timestamp: Date.now(),
      cached,
      date: new Date().toISOString()
    };

    log.push(entry);

    // Keep only last MAX_LOG_ENTRIES
    if (log.length > MAX_LOG_ENTRIES) {
      log.shift();
    }

    localStorage.setItem(API_LOG_KEY, JSON.stringify(log));
  } catch (error) {
    console.error('Error logging API request:', error);
  }
};

/**
 * Get API request log
 * @returns {Array} Log entries
 */
export const getApiLog = () => {
  try {
    const log = localStorage.getItem(API_LOG_KEY);
    return log ? JSON.parse(log) : [];
  } catch (error) {
    console.error('Error reading API log:', error);
    return [];
  }
};

/**
 * Get API usage statistics
 * @param {number} periodMinutes - Time period in minutes (default: 60)
 * @returns {object} Usage statistics
 */
export const getApiStats = (periodMinutes = 60) => {
  try {
    const log = getApiLog();
    const now = Date.now();
    const periodMs = periodMinutes * 60 * 1000;

    // Filter to recent requests
    const recentRequests = log.filter(entry => now - entry.timestamp < periodMs);

    // Count by endpoint
    const byEndpoint = {};
    recentRequests.forEach(entry => {
      if (!byEndpoint[entry.endpoint]) {
        byEndpoint[entry.endpoint] = { total: 0, cached: 0, live: 0 };
      }
      byEndpoint[entry.endpoint].total++;
      if (entry.cached) {
        byEndpoint[entry.endpoint].cached++;
      } else {
        byEndpoint[entry.endpoint].live++;
      }
    });

    const totalRequests = recentRequests.length;
    const cachedRequests = recentRequests.filter(r => r.cached).length;
    const liveRequests = totalRequests - cachedRequests;

    return {
      period: `${periodMinutes} minutes`,
      total: totalRequests,
      live: liveRequests,
      cached: cachedRequests,
      cacheHitRate: totalRequests > 0 ? ((cachedRequests / totalRequests) * 100).toFixed(1) : '0',
      byEndpoint
    };
  } catch (error) {
    console.error('Error calculating API stats:', error);
    return {
      period: `${periodMinutes} minutes`,
      total: 0,
      live: 0,
      cached: 0,
      cacheHitRate: '0',
      byEndpoint: {}
    };
  }
};

/**
 * Clear API request log
 */
export const clearApiLog = () => {
  try {
    localStorage.removeItem(API_LOG_KEY);
  } catch (error) {
    console.error('Error clearing API log:', error);
  }
};

/**
 * Check if approaching rate limit
 * SportMonks free tier typically has limits like 3000 requests/day
 * @param {number} dailyLimit - Daily API request limit
 * @returns {object} Rate limit status
 */
export const checkRateLimit = (dailyLimit = 3000) => {
  try {
    const stats = getApiStats(24 * 60); // Last 24 hours
    const percentUsed = (stats.live / dailyLimit) * 100;

    return {
      used: stats.live,
      limit: dailyLimit,
      remaining: Math.max(0, dailyLimit - stats.live),
      percentUsed: percentUsed.toFixed(1),
      warning: percentUsed > 80,
      critical: percentUsed > 95
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return {
      used: 0,
      limit: dailyLimit,
      remaining: dailyLimit,
      percentUsed: '0',
      warning: false,
      critical: false
    };
  }
};

/**
 * Display API stats in console (for debugging)
 */
export const printApiStats = () => {
  const stats = getApiStats(60);
  const rateLimit = checkRateLimit();

  console.log('=== API Usage Statistics ===');
  console.log(`Period: ${stats.period}`);
  console.log(`Total Requests: ${stats.total}`);
  console.log(`Live Requests: ${stats.live}`);
  console.log(`Cached Requests: ${stats.cached}`);
  console.log(`Cache Hit Rate: ${stats.cacheHitRate}%`);
  console.log('\nBy Endpoint:');
  Object.entries(stats.byEndpoint).forEach(([endpoint, counts]) => {
    console.log(`  ${endpoint}: ${counts.total} (${counts.live} live, ${counts.cached} cached)`);
  });
  console.log('\n=== Rate Limit (24h) ===');
  console.log(`Used: ${rateLimit.used}/${rateLimit.limit} (${rateLimit.percentUsed}%)`);
  console.log(`Remaining: ${rateLimit.remaining}`);
  if (rateLimit.critical) {
    console.warn('⚠️  CRITICAL: Approaching rate limit!');
  } else if (rateLimit.warning) {
    console.warn('⚠️  WARNING: Over 80% of rate limit used');
  }
};

// Make printApiStats available globally for debugging
if (typeof window !== 'undefined') {
  window.printApiStats = printApiStats;
}
