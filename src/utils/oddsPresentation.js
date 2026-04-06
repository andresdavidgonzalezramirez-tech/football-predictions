const normalizeString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

export const resolveOddsMarketTitle = (marketName) => {
  const title = normalizeString(marketName);
  return title || 'Mercado';
};

export const resolveOddsSelectionLabel = (odd = {}) => {
  const label = normalizeString(odd.label);
  if (label) return label;

  const original = normalizeString(odd.original_label);
  if (original) return original;

  const name = normalizeString(odd.name);
  if (name) return name;

  return 'Selección';
};

