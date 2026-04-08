import { fetchFromSportmonks } from './client';

export const fetchFixtureStats = (fixtureId) => fetchFromSportmonks({
  cacheKey: `fixture_stats_${fixtureId}`,
  endpoint: '/stats',
  params: { fixtureId },
  ttl: 45_000,
  fallbackMessage: `No se pudieron cargar estadísticas para fixture ${fixtureId}.`,
});

export const fetchFixtureEvents = (fixtureId) => fetchFromSportmonks({
  cacheKey: `fixture_events_${fixtureId}`,
  endpoint: '/events',
  params: { fixtureId },
  ttl: 45_000,
  fallbackMessage: `No se pudieron cargar eventos para fixture ${fixtureId}.`,
});
