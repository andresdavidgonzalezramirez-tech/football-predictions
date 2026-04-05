import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy API requests to SportMonks in development
        '/api/leagues': {
          target: 'https://api.sportmonks.com/v3/football',
          changeOrigin: true,
          rewrite: (path) => `/leagues?api_token=${env.VITE_SPORTMONKS_API_TOKEN}&include=upcoming;country&timezone=Europe/Copenhagen`,
        },
        '/api/fixtures': {
          target: 'https://api.sportmonks.com/v3/football',
          changeOrigin: true,
          rewrite: (path) => {
            // Extract fixture ID from path like /api/fixtures?id=123
            const url = new URL(path, 'http://localhost');
            const id = url.searchParams.get('id');
            return `/fixtures/${id}?api_token=${env.VITE_SPORTMONKS_API_TOKEN}&include=participants;league;venue;state;scores;events.type;events.period;events.player;predictions.type&timezone=Europe/Copenhagen`;
          },
        },
        '/api/odds': {
          target: 'https://api.sportmonks.com/v3/football',
          changeOrigin: true,
          rewrite: (path) => {
            // Extract fixtureId and bookmakerId from query params
            const url = new URL(path, 'http://localhost');
            const fixtureId = url.searchParams.get('fixtureId');
            const bookmakerId = url.searchParams.get('bookmakerId') || 2;
            return `/odds/pre-match/fixtures/${fixtureId}/bookmakers/${bookmakerId}?api_token=${env.VITE_SPORTMONKS_API_TOKEN}&include=market;fixture`;
          },
        }
      }
    }
  };
})
