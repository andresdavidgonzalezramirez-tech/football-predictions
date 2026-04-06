import { calculateEdgePercent } from '../oddsCalculator';

export const normalizeValueBets = (response) => {
  const raw = response?.data ?? response ?? [];
  const items = Array.isArray(raw) ? raw : raw?.data ?? [];

  return items.map((item) => {
    const predictions = item.predictions ?? {};
    const marketOdd = predictions.odd ?? null;
    const fairOdd = predictions.fair_odd ?? null;

    return {
      id: item.id,
      fixtureId: item.fixture_id,
      typeId: item.type_id ?? null,
      bet: predictions.bet ?? null,
      bookmaker: predictions.bookmaker ?? null,
      marketOdd,
      fairOdd,
      isValuePick: Boolean(predictions.is_value),
      suggestedStake: predictions.stake ?? null,
      edgePercent: calculateEdgePercent(marketOdd, fairOdd),
      source: 'predictions/value-bets',
    };
  });
};

export default normalizeValueBets;
