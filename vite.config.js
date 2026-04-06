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
          rewrite: () => `/leagues?api_token=${env.VITE_SPORTMONKS_API_TOKEN}&include=upcoming;country&timezone=Europe/Copenhagen`,
        },
        '/api/fixtures': {
          target: 'https://api.sportmonks.com/v3/football',
          changeOrigin: true,
          rewrite: (requestPath) => {
            // Extract fixture ID from path like /api/fixtures?id=123
            const url = new URL(requestPath, 'http://localhost');
            const id = url.searchParams.get('id');
            return `/fixtures/${id}?api_token=${env.VITE_SPORTMONKS_API_TOKEN}&include=participants;league;venue;state;scores;events.type;events.period;events.player;predictions.type&timezone=Europe/Copenhagen`;
          },
        }
      }
    }
  };
})
