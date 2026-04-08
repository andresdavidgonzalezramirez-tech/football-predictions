import { fetchProbabilitiesByFixture } from '../../../services/sportmonks/predictions.service';
import { mapPredictions } from '../mappers/predictions.mapper';

export const getPredictionsByFixture = async (fixtureId) => {
  const response = await fetchProbabilitiesByFixture(fixtureId);
  return mapPredictions(response);
};
