export const buildGeneralMarketItem = ({ fixture, probabilities, valueBet }) => {
  const probabilityItem = probabilities?.items?.[0] ?? null;

  return {
    fixtureId: fixture?.fixtureId ?? null,
    teamsLabel: fixture?.teamsLabel ?? 'No disponible',
    league: fixture?.league ?? 'No disponible',
    kickoff: fixture?.kickoff ?? null,
    state: fixture?.state ?? 'No disponible',
    predictable: fixture?.predictable,
    venue: fixture?.venue ?? null,

    // Official inputs by source
    apiProbability: probabilityItem?.probability ?? null,
    marketOdd: valueBet?.marketOdd ?? null,
    fairOdd: valueBet?.fairOdd ?? null,
    bookmaker: valueBet?.bookmaker ?? null,
    bet: valueBet?.bet ?? null,

    // Internal aliases (derived/view-model)
    isValuePick: valueBet?.isValuePick ?? false,
    suggestedStake: valueBet?.suggestedStake ?? null,
    edgePercent: valueBet?.edgePercent ?? null,

    sources: {
      fixture: 'fixtures',
      probabilities: probabilityItem?.source ?? 'No disponible',
      valueBets: valueBet?.source ?? 'No disponible',
    },
  };
};

export default buildGeneralMarketItem;
