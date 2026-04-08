import { fetchLiveScores } from '../../../services/sportmonks/live.service';
import { mapLiveScores } from '../mappers/live.mapper';

export const getLiveScores = async () => {
  const response = await fetchLiveScores();
  return mapLiveScores(response);
};
