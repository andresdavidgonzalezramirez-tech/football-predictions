const normalizeMarketKey = (type) => type?.code || type?.name || `type_${type?.id ?? 'unknown'}`;

export const normalizeProbabilities = (response) => {
  const raw = response?.data ?? response ?? [];
  const items = Array.isArray(raw) ? raw : raw?.data ?? [];
  const byMarket = {};

  items.forEach((item) => {
    const marketType = item.type?.data ?? item.type ?? {};
    const key = normalizeMarketKey(marketType);
    const predictions = item.predictions ?? {};
    const options = Object.entries(predictions)
      .filter(([, value]) => typeof value === 'number' || typeof value === 'string')
      .map(([optionKey, value]) => ({ key: optionKey, value }));

    const normalizedItem = {
      id: item.id ?? `${item.fixture_id}-${key}`,
      typeId: item.type_id,
      marketCode: marketType.code ?? null,
      marketName: marketType.name ?? 'No disponible',
      developerName: marketType.developer_name ?? null,
      predictions,
      options,
      fixtureId: item.fixture_id,
      source: 'predictions/probabilities',
    };

    byMarket[key] = byMarket[key] ?? [];
    byMarket[key].push(normalizedItem);
  });

  return {
    items: Object.values(byMarket).flat(),
    byMarket,
  };
};

export default normalizeProbabilities;
