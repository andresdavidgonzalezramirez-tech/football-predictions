const BASE_OPTION_LABELS = {
  home: 'Local',
  away: 'Visitante',
  draw: 'Empate',
  equal: 'Igual',
  yes: 'Sí',
  no: 'No',
  over: 'Más',
  under: 'Menos',
  local: 'Local',
  visitante: 'Visitante',
  empatizar: 'Empate',
  empate: 'Empate',
  sin: 'Sin',
  gol: 'gol',
};

const TECH_WORDS = new Set([
  'probability', 'probabilities', 'probabilidad', 'probabilidades', 'prediction', 'predictions',
  'market', 'markets', 'type', 'code', 'developer', 'name', 'developername',
]);

const MARKET_TRANSLATION_RULES = [
  {
    key: 'both_teams_to_score',
    title: 'Ambos equipos anotan',
    patterns: ['both-teams-to-score', 'both teams to score', 'btts', 'marcar-ambos-equipos'],
  },
  {
    key: 'team_to_score_first',
    title: 'Primer equipo en anotar',
    patterns: ['team_to_score_first', 'team to score first', 'first team to score', 'primer-equipo-en-anotar'],
  },
  {
    key: 'team_to_score_last',
    title: 'Último equipo en anotar',
    patterns: ['team_to_score_last', 'team to score last', 'last team to score', 'último-equipo-en-anotar'],
  },
  {
    key: 'double_chance',
    title: 'Doble oportunidad',
    patterns: ['double-chance', 'double chance', 'doble oportunidad', 'double_oportunidad'],
  },
  {
    key: 'correct_score',
    title: 'Marcador exacto',
    patterns: ['correct-score', 'correct score', 'puntuación-correcta', 'marcador exacto'],
  },
  {
    key: 'half_time_full_time',
    title: 'Medio tiempo / Final',
    patterns: ['half-time-full-time', 'half time/full time', 'half-time/full-time', 'descanso-tiempo-completo'],
  },
  {
    key: 'home_over_under',
    title: 'Local Más / Menos',
    patterns: ['home-over-under', 'home over/under', 'home under', 'local más/menos'],
  },
  {
    key: 'away_over_under',
    title: 'Visitante Más / Menos',
    patterns: ['away-over-under', 'away over/under', 'away under', 'visitante más/menos'],
  },
  {
    key: 'over_under',
    title: 'Más / Menos',
    patterns: ['over-under', 'over/under', 'total', 'más/menos'],
  },
  {
    key: 'corners',
    title: 'Córners',
    patterns: ['corners', 'corner', 'esquinas'],
  },
  {
    key: 'first_half_result',
    title: 'Resultado al descanso',
    patterns: ['first-half-winner', 'first half winner', '1st half result'],
  },
  {
    key: 'result',
    title: 'Resultado final',
    patterns: ['fulltime-result', 'fulltime result', 'match result', 'resultado final'],
  },
];

const CATEGORY_LABELS = {
  corners: 'Córners',
  first_half_result: 'Inicio Más/Menos',
  home_over_under: 'Local Más/Menos',
  away_over_under: 'Visitante Más/Menos',
  over_under: 'Más/Menos',
  result: 'Resultado',
  half_time_full_time: 'Resultado',
  double_chance: 'Resultado',
  both_teams_to_score: 'Otros mercados',
  team_to_score_first: 'Otros mercados',
  team_to_score_last: 'Otros mercados',
  correct_score: 'Otros mercados',
};

const cleanInput = (...parts) => parts
  .filter(Boolean)
  .join(' ')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

const extractGoalLine = (...parts) => {
  const text = cleanInput(...parts).replace(/_/g, '.');
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? match[1] : null;
};

const detectRule = (...parts) => {
  const text = cleanInput(...parts);
  return MARKET_TRANSLATION_RULES.find((rule) => rule.patterns.some((pattern) => text.includes(pattern)));
};

const sentenceCase = (value) => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const humanizeFallback = (...parts) => {
  const tokens = cleanInput(...parts)
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .filter((token) => !TECH_WORDS.has(token));

  if (!tokens.length) return 'Mercado';

  return sentenceCase(tokens.map((token) => BASE_OPTION_LABELS[token] ?? token).join(' '));
};

const tokenizeOption = (rawOption) => String(rawOption ?? '')
  .toLowerCase()
  .replace(/[()]/g, ' ')
  .replace(/\s*\/\s*/g, '_')
  .split(/[_\-\s]+/)
  .filter(Boolean);

const translateToken = (token) => BASE_OPTION_LABELS[token] ?? sentenceCase(token);

const buildDelimitedLabel = (tokens, separator = ' / ') => tokens
  .map(translateToken)
  .join(separator)
  .replace(/\s+/g, ' ')
  .trim();

const isOverUnderRule = (rule) => ['over_under', 'home_over_under', 'away_over_under'].includes(rule?.key);

export const translateMarketTitle = ({ marketName, marketCode, developerName } = {}) => {
  const rule = detectRule(marketName, marketCode, developerName);
  const line = extractGoalLine(marketName, marketCode, developerName);

  if (rule) {
    if (isOverUnderRule(rule) && line) {
      return `${rule.title} ${line}`;
    }
    return rule.title;
  }

  return humanizeFallback(marketName, marketCode, developerName);
};

export const classifyMarketCategory = ({ marketName, marketCode, developerName } = {}) => {
  const rule = detectRule(marketName, marketCode, developerName);
  if (!rule) return 'Otros mercados';
  return CATEGORY_LABELS[rule.key] ?? 'Otros mercados';
};

export const translateMarketOption = (optionKey, marketContext = {}) => {
  const raw = String(optionKey ?? '').trim();
  if (!raw) return 'Opción';

  const { marketName, marketCode, developerName } = marketContext;
  const rule = detectRule(marketName, marketCode, developerName);
  const normalized = raw.toLowerCase().replace(/\s+/g, '_');
  const tokens = tokenizeOption(normalized);

  if (isOverUnderRule(rule)) {
    const line = extractGoalLine(marketName, marketCode, developerName);
    if (line && (normalized === 'yes' || normalized === 'over')) return `Más de ${line}`;
    if (line && (normalized === 'no' || normalized === 'under')) return `Menos de ${line}`;
  }

  if (rule?.key === 'double_chance') {
    const normalizedPair = tokens.slice(0, 2);
    if (normalizedPair.length === 2) return buildDelimitedLabel(normalizedPair, ' o ');
  }

  if (rule?.key === 'half_time_full_time' && tokens.length >= 2) {
    return buildDelimitedLabel(tokens.slice(0, 2), ' / ');
  }

  if ((rule?.key === 'team_to_score_first' || rule?.key === 'team_to_score_last') && normalized === 'draw') {
    return 'Nadie / Sin gol';
  }

  if (tokens.length >= 2 && tokens.every((token) => ['home', 'away', 'draw'].includes(token))) {
    return buildDelimitedLabel(tokens.slice(0, 2), ' / ');
  }

  if (tokens.length === 2 && ['yes', 'no'].includes(tokens[1])) {
    return `${translateToken(tokens[0])}/${translateToken(tokens[1])}`;
  }

  if (tokens.length) return buildDelimitedLabel(tokens, ' ');

  return humanizeFallback(raw);
};

export const translateOddsLabel = (label, marketContext = {}, { homeTeam, awayTeam } = {}) => {
  const source = String(label ?? '').trim();
  if (!source) return 'Opción';

  const replacedTeams = source
    .replace(/\b1\b/g, homeTeam || 'Local')
    .replace(/\b2\b/g, awayTeam || 'Visitante')
    .replace(/\bhome\b/gi, homeTeam || 'Local')
    .replace(/\baway\b/gi, awayTeam || 'Visitante');

  return translateMarketOption(replacedTeams, marketContext)
    .replace(/\bEmpate\/No\b/gi, 'Empate/No')
    .replace(/\bEmpate\/Sí\b/gi, 'Empate/Sí');
};

export const formatProbabilityValue = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? '—');
  return `${number.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
};
