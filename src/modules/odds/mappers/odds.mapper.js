const normalizeLabel = (label = '') => String(label).trim() || 'Opción';

const toNumberOrNull = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const normalizeRows = (response, field) => {
  const unifiedRows = response?.data?.[field];
  if (Array.isArray(unifiedRows)) return unifiedRows;

  const raw = response?.data ?? response ?? [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

const normalizeStatsRows = (response) => {
  const unifiedRows = response?.data?.stats;
  if (Array.isArray(unifiedRows)) return unifiedRows;
  return [];
};

const findFixtureXg = (statsRows = []) => {
  const xgRow = statsRows.find((row) => {
    const typeName = String(row?.type?.data?.name ?? row?.type?.name ?? row?.type_name ?? '').toLowerCase();
    return typeName.includes('expected goals') || typeName === 'xg' || typeName.includes('expected_goal');
  });

  return toNumberOrNull(xgRow?.data?.value ?? xgRow?.value);
};

const buildPredictionProbabilityIndex = (predictionRows = []) => {
  const index = new Map();

  predictionRows.forEach((predictionRow) => {
    const predictions = predictionRow?.predictions;
    if (!predictions || typeof predictions !== 'object') return;

    Object.entries(predictions).forEach(([optionKey, optionValue]) => {
      const marketId = predictionRow?.market_id ?? predictionRow?.type_id ?? predictionRow?.type?.data?.id;
      const probability = toNumberOrNull(optionValue);
      if (marketId == null || probability == null) return;

      index.set(`${marketId}:${String(optionKey).toLowerCase()}`, probability);
    });
  });

  return index;
};

export const mapPreMatchOdds = (response) => {
  const oddsRows = normalizeRows(response, 'odds');
  const predictionRows = normalizeRows(response, 'predictions');
  const statsRows = normalizeStatsRows(response);
  const fixtureXg = findFixtureXg(statsRows);
  const probabilityIndex = buildPredictionProbabilityIndex(predictionRows);

  return oddsRows.map((item) => {
    const marketId = item.market_id ?? null;
    const selectionKey = String(item.label ?? item.selection_name ?? item.name ?? '').toLowerCase();
    const indexedProbability = marketId != null && selectionKey
      ? probabilityIndex.get(`${marketId}:${selectionKey}`)
      : null;

    return {
      id: item.id ?? `${item.fixture_id ?? 'fixture'}-${marketId ?? 'market'}-${selectionKey || 'option'}`,
      fixtureId: item.fixture_id ?? null,
      marketId,
      marketDescription: item.market_description ?? `Market ${marketId ?? 'N/A'}`,
      marketName: item.label ?? item.name ?? 'Mercado',
      value: item.value ?? item.odds ?? null,
      fairOdd: toNumberOrNull(item.fair_odd),
      probability: toNumberOrNull(item.probability) ?? indexedProbability,
      xg: fixtureXg,
      bookmakerId: item.bookmaker_id ?? null,
      bookmakerName: item.bookmaker?.data?.name ?? item.bookmaker?.name ?? 'Bookmaker',
      selection: normalizeLabel(item.label ?? item.selection_name ?? item.name),
      source: 'odds',
    };
  });
};
