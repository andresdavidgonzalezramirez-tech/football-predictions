import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from './Badge';
import { getProbabilitiesByFixture } from '../services/sportsmonksApi';
import normalizeProbabilities from '../utils/normalizers/normalizeProbabilities';
import normalizeFixture from '../utils/normalizers/normalizeFixture';
import './LeagueCard.css';

const OPTION_LABELS = { 
  yes: 'Sí', 
  no: 'No', 
  equal: 'Igual', 
  home: 'Local', 
  away: 'Visitante', 
  draw: 'Empate' 
};

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

  // 3. Carga dinámica de probabilidades al expandir
  useEffect(() => {
    if (!isExpanded || fixtures.length === 0) return;
    let cancelled = false;

    const loadMarkets = async () => {
      const nextMarkets = {};
      const nextStatuses = {};

      // Cargamos solo los primeros 6 para no saturar la API
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

  // 4. Renderizado de la previsualización de cuotas
  const marketOptionsPreview = (fixtureId) => {
    const markets = marketsByFixture[fixtureId] ?? [];
    const market = markets[0]; // Tomamos el primer mercado disponible (ej. 1X2)
    if (!market?.options?.length) return null;

    return market.options.slice(0, 3).map((option) => (
      <span key={`${fixtureId}-${option.key}`} className="fixture-market-pill">
        {OPTION_LABELS[option.key] || option.key}: {option.value}%
      </span>
    ));
  };

  return (
    <div className="league-card fp-glow">
      <div
        className="league-card-header"
        onClick={() => setIsExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(!isExpanded)}
      >
        <div className="league-info">
          <div className="league-logo-wrap">
            <img src={league.image_path || '/vite.svg'} alt={league.name} className="league-logo" />
          </div>
          <div className="league-details">
            <h3 className="league-name">{league.name}</h3>
            <p className="league-country">{league.country?.name ?? 'País por confirmar'}</p>
          </div>
        </div>
        <div className="league-meta">
          <span className="fixtures-count">{fixtures.length} matches</span>
        </div>
      </div>

      {isExpanded && (
        <div className="fixtures-list">
          {fixtures.map((fixture) => (
            <div
              key={fixture.fixtureId}
              className="fixture-item"
              onClick={() => navigate(`/match/${fixture.fixtureId}`)}
            >
              <div className="fixture-core">
                <div className="fixture-teams">
                  <div className="team-block">
                    <img src={fixture.homeLogo || '/vite.svg'} alt="Home" />
                    <span className="team-name">{fixture.participants?.home?.name || 'Local'}</span>
                  </div>
                  <strong className="fixture-vs">VS</strong>
                  <div className="team-block">
                    <img src={fixture.awayLogo || '/vite.svg'} alt="Away" />
                    <span className="team-name">{fixture.participants?.away?.name || 'Visitante'}</span>
                  </div>
                </div>

                <div className="fixture-meta">
                  <span className="fixture-date">{fixture.kickoff || 'Fecha pendiente'}</span>
                  <span className="fixture-venue">{fixture.venue || 'Estadio pendiente'}</span>
                  
                  <div className="fixture-market-preview">
                    {marketOptionsPreview(fixture.fixtureId) || (
                      <span className="fixture-extra">
                        {marketStatusByFixture[fixture.fixtureId] === 'restricted'
                          ? 'Módulo Premium'
                          : 'Sin datos de mercado'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="fixture-badges">
                <Badge status={fixture.hasOdds ? 'available' : 'empty'} label="Odds" />
                <Badge status={fixture.hasPremiumOdds ? 'available' : 'restricted'} label="Premium" />
                <Badge status={getPredictableBadge(fixture)} label="Predictible" />
                <Badge 
                  status={fixture.placeholder ? 'empty' : 'available'} 
                  label={fixture.placeholder ? 'Placeholder API' : 'Fixture oficial'} 
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeagueCard;