import { fetchFromSportmonks } from './client';

export const fetchLiveScores = () => fetchFromSportmonks({
  cacheKey: 'live_scores_latest',
  endpoint: '/live',
  ttl: 30_000,
  fallbackMessage: 'No se pudieron cargar livescores.',
});
