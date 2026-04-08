import { fetchFromSportmonks } from './client';

export const fetchTeams = () => fetchFromSportmonks({
  cacheKey: 'teams_all',
  endpoint: '/teams',
  ttl: 300_000,
  fallbackMessage: 'No se pudieron cargar equipos.',
});

export const fetchTournaments = () => fetchFromSportmonks({
  cacheKey: 'tournaments_all',
  endpoint: '/tournaments',
  ttl: 300_000,
  fallbackMessage: 'No se pudieron cargar torneos.',
});

export const fetchStandingsBySeason = (seasonId) => fetchFromSportmonks({
  cacheKey: `standings_${seasonId}`,
  endpoint: '/standings',
  params: { seasonId },
  ttl: 180_000,
  fallbackMessage: `No se pudieron cargar standings para season ${seasonId}.`,
});
