const normalizeString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

export const resolveOddsMarketTitle = (marketName) => {
  const title = normalizeString(marketName);
  return title || 'Mercado';
};

const TOKEN_TRANSLATIONS = {
  draw: 'Empate',
  tie: 'Empate',
  yes: 'Sí',
  no: 'No',
  over: 'Más',
  under: 'Menos',
  odd: 'Impar',
  even: 'Par',
};

const replaceCoreToken = (value, { homeTeam, awayTeam } = {}) => {
  const raw = normalizeString(value);
  if (!raw) return '';

  const lower = raw.toLowerCase();
  // Convierte identificadores técnicos o ingleses a nombres reales o español
  if (lower === 'home' || raw === '1') return homeTeam || 'Local';
  if (lower === 'away' || raw === '2') return awayTeam || 'Visitante';
  if (lower === 'x') return 'Empate';
  if (TOKEN_TRANSLATIONS[lower]) return TOKEN_TRANSLATIONS[lower];
  return raw;
};

const translateByDelimiters = (value, teams = {}) => {
  const source = normalizeString(value);
  if (!source) return '';

  // Divide por separadores comunes en apuestas para traducir cada parte individualmente
  return source
    .split(/(\s*\/\s*|\s*-\s*|\s+or\s+|\s+y\s+)/i)
    .map((piece) => {
      if (!piece || /^(?:\s*\/\s*|\s*-\s*|\s+or\s+|\s+y\s+)$/i.test(piece)) {
        return piece.replace(/\s+or\s+/i, ' o ');
      }
      return replaceCoreToken(piece, teams);
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
};

const enrichWithContext = (base, odd = {}, teams = {}) => {
  const normalizedBase = normalizeString(base);
  const total = normalizeString(odd.total);
  const handicap = normalizeString(odd.handicap);
  const original = normalizeString(odd.original_label);
  const translatedHandicap = translateByDelimiters(handicap, teams);

  if (!normalizedBase && original) return original;

  // Si es un mercado de Over/Under y el total no está en el label, lo añade (ej: "Más" -> "Más 2.5")
  if (
    total &&
    normalizedBase &&
    !normalizedBase.includes(total) &&
    /(^|[\s/])(Más|Menos|Over|Under|Sí|No|Yes|No)([\s/]|$)/i.test(normalizedBase)
  ) {
    return `${normalizedBase} ${total}`.trim();
  }

  // Si es un mercado con hándicap, lo añade entre paréntesis
  if (
    translatedHandicap &&
    normalizedBase &&
    !normalizedBase.includes(translatedHandicap) &&
    ['1', '2', 'Home', 'Away', 'Draw', 'Tie'].includes(normalizeString(odd.label))
  ) {
    return `${normalizedBase} (${translatedHandicap})`;
  }

  return normalizedBase || original;
};

/**
 * Resuelve la etiqueta legible para una selección de cuota (Odd).
 * Prioriza la traducción y la inyección de nombres de equipos.
 */
export const resolveOddsSelectionLabel = (odd = {}, teams = {}) => {
  const label = normalizeString(odd.label);
  const name = normalizeString(odd.name);
  const original = normalizeString(odd.original_label);

  const primary = label || original || name;
  const translatedPrimary = translateByDelimiters(primary, teams);
  const withContext = enrichWithContext(translatedPrimary, odd, teams);

  if (withContext) return withContext;

  // Fallbacks seguros
  if (name) return translateByDelimiters(name, teams);
  if (original) return translateByDelimiters(original, teams);
  
  return 'Selección';
};