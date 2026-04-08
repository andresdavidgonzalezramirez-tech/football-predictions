import { fetchStandingsBySeason } from '../../../services/sportmonks/catalog.service';
import { mapStandings } from '../mappers/standings.mapper';

export const getStandingsBySeason = async (seasonId) => {
  const response = await fetchStandingsBySeason(seasonId);
  return mapStandings(response);
};
