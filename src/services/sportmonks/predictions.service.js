import { fetchFromSportmonks } from './client';

export const fetchProbabilitiesByFixture = (fixtureId) => fetchFromSportmonks({
  cacheKey: `predictions_${fixtureId}`,
  endpoint: '/predictions',
  params: { fixtureId },
  ttl: 90_000,
  fallbackMessage: `No se pudieron cargar predictions para fixture ${fixtureId}.`,
});
