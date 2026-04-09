import { fetchFixtureById, fetchLeaguesWithUpcoming } from '../../../services/sportmonks/fixtures.service';
import { mapFixture } from '../mappers/fixtures.mapper';

export const getNormalizedLeaguesWithFixtures = async () => {
  const response = await fetchLeaguesWithUpcoming();
  const leagues = Array.isArray(response?.data) ? response.data : [];

  return leagues.map((league) => ({
    ...league,
    upcomingFixtures: (Array.isArray(league?.upcoming?.data)
      ? league.upcoming.data
      : Array.isArray(league?.upcoming)
        ? league.upcoming
        : []).map(mapFixture).filter(Boolean),
  }));
};

export const getNormalizedFixtureById = async (fixtureId) => {
  const response = await fetchFixtureById(fixtureId);
  return mapFixture(response);
};
