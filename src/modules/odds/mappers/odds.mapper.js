const normalizeLabel = (label = '') => String(label).trim() || 'Opción';

export const mapPreMatchOdds = (response) => {
  const raw = response?.data ?? response ?? [];
  const oddsRows = Array.isArray(raw) ? raw : [];

  return oddsRows.map((item) => ({
    id: item.id,
    fixtureId: item.fixture_id,
    marketId: item.market_id,
    marketDescription: item.market_description ?? `Market ${item.market_id}`,
    marketName: item.label ?? item.name ?? 'Mercado',
    value: item.value ?? item.odds ?? null,
    probability: item.probability ?? null,
    bookmakerId: item.bookmaker_id ?? null,
    bookmakerName: item.bookmaker?.data?.name ?? item.bookmaker?.name ?? 'Bookmaker',
    selection: normalizeLabel(item.label ?? item.selection_name ?? item.name),
    source: 'odds',
  }));
};
