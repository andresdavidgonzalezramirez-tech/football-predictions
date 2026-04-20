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
  empate: 'Empate',
  empatizar: 'Empate',
  none: 'Nadie / Sin gol',
};

const TECH_WORDS = new Set([
  'probability', 'probabilities', 'probabilidad', 'probabilidades', 'prediction', 'predictions',
  'market', 'markets', 'type', 'code', 'developer', 'name', 'developername',
]);

const MARKET_TRANSLATION_RULES = [
  {
    key: 'fulltime_result',
    title: 'Probabilidad de resultado a tiempo completo',
    category: 'Resultado',
    patterns: ['fulltime-result', 'fulltime result', 'match result', 'resultado final'],
  },
  {
    key: 'correct_score',
    title: 'Probabilidad de marcador exacto',
    category: 'Marcador exacto',
    patterns: ['correct-score', 'correct score', 'puntuación-correcta', 'marcador exacto'],
  },
  {
    key: 'both_teams_to_score',
    title: 'Probabilidad de que ambos equipos anoten',
    category: 'Ambos anotan',
    patterns: ['both-teams-to-score', 'both teams to score', 'btts', 'marcar-ambos-equipos'],
  },
  {
    key: 'team_to_score_first',
    title: 'Probabilidad del equipo en anotar primero',
    category: 'Primer gol',
    patterns: ['team_to_score_first', 'team to score first', 'first team to score', 'primer-equipo-en-anotar'],
  },
  {
    key: 'team_to_score_last',
    title: 'Probabilidad del equipo en anotar último',
    category: 'Último gol',
    patterns: ['team_to_score_last', 'team to score last', 'last team to score', 'último-equipo-en-anotar'],
  },
  {
    key: 'first_half_result',
    title: 'Probabilidad de ganar la primera mitad',
    category: 'Primera mitad',
    patterns: ['first-half-winner', 'first half winner', '1st half result', 'fulltime-result-1st-half'],
  },
  {
    key: 'double_chance',
    title: 'Probabilidad de doble oportunidad',
    category: 'Resultado',
    patterns: ['double-chance', 'double chance', 'doble oportunidad', 'double_oportunidad'],
  },
  {
    key: 'half_time_full_time',
    title: 'Probabilidad de medio tiempo / final',
    category: 'Resultado',
    patterns: ['half-time-full-time', 'half time/full time', 'half-time/full-time', 'ht-ft'],
  },
  {
    key: 'asian_handicap',
    title: 'Asian Handicap',
    category: 'Asian Handicap',
    patterns: ['asian handicap', 'asian-handicap', 'ah'],
  },
  {
    key: 'home_over_under',
    title: 'Equipo local Más / Menos',
    category: 'Equipo local Más/Menos',
    patterns: ['home-over-under', 'home over/under', 'home under', 'inicio más/menos'],
  },
  {
    key: 'away_over_under',
    title: 'Visitante Más / Menos',
    category: 'Visitante Más/Menos',
    patterns: ['away-over-under', 'away over/under', 'away under', 'visitante más/menos'],
  },
  {
    key: 'corners',
    title: 'Tiros de esquina Más / Menos',
    category: 'Esquinas',
    patterns: ['corners over/under', 'corners-over-under', 'corners', 'corner', 'esquinas', 'tiros de esquina'],
  },
  {
    key: 'over_under',
    title: 'Posibilidad de gol',
    category: 'Posibilidad de gol',
    patterns: ['over-under', 'over/under', 'total', 'más/menos'],
  },
];

const cleanInput = (...parts) => parts
  .filter(Boolean)
  .join(' ')
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim();

const extractGoalLine = (...parts) => {
  const text = cleanInput(...parts).replace(/_/g, '.');
  const match = text.match(/([+-]?\d+(?:\.\d+)?)/);
  return match ? match[1] : null;
};

const detectRule = (...parts) => {
  const text = cleanInput(...parts);
  let bestMatch = null;

  MARKET_TRANSLATION_RULES.forEach((rule) => {
    rule.patterns.forEach((pattern) => {
      if (!text.includes(pattern)) return;

      const candidate = { rule, score: pattern.length };
      if (!bestMatch || candidate.score > bestMatch.score) {
        bestMatch = candidate;
      }
    });
  });

  return bestMatch?.rule ?? null;
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
  .replace(/\s+/g, '_')
  .split(/[_-]+/)
  .filter(Boolean);

const translateToken = (token) => 
  (/^emp(a|á)t/.test(token) ? 'Empate' : (BASE_OPTION_LABELS[token] ?? sentenceCase(token)));

const buildDelimitedLabel = (tokens, separator = ' / ') => tokens
  .map(translateToken)
  .join(separator)
  .replace(/\s+/g, ' ')
  .trim();

const isOverUnderRule = (rule) => ['over_under', 'home_over_under', 'away_over_under', 'corners'].includes(rule?.key);

const normalizeOptionRaw = (value) => String(value ?? '').trim().toLowerCase();

const isScoreToken = (value) => /^\d+[-:]\d+$/.test(String(value));

const parseAsianHandicapOption = (value) => {
  const normalized = normalizeOptionRaw(value).replace(/\s+/g, '_');
  const match = normalized.match(/^(home|away|local|visitante)[_:-]?([+-]?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const side = match[1] === 'home' || match[1] === 'local' ? 'Local' : 'Visitante';
  const line = Number(match[2]);
  if (!Number.isFinite(line)) return null;

  return `${side} ${line > 0 ? '+' : ''}${line}`;
};

export const resolveMarketPresentation = ({ marketName, marketCode, developerName } = {}) => {
  const rule = detectRule(marketName, marketCode, developerName);
  const line = extractGoalLine(marketName, marketCode, developerName);

  if (!rule) {
    return {
      ruleKey: null,
      title: humanizeFallback(marketName, marketCode, developerName),
      category: 'Otros mercados',
      line,
    };
  }

  const title = isOverUnderRule(rule) && line ? `${rule.title} ${line}` : rule.title;

  return {
    ruleKey: rule.key,
    title,
    category: rule.category,
    line,
  };
};

export const translateMarketTitle = (marketContext = {}) => resolveMarketPresentation(marketContext).title;

export const classifyMarketCategory = (marketContext = {}) => resolveMarketPresentation(marketContext).category;

export const translateMarketOption = (optionKey, marketContext = {}) => {
  const raw = String(optionKey ?? '').trim();
  if (!raw) return 'Opción';

  if (isScoreToken(raw)) return raw.replace(':', '-');

  const normalized = normalizeOptionRaw(raw);
  const tokens = tokenizeOption(normalized);
  const { ruleKey, line } = resolveMarketPresentation(marketContext);

  if (ruleKey === 'asian_handicap') {
    const asianLabel = parseAsianHandicapOption(normalized);
    if (asianLabel) return asianLabel;
  }

  if (['team_to_score_first', 'team_to_score_last'].includes(ruleKey) && ['draw', 'none', 'no_goal'].includes(normalized)) {
    return 'Nadie / Sin gol';
  }

  if (isOverUnderRule({ key: ruleKey })) {
    if (line && (normalized === 'yes' || normalized === 'over')) return `Más de ${line}`;
    if (line && (normalized === 'no' || normalized === 'under')) return `Menos de ${line}`;
    if (line && ['equal', 'exactly'].includes(normalized)) return `Exactamente ${line}`;
  }

  if (ruleKey === 'double_chance') {
    const map = {
      home_draw: 'Local o Empate',
      draw_away: 'Empate o Visitante',
      home_away: 'Local o Visitante',
    };
    if (map[normalized]) return map[normalized];
  }

  if (tokens.length >= 2 && tokens.every((token) => ['home', 'away', 'draw'].includes(token))) {
    return buildDelimitedLabel(tokens.slice(0, 2), ' / ');
  }

  if (tokens.length) return buildDelimitedLabel(tokens, ' ');

  return humanizeFallback(raw);
};

export const formatProbabilityValue = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? '—');
  return `${number.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
};
