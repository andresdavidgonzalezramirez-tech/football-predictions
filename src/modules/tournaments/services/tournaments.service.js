import { fetchTournaments } from '../../../services/sportmonks/catalog.service';
import { mapTournaments } from '../mappers/tournaments.mapper';

export const getTournaments = async () => {
  const response = await fetchTournaments();
  return mapTournaments(response);
};
