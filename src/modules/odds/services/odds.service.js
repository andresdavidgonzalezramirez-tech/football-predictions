import { fetchPreMatchOddsByFixture } from '../../../services/sportmonks/odds.service';
import { mapPreMatchOdds } from '../mappers/odds.mapper';

export const getOddsByFixture = async ({ fixtureId, bookmakerId }) => {
  const response = await fetchPreMatchOddsByFixture({ fixtureId, bookmakerId });
  return mapPreMatchOdds(response);
};
