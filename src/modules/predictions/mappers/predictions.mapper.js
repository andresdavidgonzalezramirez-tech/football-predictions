import {
  resolveMarketPresentation,
  translateMarketOption,
} from '../../../utils/marketTranslations';

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

export const mapPredictions = (response) => {
  const raw = response?.data ?? response ?? [];
  const items = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : [];

  return items.map((item) => {
    const marketType = item.type?.data ?? item.type ?? {};
    const marketKey = normalizeMarketKey(marketType);
    const marketIdentity = {
      marketCode: marketType.code ?? null,
      marketName: marketType.name ?? 'No disponible',
      developerName: marketType.developer_name ?? null,
    };
    const presentation = resolveMarketPresentation(marketIdentity);

    return {
      id: item.id ?? `${item.fixture_id}-${marketKey}`,
      fixtureId: item.fixture_id,
      marketKey,
      category: presentation.category,
      displayName: presentation.title,
      options: extractOptions(item.predictions ?? {}).map((option) => ({
        ...option,
        label: translateMarketOption(option.key, marketIdentity),
      })),
      source: 'predictions',
    };
  });
};
