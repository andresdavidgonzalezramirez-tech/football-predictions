const normalizeMarketKey = (type) => type?.code || type?.name || `type_${type?.id ?? 'unknown'}`;

export const normalizeProbabilities = (response) => {
  const raw = response?.data ?? response ?? [];
  const items = Array.isArray(raw) ? raw : raw?.data ?? [];
  const byMarket = {};

  items.forEach((item) => {
    const marketType = item.type?.data ?? item.type ?? {};
    const key = normalizeMarketKey(marketType);

    byMarket[key] = {
      typeId: item.type_id,
      marketCode: marketType.code ?? null,
      marketName: marketType.name ?? 'No disponible',
      probability: item.predictions?.probability ?? item.predictions?.value ?? null,
      predictions: item.predictions ?? null,
      fixtureId: item.fixture_id,
      source: 'predictions/probabilities',
    };
  });

  return {
    items: Object.values(byMarket),
    byMarket,
  };
};

export default normalizeProbabilities;
