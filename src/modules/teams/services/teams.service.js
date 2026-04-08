import { fetchTeams } from '../../../services/sportmonks/catalog.service';
import { mapTeams } from '../mappers/teams.mapper';

export const getTeams = async () => {
  const response = await fetchTeams();
  return mapTeams(response);
};
