import { fetchFromSportmonks } from './client';

export const fetchPreMatchOddsByFixture = ({ fixtureId, bookmakerId }) => fetchFromSportmonks({
  cacheKey: `odds_${fixtureId}_${bookmakerId}`,
  endpoint: '/odds',
  params: { fixtureId, bookmakerId },
  ttl: 60_000,
  fallbackMessage: `No se pudieron cargar odds para fixture ${fixtureId}.`,
});
