import axios from 'axios';
import { getCache, setCache } from '../utils/cacheManager';
import { logApiRequest } from '../utils/apiMonitor';

/**
 * API Service using proxy endpoints to avoid CORS issues
 *
 * In development: Vite proxy forwards /api/* to SportMonks API
 * In production: Vercel serverless functions handle /api/* requests
 */

/**
 * Creates axios instance for proxy API calls
 */
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetches all leagues with upcoming fixtures
 * @returns {Promise} API response with leagues data
 */
export const getLeaguesWithUpcoming = async () => {
  try {
    const response = await apiClient.get('/leagues');
    return response.data;
  } catch (error) {
    console.error('Error fetching leagues:', error);
    throw error;
  }
};

/**
 * Fetches detailed fixture information by ID
 * Uses localStorage caching to reduce API calls (5 minute TTL)
 * @param {string|number} fixtureId - The fixture ID
 * @returns {Promise} API response with fixture details
 */
export const getFixtureDetails = async (fixtureId) => {
  try {
    const cacheKey = `fixture_${fixtureId}`;

    // Check cache first
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      console.log(`Using cached fixture details for ${fixtureId}`);
      logApiRequest('/fixtures', true); // Log cached request
      return cachedData;
    }

    // Cache miss - fetch from API
    console.log(`Fetching fixture details from API for ${fixtureId}`);
    logApiRequest('/fixtures', false); // Log live request
    const response = await apiClient.get('/fixtures', {
      params: {
        id: fixtureId,
      },
    });

    // Cache the response (5 minute TTL)
    setCache(cacheKey, response.data, 5 * 60 * 1000);

    return response.data;
  } catch (error) {
    console.error(`Error fetching fixture ${fixtureId}:`, error);
    throw error;
  }
};

/**
 * Fetches bookmaker odds for a specific fixture
 * Uses localStorage caching to reduce API calls (5 minute TTL)
 * @param {string|number} fixtureId - The fixture ID
 * @param {number} bookmakerId - The bookmaker ID (2 for Bet365, 23 for Unibet)
 * @returns {Promise} API response with odds data
 */
export const getBookmakerOdds = async (fixtureId, bookmakerId = 2) => {
  try {
    const cacheKey = `odds_${fixtureId}_${bookmakerId}`;

    // Check cache first
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      console.log(`Using cached odds for fixture ${fixtureId}, bookmaker ${bookmakerId}`);
      logApiRequest(`/odds/${bookmakerId}`, true); // Log cached request
      return cachedData;
    }

    // Cache miss - fetch from API
    console.log(`Fetching odds from API for fixture ${fixtureId}, bookmaker ${bookmakerId}`);
    logApiRequest(`/odds/${bookmakerId}`, false); // Log live request
    const response = await apiClient.get('/odds', {
      params: {
        fixtureId,
        bookmakerId,
      },
    });

    // Cache the response (5 minute TTL)
    setCache(cacheKey, response.data, 5 * 60 * 1000);

    return response.data;
  } catch (error) {
    console.error(`Error fetching odds for fixture ${fixtureId}:`, error);
    throw error;
  }
};

/**
 * Generic API call helper
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @returns {Promise} API response
 */
export const makeApiCall = async (endpoint, params = {}) => {
  try {
    const response = await apiClient.get(endpoint, { params });
    return response.data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
};

export default apiClient;
