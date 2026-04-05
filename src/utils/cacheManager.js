/**
 * Cache Manager for Bookmaker Odds
 * Implements localStorage caching with TTL (Time To Live)
 * Reduces API calls and improves performance
 */

const CACHE_PREFIX = 'odds_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get cached data for a specific key
 * @param {string} key - Cache key
 * @returns {object|null} - Cached data or null if expired/not found
 */
export const getCache = (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    const { data, timestamp, ttl } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - timestamp > ttl) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

/**
 * Set cache data with TTL
 * @param {string} key - Cache key
 * @param {object} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 */
export const setCache = (key, data, ttl = DEFAULT_TTL) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl
    };

    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing to cache:', error);
    // If localStorage is full, clear old cache entries
    if (error.name === 'QuotaExceededError') {
      clearExpiredCache();
      // Try again after clearing
      try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        const cacheData = {
          data,
          timestamp: Date.now(),
          ttl
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (retryError) {
        console.error('Failed to cache even after cleanup:', retryError);
      }
    }
  }
};

/**
 * Clear specific cache entry
 * @param {string} key - Cache key
 */
export const clearCache = (key) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * Clear all expired cache entries
 * Useful for cleanup and managing localStorage quota
 */
export const clearExpiredCache = () => {
  try {
    const now = Date.now();
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp, ttl } = JSON.parse(cached);
            if (now - timestamp > ttl) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // If we can't parse it, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
};

/**
 * Clear all cache entries (for debugging or user-initiated cache clear)
 */
export const clearAllCache = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
};

/**
 * Get cache statistics
 * @returns {object} - Cache stats (total entries, size estimate)
 */
export const getCacheStats = () => {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));

    let totalSize = 0;
    const entries = [];

    cacheKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
          const { timestamp, ttl } = JSON.parse(value);
          entries.push({
            key: key.replace(CACHE_PREFIX, ''),
            age: Date.now() - timestamp,
            ttl
          });
        }
      } catch (error) {
        // Skip invalid entries
      }
    });

    return {
      count: entries.length,
      sizeKB: (totalSize / 1024).toFixed(2),
      entries
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { count: 0, sizeKB: '0', entries: [] };
  }
};

// Run cleanup on module load
clearExpiredCache();
