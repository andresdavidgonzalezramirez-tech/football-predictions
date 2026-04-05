/**
 * Vercel Serverless Function - Fixtures Proxy
 * Proxies requests to SportMonks API to avoid CORS issues
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const API_TOKEN = process.env.VITE_SPORTMONKS_API_TOKEN;
    const { id } = req.query;

    if (!API_TOKEN) {
      return res.status(500).json({ error: 'API token not configured' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Fixture ID is required' });
    }

    // Build the SportMonks API URL
    const baseUrl = `https://api.sportmonks.com/v3/football/fixtures/${id}`;
    const params = new URLSearchParams({
      api_token: API_TOKEN,
      include: 'participants;league;venue;state;scores;events.type;events.period;events.player;predictions.type',
      timezone: 'Europe/Copenhagen',
    });

    const url = `${baseUrl}?${params.toString()}`;

    // Fetch from SportMonks API
    const response = await fetch(url);
    const data = await response.json();

    // Return the data
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error proxying fixture request:', error);
    return res.status(500).json({
      error: 'Failed to fetch fixture',
      message: error.message
    });
  }
}
