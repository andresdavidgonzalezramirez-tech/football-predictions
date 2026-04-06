import {
  resolveMarketPresentation,
  translateMarketOption,
} from '../marketTranslations';

const normalizeMarketKey = (type) => type?.code || type?.name || `type_${type?.id ?? 'unknown'}`;

const isPrimitiveProbability = (value) => ['number', 'string'].includes(typeof value);

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

const toMarketIdentity = (marketType = {}) => ({
  marketCode: marketType.code ?? null,
  marketName: marketType.name ?? 'No disponible',
  developerName: marketType.developer_name ?? null,
});

export const normalizeProbabilities = (response) => {
  const raw = response?.data ?? response ?? [];
  const items = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.predictions)
        ? raw.predictions
        : [];
  const byMarket = {};

  items.forEach((item) => {
    const marketType = item.type?.data ?? item.type ?? {};
    const marketKey = normalizeMarketKey(marketType);
    const marketIdentity = toMarketIdentity(marketType);
    const presentation = resolveMarketPresentation(marketIdentity);
    const normalizedOptions = extractOptions(item.predictions ?? {}).map((option) => ({
      ...option,
      label: translateMarketOption(option.key, marketIdentity),
    }));

    const normalizedItem = {
      id: item.id ?? `${item.fixture_id}-${marketKey}`,
      typeId: item.type_id,
      ...marketIdentity,
      marketKey,
      category: presentation.category,
      displayName: presentation.title,
      predictions: item.predictions ?? {},
      options: normalizedOptions,
      fixtureId: item.fixture_id,
      source: 'predictions/probabilities',
    };

    byMarket[marketKey] = byMarket[marketKey] ?? [];
    byMarket[marketKey].push(normalizedItem);
  });

  return {
    items: Object.values(byMarket).flat(),
    byMarket,
  };
};

export default normalizeProbabilities;
