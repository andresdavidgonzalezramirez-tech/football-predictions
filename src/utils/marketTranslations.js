const OPTION_BASE_LABELS = {
  home: 'Local',
  away: 'Visitante',
  draw: 'Empate',
  equal: 'Igual',
  yes: 'Sí',
  no: 'No',
  over: 'Más',
  under: 'Menos',
};

const MARKET_TITLE_RULES = [
  { patterns: ['both-teams-to-score', 'both teams to score', 'btts'], label: 'Ambos equipos anotan' },
  { patterns: ['team_to_score_first', 'team to score first', 'first team to score'], label: 'Primer equipo en anotar' },
  { patterns: ['double-chance', 'double chance'], label: 'Doble oportunidad' },
  { patterns: ['correct-score', 'correct score'], label: 'Marcador exacto' },
  { patterns: ['half-time-full-time', 'half time/full time', 'half-time/full-time'], label: 'Medio tiempo / Final' },
  { patterns: ['first-half-winner', 'first half winner'], label: 'Ganador de la primera mitad' },
  { patterns: ['fulltime-result', 'fulltime result', 'result'], label: 'Resultado final' },
  { patterns: ['corners', 'corner'], label: 'Córners' },
  { patterns: ['home-over-under', 'home over/under'], label: 'Local Más / Menos' },
  { patterns: ['away-over-under', 'away over/under'], label: 'Visitante Más / Menos' },
  { patterns: ['over-under', 'over/under', 'total'], label: 'Más / Menos' },
];

const toSearchText = (...parts) => parts
  .filter(Boolean)
  .join(' ')
  .toLowerCase();

const extractGoalLine = (...parts) => {
  const text = toSearchText(...parts).replace(/_/g, '.');
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? match[1] : null;
};

const isOverUnderMarket = (...parts) => {
  const text = toSearchText(...parts);
  return text.includes('over-under') || text.includes('over/under');
};

const toReadableFallback = (value = '') => {
  const cleaned = String(value)
    .replace(/probability|probabilities|prediction|market|developer_name|type/gi, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'Mercado';

  return cleaned
    .split(' ')
    .map((word) => OPTION_BASE_LABELS[word.toLowerCase()] || (word[0]?.toUpperCase() + word.slice(1).toLowerCase()))
    .join(' ');
};

export const translateMarketTitle = ({ marketName, marketCode, developerName } = {}) => {
  const searchText = toSearchText(marketName, marketCode, developerName);
  const line = extractGoalLine(marketName, marketCode, developerName);

  const rule = MARKET_TITLE_RULES.find(({ patterns }) => patterns.some((pattern) => searchText.includes(pattern)));
  if (rule) {
    if (rule.label.includes('Más / Menos') && line) {
      return `${rule.label} ${line}`;
    }
    return rule.label;
  }

  return toReadableFallback(marketName || marketCode || developerName || 'Mercado');
};

export const translateOptionKey = (optionKey, marketContext = {}) => {
  const raw = String(optionKey ?? '').trim();
  if (!raw) return 'Opción';

  const normalized = raw.toLowerCase().replace(/\s+/g, '_');
  const { marketName, marketCode, developerName } = marketContext;

  if ((normalized === 'yes' || normalized === 'no') && isOverUnderMarket(marketName, marketCode, developerName)) {
    const line = extractGoalLine(marketName, marketCode, developerName);
    if (line) return normalized === 'yes' ? `Más de ${line}` : `Menos de ${line}`;
  }

  if (OPTION_BASE_LABELS[normalized]) return OPTION_BASE_LABELS[normalized];

  return normalized
    .split('_')
    .map((token) => OPTION_BASE_LABELS[token] || token)
    .join(' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const translateOddsLabel = (label, { homeTeam, awayTeam } = {}) => {
  const source = String(label ?? '').trim();
  if (!source) return 'Opción';

  let translated = source
    .replace(/\bhome\b/gi, homeTeam || 'Local')
    .replace(/\baway\b/gi, awayTeam || 'Visitante')
    .replace(/\bhogar\b/gi, homeTeam || 'Local')
    .replace(/\blejos\b/gi, awayTeam || 'Visitante')
    .replace(/\bdraw\b/gi, 'Empate')
    .replace(/\bdibujar\b/gi, 'Empate')
    .replace(/\bequal\b/gi, 'Igual');

  translated = translated
    .replace(/\s+/g, ' ')
    .trim();

  return translated;
};

export const formatProbabilityValue = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? '—');
  return `${number.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
};
