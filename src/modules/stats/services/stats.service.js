import { fetchFixtureEvents, fetchFixtureStats } from '../../../services/sportmonks/stats.service';
import { mapFixtureEvents, mapFixtureStats } from '../mappers/stats.mapper';

export const getStatsByFixture = async (fixtureId) => {
  const response = await fetchFixtureStats(fixtureId);
  return mapFixtureStats(response);
};

export const getEventsByFixture = async (fixtureId) => {
  const response = await fetchFixtureEvents(fixtureId);
  return mapFixtureEvents(response);
};
