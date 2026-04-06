import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from './Badge';
import { getProbabilitiesByFixture } from '../services/sportsmonksApi';
import normalizeProbabilities from '../utils/normalizers/normalizeProbabilities';
import normalizeFixture from '../utils/normalizers/normalizeFixture';
import { formatProbabilityValue, translateOptionKey } from '../utils/marketTranslations';
import './LeagueCard.css';

const LeagueCard = ({ league }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [marketsByFixture, setMarketsByFixture] = useState({});
  const [marketStatusByFixture, setMarketStatusByFixture] = useState({});
  const navigate = useNavigate();

  // 1. Normalización de partidos con memoización
  const fixtures = useMemo(() => {
    const fixturesRaw = league?.upcoming?.data ?? league?.upcoming ?? [];
    return fixturesRaw.map(normalizeFixture).filter(Boolean);
  }, [league]);

  // 2. Lógica de Badge Predictible
  const getPredictableBadge = (fixture) => {
    if (fixture.predictable === true || Number(fixture.predictable) > 0) return 'available';
    return 'empty';
  };

  // 3. Carga dinámica de probabilidades al expandir la liga (Densificación Sportsbook)
  useEffect(() => {
    if (!isExpanded || fixtures.length === 0) return;
    let cancelled = false;

    const loadMarkets = async () => {
      const nextMarkets = {};
      const nextStatuses = {};

      // Limitamos a los primeros 6 para optimizar llamadas a la API
      await Promise.all(
        fixtures.slice(0, 6).map(async (fixture) => {
          try {
            const response = await getProbabilitiesByFixture(fixture.fixtureId);
            const normalized = normalizeProbabilities(response);
            nextMarkets[fixture.fixtureId] = normalized.items;
            nextStatuses[fixture.fixtureId] = normalized.items.length > 0 ? 'available' : 'empty';
          } catch (error) {
            nextMarkets[fixture.fixtureId] = [];
            nextStatuses[fixture.fixtureId] = error.kind === 'plan_restricted' ? 'restricted' : 'empty';
          }
        }),
      );

      if (!cancelled) {
        setMarketsByFixture((prev) => ({ ...prev, ...nextMarkets }));
        setMarketStatusByFixture((prev) => ({ ...prev, ...nextStatuses }));
      }
    };

    loadMarkets();
    return () => { cancelled = true; };
  }, [isExpanded, fixtures]);

  // 4. Renderizado de la previsualización de cuotas reales con traducción
  const marketOptionsPreview = (fixtureId) => {
    const markets = marketsByFixture[fixtureId] ?? [];
    const market = markets[0];
    if (!market?.options?.length) return null;

    return market.options.slice(0, 3).map((option) => (
      <span key={`${fixtureId}-${option.key}`} className="fixture-market-pill">
        {translateOptionKey(option.key, market)}: {formatProbabilityValue(option.value)}
      </span>
    ));
  };

  return (
    <div className="league-card sportsbook-row">
      <div
        className="league-card-header"
        onClick={() => setIsExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(!isExpanded)}
      >
        <div className="league-info league-info-compact">
          <div className="league-logo-wrap">
            <img src={league.image_path || '/vite.svg'} alt={league.name || 'Liga'} className="league-logo" />
          </div>
          <div className="league-details">
            <h3 className="league-name">{league.name}</h3>
            <p className="league-country">{league.country?.name ?? 'Dato no disponible'}</p>
          </div>
        </div>

        <div className="league-meta sportsbook-meta">
          <span className="fixtures-count">{fixtures.length} partidos</span>
          <Badge
            status={fixtures.some((f) => f.hasOdds) ? 'available' : 'empty'}
            label={fixtures.some((f) => f.hasOdds) ? 'Con cuotas' : 'Sin cuotas'}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="fixtures-list sportsbook-table">
          {/* Cabecera de tabla alineada */}
          <div className="fixture-table-head">
            <span>Hora</span>
            <span>Partido</span>
            <span>Mercado principal</span>
            <span>Estado</span>
          </div>

          {fixtures.map((fixture) => (
            <div
              key={fixture.fixtureId}
              className="fixture-item sportsbook-fixture-row"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/match/${fixture.fixtureId}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/match/${fixture.fixtureId}`)}
            >
              {/* Columna 1: Hora */}
              <div className="fixture-time">{fixture.kickoff || 'Hora N/D'}</div>

              {/* Columna 2: Equipos alineados horizontalmente */}
              <div className="fixture-teams compact">
                <div className="team-block">
                  <img src={fixture.homeLogo || '/vite.svg'} alt="Home" />
                  <span className="team-name">{fixture.participants?.home?.name || 'Local'}</span>
                </div>
                <strong className="fixture-vs">vs</strong>
                <div className="team-block">
                  <img src={fixture.awayLogo || '/vite.svg'} alt="Away" />
                  <span className="team-name">{fixture.participants?.away?.name || 'Visitante'}</span>
                </div>
              </div>

              {/* Columna 3: Mercado Principal (Probabilidades Reales) */}
              <div className="fixture-market-preview">
                {marketOptionsPreview(fixture.fixtureId) || (
                  <span className="fixture-extra">
                    {marketStatusByFixture[fixture.fixtureId] === 'restricted'
                      ? 'No incluido en tu plan'
                      : 'Sin probabilidades'}
                  </span>
                )}
              </div>

              {/* Columna 4: Indicadores de estado */}
              <div className="fixture-badges">
                <Badge status={fixture.hasOdds ? 'available' : 'empty'} label="Cuotas" />
                <Badge status={getPredictableBadge(fixture)} label="Predicción" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeagueCard;