import {
  resolveMarketPresentation,
  translateMarketOption,
} from '../../../utils/marketTranslations';

const normalizeMarketKey = (type) => type?.code || type?.name || `type_${type?.id ?? 'unknown'}`;
const isPrimitiveProbability = (value) => ['number', 'string'].includes(typeof value);

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

const extractFixtureMetric = (statsRows = [], matcher) => {
  const metric = statsRows.find((row) => {
    const typeName = String(row?.type?.data?.name ?? row?.type?.name ?? row?.type_name ?? '').toLowerCase();
    return matcher(typeName);
  });

  return toNumberOrNull(metric?.data?.value ?? metric?.value);
};

const extractOptions = (predictions = {}) => {
  if (!predictions || typeof predictions !== 'object') return [];

  return Object.entries(predictions).flatMap(([optionKey, optionValue]) => {
    if (isPrimitiveProbability(optionValue)) {
      return [{ key: optionKey, value: optionValue, rawKey: optionKey }];
    }

    if (optionValue && typeof optionValue === 'object') {
      return Object.entries(optionValue)
        .filter(([, nestedValue]) => isPrimitiveProbability(nestedValue))
        .map(([nestedKey, nestedValue]) => ({
          key: nestedKey,
          value: nestedValue,
          rawKey: `${optionKey}.${nestedKey}`,
        }));
    }

    return [];
  });
};

const buildOddsIndex = (oddsRows = []) => {
  const index = new Map();
  oddsRows.forEach((oddRow) => {
    const marketId = oddRow.market_id;
    const selection = String(oddRow.label ?? oddRow.selection_name ?? oddRow.name ?? '').toLowerCase();
    if (marketId == null || !selection) return;

    index.set(`${marketId}:${selection}`, {
      fairOdd: toNumberOrNull(oddRow.fair_odd),
      odd: oddRow.value ?? oddRow.odds ?? null,
    });
  });

  return index;
};

export const mapPredictions = (response) => {
  const predictionRows = normalizeRows(response, 'predictions');
  const oddsRows = normalizeRows(response, 'odds');
  const statsRows = normalizeStatsRows(response);

  const fixtureXg = extractFixtureMetric(
    statsRows,
    (typeName) => typeName.includes('expected goals') || typeName === 'xg' || typeName.includes('expected_goal'),
  );

  const fixturePressure = extractFixtureMetric(
    statsRows,
    (typeName) => typeName.includes('pressure') || typeName.includes('presión') || typeName.includes('presion'),
  );

  const oddsIndex = buildOddsIndex(oddsRows);

  return predictionRows.map((item) => {
    const marketType = item.type?.data ?? item.type ?? {};
    const marketKey = normalizeMarketKey(marketType);
    const marketIdentity = {
      marketCode: marketType.code ?? null,
      marketName: marketType.name ?? 'No disponible',
      developerName: marketType.developer_name ?? null,
    };

    const marketId = item.market_id ?? marketType.id ?? item.type_id ?? null;
    const presentation = resolveMarketPresentation(marketIdentity);
    const baseId = item.id ?? `${item.fixture_id}-${marketKey}`;

    return {
      id: baseId,
      fixtureId: item.fixture_id ?? null,
      marketId,
      marketKey,
      category: presentation.category,
      displayName: presentation.title,
      probability: toNumberOrNull(item.probability),
      xg: fixtureXg,
      pressure: fixturePressure,
      options: extractOptions(item.predictions ?? {}).map((option) => {
        const selectionKey = String(option.key ?? '').toLowerCase();
        const oddData = marketId != null ? oddsIndex.get(`${marketId}:${selectionKey}`) : null;

        return {
          ...option,
          value: toNumberOrNull(option.value) ?? option.value,
          label: translateMarketOption(option.key, marketIdentity),
          fairOdd: oddData?.fairOdd ?? null,
          odd: oddData?.odd ?? null,
        };
      }),
      source: 'predictions',
    };
  });
};
