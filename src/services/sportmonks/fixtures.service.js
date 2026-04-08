import { fetchFromSportmonks } from './client';

export const fetchLeaguesWithUpcoming = () => fetchFromSportmonks({
  cacheKey: 'leagues_upcoming',
  endpoint: '/leagues',
  ttl: 120_000,
  fallbackMessage: 'No se pudo cargar el listado de ligas.',
});

export const fetchFixtureById = (fixtureId) => fetchFromSportmonks({
  cacheKey: `fixture_${fixtureId}`,
  endpoint: '/fixtures',
  params: { id: fixtureId },
  ttl: 180_000,
  fallbackMessage: `No se pudo cargar el fixture ${fixtureId}.`,
});

export const fetchFixturesByDate = (date) => fetchFromSportmonks({
  cacheKey: `fixtures_date_${date}`,
  endpoint: '/fixtures',
  params: { date },
  ttl: 60_000,
  fallbackMessage: `No se pudieron cargar fixtures para fecha ${date}.`,
});
